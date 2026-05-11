/**
 * Mock interface — synthetic Teensy that the app talks to during development.
 *
 * Responds to PING / STATUS, simulates a running protocol with realistic
 * shear-vs-time waveforms, and fakes microscope trigger pulses at 2 Hz.
 * Lets the entire UI develop without a Teensy or pump connected.
 *
 * Ported from `src/interface/mock.py`. Behavior — not code — preserved per
 * HANDOFF guidance.
 */

import { evaluateWaveform, type WaveformShape } from "@/domain/shear";

import type {
  ConnectionState,
  FaultEvent,
  FirmwareStatus,
  FlowChamberInterface,
  ProtocolCommand,
  TelemetryRunState,
  TelemetrySample,
} from "./interface";

type Handler<T> = (value: T) => void;

const TELEMETRY_HZ = 10;
const TELEMETRY_INTERVAL_MS = 1000 / TELEMETRY_HZ;
const TRIGGER_HZ = 2;
const TRIGGER_INTERVAL_MS = 1000 / TRIGGER_HZ;

interface ProtocolState extends ProtocolCommand {
  rampInS: number;
  rampOutS: number;
}

const IDLE_PROTOCOL: ProtocolState = {
  meanPa: 0,
  amplitudePa: 0,
  frequencyHz: 0,
  waveform: "dc",
  durationS: 0,
  rampInS: 0,
  rampOutS: 0,
};

export class MockInterface implements FlowChamberInterface {
  static readonly FIRMWARE_ID = "MOCK_flow_chamber 0.1.0 (synthetic)";

  private _connectionState: ConnectionState = "disconnected";
  private _running = false;
  private _runT0Ms = 0;
  private _state: TelemetryRunState = "IDLE";
  private _triggerCount = 0;
  private _fakeTempC = 36.7;
  private _protocol: ProtocolState = IDLE_PROTOCOL;
  // Non-null while in continuous (speed-control) mode. Distinguishes spin
  // mode from a protocol run so emitTelemetry can emit constant samples
  // instead of evaluating a waveform.
  private _continuousStepRateHz: number | null = null;

  private telemetryTimer: ReturnType<typeof setInterval> | null = null;
  private triggerTimer: ReturnType<typeof setInterval> | null = null;

  private connectionHandlers = new Set<Handler<ConnectionState>>();
  private telemetryHandlers = new Set<Handler<TelemetrySample>>();
  private faultHandlers = new Set<Handler<FaultEvent>>();
  private triggerHandlers = new Set<Handler<number>>();

  // ----------------------------------------------------------------------
  // Connection lifecycle
  // ----------------------------------------------------------------------

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  async connect(_port?: string): Promise<boolean> {
    this.setConnectionState("connected");
    return true;
  }

  async disconnect(): Promise<void> {
    await this.stop();
    this.setConnectionState("disconnected");
  }

  // ----------------------------------------------------------------------
  // Commands
  // ----------------------------------------------------------------------

  async ping(): Promise<string | null> {
    return this._connectionState === "connected" ? MockInterface.FIRMWARE_ID : null;
  }

  async status(): Promise<FirmwareStatus | null> {
    if (this._connectionState !== "connected") return null;
    return {
      name: "MOCK_flow_chamber",
      version: "0.1.0",
      state: this._state,
      uptimeMs: this._running ? Date.now() - this._runT0Ms : 0,
      triggerCount: this._triggerCount,
      pump: this._running ? "running" : "disabled",
      mock: true,
    };
  }

  async runProtocol(cmd: ProtocolCommand): Promise<boolean> {
    if (this._connectionState !== "connected") return false;
    if (this._running) return false;

    this._protocol = {
      meanPa: cmd.meanPa,
      amplitudePa: cmd.amplitudePa,
      frequencyHz: cmd.frequencyHz,
      waveform: cmd.waveform,
      durationS: cmd.durationS,
      rampInS: cmd.rampInS ?? 30,
      rampOutS: cmd.rampOutS ?? 30,
    };
    this._running = true;
    this._runT0Ms = Date.now();
    this._triggerCount = 0;
    this._state = "BASELINE";

    this.startTimers();
    return true;
  }

  async stop(): Promise<void> {
    if (!this._running) return;
    this._running = false;
    this._state = "IDLE";
    this._continuousStepRateHz = null;
    this.stopTimers();
    // Emit one final IDLE sample so the runtime store's runState/lastTelemetry
    // reset cleanly. Protocol-run completion takes the same path through
    // emitTelemetry's natural-end branch; explicit stop deserves the same
    // courtesy.
    this.emitIdleSample();
  }

  async prime(_flowMlMin: number, durationS: number): Promise<void> {
    await this.runProtocol({
      meanPa: 0.1,
      amplitudePa: 0,
      frequencyHz: 0,
      waveform: "dc",
      durationS,
      rampInS: 0,
      rampOutS: 0,
    });
  }

  /**
   * Start indefinite-duration continuous run at a fixed step rate. The
   * telemetry timer keeps emitting samples derived from this rate (no waveform
   * evaluation) until stop() or runProtocol() takes over. Bypasses the
   * run-folder lifecycle.
   */
  async startContinuous(stepRateHz: number): Promise<boolean> {
    if (this._connectionState !== "connected") return false;
    if (this._running) return false;

    const hz = Math.max(1, Math.min(20000, Math.round(stepRateHz)));
    this._continuousStepRateHz = hz;
    this._running = true;
    this._runT0Ms = Date.now();
    this._triggerCount = 0;
    this._state = "HOLDING";

    this.startTimers();
    return true;
  }

  /**
   * Live update the step rate while spinning. In continuous mode, this
   * directly updates the rate that telemetry samples will report. In protocol
   * mode (waveform-driven runProtocol), it's a no-op — the rate is derived
   * from the waveform; calling setStepRate during a protocol run reflects
   * firmware reality (firmware accepts RATE, but the renderer-driven waveform
   * loop will overwrite it on its next tick).
   */
  async setStepRate(stepRateHz: number): Promise<boolean> {
    if (this._connectionState !== "connected") return false;
    if (!this._running) return false;
    if (this._continuousStepRateHz == null) return false;

    const hz = Math.max(1, Math.min(20000, Math.round(stepRateHz)));
    this._continuousStepRateHz = hz;
    return true;
  }

  // ----------------------------------------------------------------------
  // Subscriptions
  // ----------------------------------------------------------------------

  onConnectionChange(handler: Handler<ConnectionState>): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onTelemetry(handler: Handler<TelemetrySample>): () => void {
    this.telemetryHandlers.add(handler);
    return () => this.telemetryHandlers.delete(handler);
  }

  onFault(handler: Handler<FaultEvent>): () => void {
    this.faultHandlers.add(handler);
    return () => this.faultHandlers.delete(handler);
  }

  onTriggerReceived(handler: Handler<number>): () => void {
    this.triggerHandlers.add(handler);
    return () => this.triggerHandlers.delete(handler);
  }

  // ----------------------------------------------------------------------
  // Internals
  // ----------------------------------------------------------------------

  private setConnectionState(state: ConnectionState): void {
    if (state === this._connectionState) return;
    this._connectionState = state;
    for (const h of this.connectionHandlers) h(state);
  }

  private startTimers(): void {
    this.stopTimers();
    this.telemetryTimer = setInterval(() => this.emitTelemetry(), TELEMETRY_INTERVAL_MS);
    this.triggerTimer = setInterval(() => this.fakeTrigger(), TRIGGER_INTERVAL_MS);
  }

  private stopTimers(): void {
    if (this.telemetryTimer) {
      clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
    if (this.triggerTimer) {
      clearInterval(this.triggerTimer);
      this.triggerTimer = null;
    }
  }

  private emitTelemetry(): void {
    if (!this._running) return;

    const runTimeS = (Date.now() - this._runT0Ms) / 1000;

    // Continuous (spin) mode: emit a constant sample at the dialed step rate.
    // No waveform, no envelope, no auto-completion — operator stops the run.
    if (this._continuousStepRateHz != null) {
      const stepRateHz = this._continuousStepRateHz;
      // Reverse-calibrate using the same factors as the protocol path so
      // status-bar shear/flow readouts stay coherent across modes.
      const flowMlMin = (stepRateHz * 60) / 6400.0;
      const shear = flowMlMin / 5.0;
      this._fakeTempC =
        36.7 + 0.1 * Math.sin(runTimeS / 30) + (Math.random() - 0.5) * 0.04;
      const sensor = mockSensorReading(flowMlMin, this._fakeTempC);
      const sample: TelemetrySample = {
        timestampUs: Date.now() * 1000,
        runTimeS,
        state: this._state,
        commandedShearPa: shear,
        commandedFlowMlMin: flowMlMin,
        commandedStepRateHz: stepRateHz,
        tempReservoirC: this._fakeTempC,
        triggerCount: this._triggerCount,
        faultCode: 0,
        ...sensor,
      };
      for (const h of this.telemetryHandlers) h(sample);
      return;
    }

    const { durationS, rampInS, rampOutS } = this._protocol;

    let envelope: number;
    if (runTimeS < rampInS) {
      this._state = "RAMPING";
      envelope = rampInS > 0 ? runTimeS / rampInS : 1.0;
    } else if (runTimeS < durationS - rampOutS) {
      this._state = "HOLDING";
      envelope = 1.0;
    } else if (runTimeS < durationS) {
      this._state = "RAMPING";
      envelope = rampOutS > 0 ? Math.max(0, (durationS - runTimeS) / rampOutS) : 0;
    } else {
      // Run complete
      this._state = "IDLE";
      this._running = false;
      this.stopTimers();
      return;
    }

    const baseShear = evaluateWaveform(runTimeS, {
      meanPa: this._protocol.meanPa,
      amplitudePa: this._protocol.amplitudePa,
      frequencyHz: this._protocol.frequencyHz,
      waveform: this._protocol.waveform as WaveformShape,
    });

    const shear = Math.max(0, envelope * baseShear);

    // Mock conversion factors — real implementation reads SystemSnapshot.
    const flowMlMin = shear * 5.0;
    const stepRateHz = (flowMlMin * 6400.0) / 60.0;

    // Slow temperature warble + tiny noise.
    this._fakeTempC =
      36.7 + 0.1 * Math.sin(runTimeS / 30) + (Math.random() - 0.5) * 0.04;

    const sensor = mockSensorReading(flowMlMin, this._fakeTempC);
    const sample: TelemetrySample = {
      timestampUs: Date.now() * 1000,
      runTimeS,
      state: this._state,
      commandedShearPa: shear,
      commandedFlowMlMin: flowMlMin,
      commandedStepRateHz: stepRateHz,
      tempReservoirC: this._fakeTempC,
      triggerCount: this._triggerCount,
      faultCode: 0,
      ...sensor,
    };

    for (const h of this.telemetryHandlers) h(sample);
  }

  private fakeTrigger(): void {
    if (!this._running) return;
    this._triggerCount += 1;
    for (const h of this.triggerHandlers) h(this._triggerCount);
  }

  private emitIdleSample(): void {
    const sensor = mockSensorReading(0, this._fakeTempC);
    const sample: TelemetrySample = {
      timestampUs: Date.now() * 1000,
      runTimeS: 0,
      state: "IDLE",
      commandedShearPa: 0,
      commandedFlowMlMin: 0,
      commandedStepRateHz: 0,
      tempReservoirC: this._fakeTempC,
      triggerCount: this._triggerCount,
      faultCode: 0,
      ...sensor,
    };
    for (const h of this.telemetryHandlers) h(sample);
  }
}

/**
 * Generate a plausible Sensirion SLF3C-1300F reading for the mock interface.
 *
 * The 1300F's flow output adds small noise around the actual rate (≤0.5% of
 * measured value or 0.01 ml/min — whichever is larger; per datasheet § 1).
 * Liquid temperature sits near the reservoir reading with very small drift.
 * Thermal conductivity is ~10000 a.u. for water (≈100 for air), used as a
 * media-identification signal — kept near 10k with imperceptible drift in
 * mock mode.
 *
 * Real wiring: replace this with the I²C frame parsed in `serial.ts` when
 * the SLF3C-1300F lands on the bench. The renderer-side widgets read from
 * `measuredFlowMlMin` / `measuredTempC` / `thermalConductivityAu` regardless
 * of the source.
 */
function mockSensorReading(
  commandedFlowMlMin: number,
  liquidTempC: number,
): {
  measuredFlowMlMin: number;
  measuredTempC: number;
  thermalConductivityAu: number;
  sensorFlags: number;
} {
  const flowNoise = (Math.random() - 0.5) * 0.04; // ~±0.02 ml/min
  const tempNoise = (Math.random() - 0.5) * 0.02; // ~±0.01 °C
  const tcNoise = (Math.random() - 0.5) * 30;     // ±15 a.u. — well below the 30 a.u. repeatability spec
  return {
    measuredFlowMlMin: commandedFlowMlMin + flowNoise,
    measuredTempC: liquidTempC + tempNoise,
    thermalConductivityAu: 10000 + tcNoise,
    sensorFlags: 0,
  };
}
