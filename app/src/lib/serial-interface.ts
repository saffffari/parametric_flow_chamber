/**
 * SerialInterface — renderer-side wrapper that implements
 * `FlowChamberInterface` by routing all calls through IPC to the main
 * process's `SerialService`.
 *
 * The actual `serialport` instance lives in main; this file is a thin shim.
 */

import { shearToStepRate, type CalibrationConstants } from "@/domain/shear";

import type {
  ConnectionState,
  FaultEvent,
  FirmwareStatus,
  FlowChamberInterface,
  ProtocolCommand,
  TelemetrySample,
} from "./interface";

type Handler<T> = (value: T) => void;

export class SerialInterface implements FlowChamberInterface {
  private _connectionState: ConnectionState = "disconnected";
  private getCalibration: () => CalibrationConstants;

  private connectionHandlers = new Set<Handler<ConnectionState>>();
  private telemetryHandlers = new Set<Handler<TelemetrySample>>();
  private faultHandlers = new Set<Handler<FaultEvent>>();
  private triggerHandlers = new Set<Handler<number>>();

  private unsubscribers: Array<() => void> = [];

  constructor(opts: { getCalibration: () => CalibrationConstants }) {
    this.getCalibration = opts.getCalibration;

    const api = window.flowChamber.serial;

    this.unsubscribers.push(
      api.onConnectionChange((state) => {
        this._connectionState = state;
        for (const h of this.connectionHandlers) h(state);
      }),
    );
    this.unsubscribers.push(
      api.onTelemetry((sample) => {
        for (const h of this.telemetryHandlers) h(sample);
      }),
    );
    this.unsubscribers.push(
      api.onFault((fault) => {
        for (const h of this.faultHandlers) h(fault);
      }),
    );

    // Hydrate initial connection state (in case main's already connected)
    void api.getState().then((state) => {
      this._connectionState = state;
    });
  }

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  async connect(port?: string): Promise<boolean> {
    if (!port) return false;
    return window.flowChamber.serial.connect(port);
  }

  async disconnect(): Promise<void> {
    return window.flowChamber.serial.disconnect();
  }

  async ping(): Promise<string | null> {
    // Smoke firmware: PING returns "PONG <name> <version>". For now, just
    // probe whether the port is connected.
    if (this._connectionState !== "connected") return null;
    await window.flowChamber.serial.sendRaw("PING");
    return "MOCK_or_smoke firmware (response via serial line stream)";
  }

  async status(): Promise<FirmwareStatus | null> {
    if (this._connectionState !== "connected") return null;
    await window.flowChamber.serial.sendRaw("STATUS?");
    return null; // status is asynchronous via line stream; v1 doesn't await it
  }

  async runProtocol(cmd: ProtocolCommand): Promise<boolean> {
    const cal = this.getCalibration();
    const stepRateHz = Math.round(shearToStepRate(cmd.meanPa, cal));
    return window.flowChamber.serial.runProtocol({
      meanPa: cmd.meanPa,
      amplitudePa: cmd.amplitudePa,
      frequencyHz: cmd.frequencyHz,
      waveform: cmd.waveform,
      durationS: cmd.durationS,
      rampInS: cmd.rampInS ?? 30,
      rampOutS: cmd.rampOutS ?? 30,
      stepRateHz,
    });
  }

  async stop(): Promise<void> {
    await window.flowChamber.serial.stop();
  }

  async prime(_flowMlMin: number, durationS: number): Promise<void> {
    await window.flowChamber.serial.prime(durationS);
  }

  async startContinuous(stepRateHz: number): Promise<boolean> {
    return window.flowChamber.serial.startContinuous(stepRateHz);
  }

  async setStepRate(stepRateHz: number): Promise<boolean> {
    return window.flowChamber.serial.setRate(stepRateHz);
  }

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

  /** Dispose IPC subscriptions; call when swapping to a different interface. */
  dispose(): void {
    for (const u of this.unsubscribers) u();
    this.unsubscribers = [];
    this.connectionHandlers.clear();
    this.telemetryHandlers.clear();
    this.faultHandlers.clear();
    this.triggerHandlers.clear();
  }
}
