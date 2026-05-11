/**
 * Shear-stress / flow-rate / step-rate conversions.
 *
 * Parallel-plate channel shear (fully-developed laminar flow):
 *
 *   τ = 6 · μ · Q / (w · h²)
 *
 *     τ  = wall shear stress              (Pa)
 *     μ  = dynamic viscosity              (Pa·s)        ≈ 0.9e-3 for α-MEM at 37 °C
 *     Q  = volumetric flow rate           (m³/s)
 *     w  = channel width                  (m)
 *     h  = channel height                 (m)
 *
 * Step-rate translation:
 *
 *   step_rate_hz = flow_ml_min · steps_per_ml / 60
 *
 * The operator dials shear in Pa; the firmware receives a step rate in Hz.
 * All public functions accept SI-friendly units (Pa, mL/min, mm). Callers
 * never have to think about meters-vs-mm.
 *
 * Ported from src/shear_math.py in the Python v0.1 controller (preserved at
 * archive/flow_chamber_v1/python_v0.1_app/ in the maintainer workspace).
 * Geometry and viscosity defaults are the canonical 24 mm × 50 mm × 0.25 mm
 * channel (matches the full Thorlabs CG15KH1 cover-glass footprint) at
 * μ = 0.9 mPa·s per planning/HANDOFF.md.
 */

export interface CalibrationConstants {
  /** Channel width in mm (canonical: 24.0). */
  channelWidthMm: number;
  /** Channel height in mm (canonical: 0.25). Hard-stop limited. */
  channelHeightMm: number;
  /** Active channel length in mm (canonical: 50.0). Informational; not in shear formula. */
  channelLengthMm: number;
  /** Dynamic viscosity in Pa·s (canonical: 0.9e-3 for α-MEM @ 37 °C). */
  viscosityPaS: number;
  /** Pump-tubing-specific gravimetric calibration (steps per mL). Replace from calibration day. */
  stepsPerMl: number;
  /** Pump motor rated maximum RPM (Kamoer KCS = 200). */
  pumpMaxRpm: number;
  /** Standard NEMA-17: 200 full steps per revolution. */
  motorStepsPerRev: number;
  /** TMC2209 external microstepping factor (firmware default: 16). */
  microstepping: number;
}

/**
 * Default calibration — canonical v2.0 chamber geometry. Override per-study via
 * the SystemSnapshot stamp (immutable per run) and per-installation via the
 * operator-app Settings drawer (live editable).
 */
export const DEFAULT_CALIBRATION: CalibrationConstants = {
  channelWidthMm: 24.0,
  channelHeightMm: 0.25,
  channelLengthMm: 50.0,
  viscosityPaS: 0.9e-3,
  stepsPerMl: 6400.0,
  pumpMaxRpm: 200.0,
  motorStepsPerRev: 200,
  microstepping: 16,
};

/** Hardware ceiling for STEP frequency. */
export function maxStepRateHz(cal: CalibrationConstants): number {
  return (
    (cal.pumpMaxRpm * cal.motorStepsPerRev * cal.microstepping) / 60.0
  );
}

/** τ (Pa) → Q (mL/min). Inverse of Hagen–Poiseuille for parallel plates. */
export function shearToFlowMlMin(
  shearPa: number,
  cal: CalibrationConstants,
): number {
  if (shearPa <= 0) return 0;
  const wM = cal.channelWidthMm * 1e-3;
  const hM = cal.channelHeightMm * 1e-3;
  // Q = τ · w · h² / (6 · μ)  in m³/s
  const qM3s = (shearPa * wM * hM * hM) / (6 * cal.viscosityPaS);
  // m³/s → mL/min:  × 1e6 (m³ → mL) × 60 (s → min)
  return qM3s * 1e6 * 60;
}

/** Q (mL/min) → τ (Pa). */
export function flowMlMinToShear(
  flowMlMin: number,
  cal: CalibrationConstants,
): number {
  if (flowMlMin <= 0) return 0;
  const wM = cal.channelWidthMm * 1e-3;
  const hM = cal.channelHeightMm * 1e-3;
  const qM3s = flowMlMin / 1e6 / 60;
  return (6 * cal.viscosityPaS * qM3s) / (wM * hM * hM);
}

/** Q (mL/min) → STEP frequency (Hz). */
export function flowMlMinToStepRate(
  flowMlMin: number,
  cal: CalibrationConstants,
): number {
  if (flowMlMin <= 0) return 0;
  return (flowMlMin * cal.stepsPerMl) / 60;
}

/** Direct τ (Pa) → STEP frequency (Hz). */
export function shearToStepRate(
  shearPa: number,
  cal: CalibrationConstants,
): number {
  return flowMlMinToStepRate(shearToFlowMlMin(shearPa, cal), cal);
}

/**
 * Computed upper bound of the shear knob given the current calibration.
 *
 * Determined by pump max RPM, not software preference. UI should clamp to
 * this; if the operator types higher we reject because the hardware
 * physically cannot deliver it.
 */
export function maxShearPa(cal: CalibrationConstants): number {
  const maxFlowMlMin = (maxStepRateHz(cal) * 60) / cal.stepsPerMl;
  return flowMlMinToShear(maxFlowMlMin, cal);
}

// -------------------------------------------------------------------------
// Waveform evaluation
// -------------------------------------------------------------------------

export type WaveformShape = "dc" | "sine" | "square" | "sawtooth";

export interface EvaluateWaveformParams {
  meanPa: number;
  amplitudePa: number;
  frequencyHz: number;
  waveform: WaveformShape;
  phaseDeg?: number;
}

/**
 * Evaluate the shear-vs-time function at time t (seconds).
 *
 * Returns the instantaneous commanded shear in Pa.
 *
 * Supported waveforms: 'dc', 'sine', 'square', 'sawtooth'. Sawtooth ramps
 * linearly from -1 to +1 over each period (matching the operator-panel icon).
 *
 * For amplitude=0 (or 'dc'), the function reduces to constant `meanPa`.
 * Output is clamped at zero — flow does not reverse direction.
 */
export function evaluateWaveform(
  tS: number,
  { meanPa, amplitudePa, frequencyHz, waveform, phaseDeg = 0 }: EvaluateWaveformParams,
): number {
  if (amplitudePa <= 0 || waveform === "dc" || frequencyHz <= 0) {
    return Math.max(0, meanPa);
  }

  const phaseRad = (phaseDeg * Math.PI) / 180;
  const omegaT = 2 * Math.PI * frequencyHz * tS + phaseRad;

  let modulation: number;
  switch (waveform) {
    case "sine":
      modulation = Math.sin(omegaT);
      break;
    case "square": {
      const cyclePos = (omegaT / (2 * Math.PI)) % 1;
      const wrapped = cyclePos < 0 ? cyclePos + 1 : cyclePos;
      modulation = wrapped < 0.5 ? 1 : -1;
      break;
    }
    case "sawtooth": {
      // Linear ramp from -1 → +1 over each period; jumps back to -1 at boundary.
      const cyclePos = (omegaT / (2 * Math.PI)) % 1;
      const wrapped = cyclePos < 0 ? cyclePos + 1 : cyclePos;
      modulation = 2 * wrapped - 1;
      break;
    }
    default:
      modulation = 0;
  }

  return Math.max(0, meanPa + amplitudePa * modulation);
}
