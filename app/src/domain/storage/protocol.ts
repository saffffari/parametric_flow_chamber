/**
 * Waveform protocol — the recipe for one run's shear-vs-time function.
 *
 * Six parameters describing one shear waveform:
 *   meanPa        — DC offset (always positive; flow doesn't reverse)
 *   amplitudePa   — peak deviation above/below mean. 0 → constant flow.
 *   frequencyHz   — oscillation rate. 0 → constant flow.
 *   waveform      — shape (dc / sine / square / triangle)
 *   phaseDeg      — starting phase (rarely changed)
 *   durationS     — total run time including ramps
 *
 * Plus envelope timing:
 *   rampInS       — time to ramp from 0 to mean at run start
 *   rampOutS      — time to ramp from mean to 0 at run end
 *
 * Wire-format-compatible with the Python v0.1 controller. Field naming follows
 * the on-disk JSON conventions (snake_case in the persisted form; camelCase in
 * TypeScript). Conversion handled by `ProtocolJson` / `toJson` / `fromJson`.
 */

import type { WaveformShape } from "@/domain/shear";

export interface Protocol {
  name: string;
  meanPa: number;
  amplitudePa: number;
  frequencyHz: number;
  waveform: WaveformShape;
  phaseDeg: number;
  durationS: number;
  rampInS: number;
  rampOutS: number;
}

/** On-disk JSON representation. Exact field names from Python v0.1. */
export interface ProtocolJson {
  schema?: "flowchamber-protocol/v1";
  name: string;
  mean_pa: number;
  amplitude_pa: number;
  frequency_hz: number;
  waveform: WaveformShape;
  phase_deg: number;
  duration_s: number;
  ramp_in_s: number;
  ramp_out_s: number;
}

export function makeProtocol(overrides: Partial<Protocol> = {}): Protocol {
  return {
    name: "untitled",
    meanPa: 1.0,
    amplitudePa: 0.0,
    frequencyHz: 1.0,
    waveform: "dc",
    phaseDeg: 0,
    durationS: 600,
    rampInS: 30,
    rampOutS: 30,
    ...overrides,
  };
}

export function protocolToJson(p: Protocol): ProtocolJson {
  return {
    schema: "flowchamber-protocol/v1",
    name: p.name,
    mean_pa: p.meanPa,
    amplitude_pa: p.amplitudePa,
    frequency_hz: p.frequencyHz,
    waveform: p.waveform,
    phase_deg: p.phaseDeg,
    duration_s: p.durationS,
    ramp_in_s: p.rampInS,
    ramp_out_s: p.rampOutS,
  };
}

export function protocolFromJson(j: ProtocolJson): Protocol {
  return {
    name: j.name,
    meanPa: j.mean_pa,
    amplitudePa: j.amplitude_pa,
    frequencyHz: j.frequency_hz,
    waveform: j.waveform,
    phaseDeg: j.phase_deg ?? 0,
    durationS: j.duration_s,
    rampInS: j.ramp_in_s ?? 30,
    rampOutS: j.ramp_out_s ?? 30,
  };
}

/** One-line human summary used in tooltips / list rows. */
export function describeProtocol(p: Protocol): string {
  if (p.waveform === "dc" || p.amplitudePa === 0) {
    return `${p.meanPa.toFixed(2)} Pa steady, ${p.durationS.toFixed(0)}s`;
  }
  return (
    `${p.meanPa.toFixed(2)} Pa ± ${p.amplitudePa.toFixed(2)} Pa ` +
    `@ ${p.frequencyHz.toFixed(2)} Hz ${p.waveform}, ` +
    `${p.durationS.toFixed(0)}s`
  );
}

/** Default presets — saved to a new study on creation as starter examples. */
export const DEFAULT_PRESETS: Protocol[] = [
  makeProtocol({
    name: "Baseline 0.5 Pa",
    meanPa: 0.5,
    amplitudePa: 0,
    waveform: "dc",
    durationS: 600,
  }),
  makeProtocol({
    name: "1 Pa Sine 1 Hz",
    meanPa: 1.0,
    amplitudePa: 0.5,
    frequencyHz: 1.0,
    waveform: "sine",
    durationS: 1800,
  }),
  makeProtocol({
    name: "2 Pa Square 1 Hz",
    meanPa: 2.0,
    amplitudePa: 1.0,
    frequencyHz: 1.0,
    waveform: "square",
    durationS: 1800,
  }),
];
