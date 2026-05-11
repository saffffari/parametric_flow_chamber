/**
 * Hardware-agnostic interface contract for the flow chamber.
 *
 * The app talks to whichever implementation is active — `MockInterface` in
 * dev, `SerialInterface` (real Teensy) in production. Switching is a single
 * config change at app boot.
 *
 * Ported from `src/interface/base.py` in the Python v0.1 controller. Qt
 * `Signal`s are replaced by EventEmitter-style `on*` callback registrations.
 */

import type { WaveformShape } from "@/domain/shear";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface TelemetrySample {
  timestampUs: number;
  runTimeS: number;
  state: TelemetryRunState;
  commandedShearPa: number;
  commandedFlowMlMin: number;
  commandedStepRateHz: number;
  tempReservoirC: number;
  triggerCount: number;
  faultCode: number;

  // ---- Sensirion SLF3C-1300F measured fields (optional until sensor wired). ----
  // The 1300F reports flow (±40 ml/min calibrated), liquid temperature, and
  // a thermal-conductivity reading (a.u.; ~100 air, ~10000 water) at up to
  // ~2 kHz over I²C. The renderer treats these as optional so mock-mode and
  // pre-sensor builds keep working; the live-trace widgets fall back to the
  // commanded values until measured fields appear.
  measuredFlowMlMin?: number;
  /** Sensor-side liquid temperature in °C. Distinct from `tempReservoirC` (DS18B20). */
  measuredTempC?: number;
  /** Thermal conductivity, arbitrary units. Useful as media identification (water ≈ 10000, air ≈ 100). */
  thermalConductivityAu?: number;
  /** Sensor signaling flags — air-in-line / high-flow / smoothing-active. Bit-packed per datasheet. */
  sensorFlags?: number;
}

export type TelemetryRunState =
  | "IDLE"
  | "BASELINE"
  | "RAMPING"
  | "HOLDING"
  | "RECOVERY"
  | "FAULT";

export interface FaultEvent {
  timestampUs: number;
  code: number;
  description: string;
}

export interface PortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

export interface ProtocolCommand {
  meanPa: number;
  amplitudePa: number;
  frequencyHz: number;
  waveform: WaveformShape;
  durationS: number;
  rampInS?: number;
  rampOutS?: number;
}

export interface FirmwareStatus {
  name: string;
  version: string;
  state: TelemetryRunState | "DISABLED";
  uptimeMs: number;
  triggerCount: number;
  pump: "running" | "disabled";
  mock?: boolean;
}

export interface FlowChamberInterface {
  /** Current connection state. Subscribe to `onConnectionChange` for transitions. */
  readonly connectionState: ConnectionState;

  /** Open serial connection (or activate mock). Resolves true on success. */
  connect(port?: string): Promise<boolean>;

  /** Tear down connection. */
  disconnect(): Promise<void>;

  /** PING → firmware identification string, or null on failure. */
  ping(): Promise<string | null>;

  /** STATUS? → current firmware state. */
  status(): Promise<FirmwareStatus | null>;

  /** Start a protocol. Resolves true if firmware accepted. */
  runProtocol(cmd: ProtocolCommand): Promise<boolean>;

  /** STOP — disable pump and end any active protocol. */
  stop(): Promise<void>;

  /** Run pump at constant low flow for priming the tubing. */
  prime(flowMlMin: number, durationS: number): Promise<void>;

  /**
   * Start an indefinite-duration motor run at the given STEP rate. Used by
   * the speed-control surface for live bench tuning — bypasses the run
   * lifecycle (no study folder, no run folder, no telemetry CSV). Halt with
   * `stop()`. Live-update the rate with `setStepRate()` while spinning.
   */
  startContinuous(stepRateHz: number): Promise<boolean>;

  /**
   * Live STEP-rate update during an active run (continuous OR protocol).
   * No-op-ish if nothing is spinning — the firmware errors with
   * "ERR no active run" but the call resolves false / void without throwing.
   */
  setStepRate(stepRateHz: number): Promise<boolean>;

  /** Subscribe to connection-state transitions. Returns an unsubscribe fn. */
  onConnectionChange(handler: (state: ConnectionState) => void): () => void;

  /** Subscribe to live telemetry stream. Returns an unsubscribe fn. */
  onTelemetry(handler: (sample: TelemetrySample) => void): () => void;

  /** Subscribe to fault events. Returns an unsubscribe fn. */
  onFault(handler: (fault: FaultEvent) => void): () => void;

  /** Subscribe to microscope-trigger pulses. Returns an unsubscribe fn. */
  onTriggerReceived(handler: (count: number) => void): () => void;
}
