/**
 * Serial-port service (main process).
 *
 * Owns the single SerialPort instance to the Teensy. Exposes:
 *   - listPorts()           — enumerate available USB serial devices
 *   - connect(path)         — open the port, register parser
 *   - disconnect()          — close the port
 *   - send(line)            — write one line (newline-terminated)
 *   - on(event, handler)    — subscribe to data, status, telemetry, disconnect
 *
 * Parses the existing smoke-firmware response surface:
 *   PONG ... | OK ... | ERR ... | BOOT ...
 *
 * For DC protocol runs, polls STATUS at 10 Hz once a run is started, parses
 * key=value pairs, and synthesizes telemetry samples that match the
 * `TelemetrySample` shape expected by the renderer.
 */

import { EventEmitter } from "node:events";
import { createRequire } from "node:module";

import type {
  ConnectionState,
  TelemetryRunState,
  TelemetrySample,
} from "../shared/types";

// Lazy-load serialport so the app boots even if the native binding has issues —
// errors surface in-app when the user tries to connect, instead of crashing on launch.
const requireFromHere = createRequire(typeof __filename !== "undefined" ? __filename : process.execPath);

interface SerialPortLike {
  isOpen: boolean;
  pipe<T>(parser: T): T;
  open(cb: (err: Error | null) => void): void;
  close(cb?: () => void): void;
  write(data: string | Buffer): boolean;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

interface SerialPortClassLike {
  new (options: { path: string; baudRate: number; autoOpen?: boolean }): SerialPortLike;
  list(): Promise<Array<{
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    vendorId?: string;
    productId?: string;
  }>>;
}

interface ReadlineParserClassLike {
  new (options: { delimiter: string }): {
    on(event: "data", listener: (line: string) => void): void;
  };
}

let _SerialPort: SerialPortClassLike | null = null;
let _ReadlineParser: ReadlineParserClassLike | null = null;

function loadSerialPort(): { SerialPort: SerialPortClassLike; ReadlineParser: ReadlineParserClassLike } {
  if (!_SerialPort) {
    const sp = requireFromHere("serialport");
    _SerialPort = sp.SerialPort as SerialPortClassLike;
  }
  if (!_ReadlineParser) {
    const rp = requireFromHere("@serialport/parser-readline");
    _ReadlineParser = rp.ReadlineParser as ReadlineParserClassLike;
  }
  return { SerialPort: _SerialPort, ReadlineParser: _ReadlineParser };
}

const BAUD_RATE = 115200;
const STATUS_POLL_HZ = 10;
const STATUS_POLL_INTERVAL_MS = 1000 / STATUS_POLL_HZ;

interface FirmwareStatusKv {
  state?: string;
  step_rate_hz?: number;
  step_count?: number;
  driver_enabled?: number;
  uptime_ms?: number;
  rows?: number;
  dir?: number;
  pump?: string;
  sd?: string;
  log?: string;
  name?: string;
  version?: string;
  trigger_in_count?: number;
  trigger_out_count?: number;
}

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

export interface RunCommand {
  meanPa: number;
  /** Computed step rate from shear → flow → step rate via app-side math. */
  stepRateHz: number;
  durationS: number;
}

export class SerialService extends EventEmitter {
  private port: SerialPortLike | null = null;
  private _connectionState: ConnectionState = "disconnected";

  private currentRun: {
    startMs: number;
    durationS: number;
    meanPa: number;
    flowMlMin: number;
    stepRateHz: number;
    state: TelemetryRunState;
  } | null = null;

  private statusPollTimer: NodeJS.Timeout | null = null;
  private telemetrySampleCount = 0;

  // Last firmware status (parsed from latest STATUS reply)
  private lastStatus: FirmwareStatusKv = {};

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  // ----------------------------------------------------------------------
  // Port enumeration
  // ----------------------------------------------------------------------

  async listPorts(): Promise<SerialPortInfo[]> {
    const { SerialPort } = loadSerialPort();
    const ports = await SerialPort.list();
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      vendorId: p.vendorId,
      productId: p.productId,
    }));
  }

  // ----------------------------------------------------------------------
  // Connect / disconnect
  // ----------------------------------------------------------------------

  async connect(path: string): Promise<boolean> {
    if (this.port?.isOpen) {
      await this.disconnect();
    }

    this.setConnectionState("connecting");

    let SerialPort: SerialPortClassLike;
    let ReadlineParser: ReadlineParserClassLike;
    try {
      const loaded = loadSerialPort();
      SerialPort = loaded.SerialPort;
      ReadlineParser = loaded.ReadlineParser;
    } catch (err) {
      this.emit("error", err);
      this.setConnectionState("error");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const port = new SerialPort({
        path,
        baudRate: BAUD_RATE,
        autoOpen: false,
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

      port.open((err) => {
        if (err) {
          this.emit("error", err);
          this.setConnectionState("error");
          resolve(false);
          return;
        }

        this.port = port;

        parser.on("data", ((line: string) => this.handleLine(line.trim())) as (...args: unknown[]) => void);

        port.on("close", () => {
          this.cleanupPort();
          this.setConnectionState("disconnected");
        });

        port.on("error", ((e: Error) => {
          this.emit("error", e);
          this.setConnectionState("error");
        }) as (...args: unknown[]) => void);

        this.setConnectionState("connected");
        // Send PING to verify firmware identity and trigger STATUS-able state
        this.send("PING");
        resolve(true);
      });
    });
  }

  async disconnect(): Promise<void> {
    this.stopStatusPolling();
    if (this.currentRun) {
      this.send("STOP");
      this.currentRun = null;
    }

    return new Promise<void>((resolve) => {
      if (!this.port) {
        resolve();
        return;
      }
      this.port.close(() => {
        this.cleanupPort();
        this.setConnectionState("disconnected");
        resolve();
      });
    });
  }

  // ----------------------------------------------------------------------
  // Commands
  // ----------------------------------------------------------------------

  send(line: string): boolean {
    if (!this.port?.isOpen) return false;
    this.port.write(`${line}\n`);
    return true;
  }

  /**
   * Issue a DC run via the smoke firmware's `JOG <hz> <ms>` command.
   * Starts internal STATUS polling and telemetry emission.
   *
   * Future waveform support requires firmware extension; for now this is
   * DC-only (sufficient for Lu 2012-style steady-flow experiments).
   */
  startRun(cmd: RunCommand): boolean {
    if (this._connectionState !== "connected") return false;
    if (this.currentRun) return false;

    const durationMs = Math.max(1, Math.round(cmd.durationS * 1000));
    const stepRateHz = Math.max(1, Math.round(cmd.stepRateHz));

    if (!this.send(`JOG ${stepRateHz} ${durationMs}`)) return false;

    this.currentRun = {
      startMs: Date.now(),
      durationS: cmd.durationS,
      meanPa: cmd.meanPa,
      flowMlMin: 0,
      stepRateHz,
      state: "HOLDING",
    };
    this.telemetrySampleCount = 0;
    this.startStatusPolling();
    return true;
  }

  stopRun(): boolean {
    if (!this.currentRun) {
      this.send("STOP");
      return true;
    }
    this.send("STOP");
    this.stopStatusPolling();
    this.emitFinalSample();
    this.currentRun = null;
    return true;
  }

  prime(durationS: number): boolean {
    // Prime is just a low-rate JOG; safe-ish for tubing flush.
    const stepRateHz = 200;
    return this.send(`JOG ${stepRateHz} ${Math.round(durationS * 1000)}`);
  }

  /**
   * Start an indefinite-duration motor run at the given step rate. Issues
   * `JOG <hz> 0`, which the firmware (≥ 0.4.0) treats as a continuous run with
   * no auto-stop. Halt via stop() or by issuing STOP from any other path.
   *
   * Does not set `currentRun` or start STATUS polling — speed control bypasses
   * the run-lifecycle telemetry path. Run-folder telemetry stays gated on
   * `startRun`. The renderer is responsible for follow-up RATE / STOP commands.
   */
  startContinuous(stepRateHz: number): boolean {
    if (this._connectionState !== "connected") return false;
    const hz = Math.max(1, Math.min(20000, Math.round(stepRateHz)));
    return this.send(`JOG ${hz} 0`);
  }

  /**
   * Live rate update during an active run (started via JOG or
   * startContinuous). Firmware (≥ 0.4.0) errors with "ERR no active run" if
   * nothing is spinning — error surfaces on the line stream, not the return
   * value, so callers that mis-time a setRate get a debug breadcrumb but no
   * exception.
   */
  setRate(stepRateHz: number): boolean {
    if (this._connectionState !== "connected") return false;
    const hz = Math.max(1, Math.min(20000, Math.round(stepRateHz)));
    return this.send(`RATE ${hz}`);
  }

  // ----------------------------------------------------------------------
  // Internals — line parsing
  // ----------------------------------------------------------------------

  private handleLine(line: string): void {
    if (!line) return;

    // Fan out raw lines to interested subscribers (for debug / status).
    this.emit("line", line);

    // Smoke firmware status format:
    //   OK name=... version=... state=READY uptime_ms=... sd=ready log=... rows=N step_rate_hz=N ...
    if (line.startsWith("OK ") || line.startsWith("BOOT ")) {
      const kv = parseKv(line);
      if (kv.state) {
        this.lastStatus = { ...this.lastStatus, ...kv };
      }
    }
  }

  private startStatusPolling(): void {
    this.stopStatusPolling();
    this.statusPollTimer = setInterval(() => {
      this.send("STATUS?");
      this.emitTelemetrySample();
    }, STATUS_POLL_INTERVAL_MS);
  }

  private stopStatusPolling(): void {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

  private emitTelemetrySample(): void {
    if (!this.currentRun) return;

    const runTimeS = (Date.now() - this.currentRun.startMs) / 1000;
    if (runTimeS >= this.currentRun.durationS) {
      this.emitFinalSample();
      this.currentRun = null;
      this.stopStatusPolling();
      return;
    }

    // Map firmware state to TelemetryRunState.
    const fwState = this.lastStatus.state ?? "READY";
    const driverEnabled = this.lastStatus.driver_enabled === 1;
    let state: TelemetryRunState;
    if (fwState === "FAULT") state = "FAULT";
    else if (fwState === "MOTORJOG" && driverEnabled) state = "HOLDING";
    else if (fwState === "MOTORJOG") state = "RAMPING";
    else if (fwState === "STEPTEST") state = "RAMPING";
    else state = "IDLE";

    const stepRateHz = this.lastStatus.step_rate_hz ?? this.currentRun.stepRateHz;
    // commanded values come from the run (we know what we asked for);
    // measured values come from firmware (step_rate_hz, trigger_in_count, etc.).
    const sample: TelemetrySample = {
      timestampUs: Date.now() * 1000,
      runTimeS,
      state,
      commandedShearPa: this.currentRun.meanPa,
      commandedFlowMlMin: this.currentRun.flowMlMin,
      commandedStepRateHz: stepRateHz,
      tempReservoirC: 0, // no DS18B20 in smoke firmware; populate when added
      triggerCount: this.lastStatus.trigger_in_count ?? 0,
      faultCode: state === "FAULT" ? 1 : 0,
    };

    this.telemetrySampleCount += 1;
    this.emit("telemetry", sample);
  }

  private emitFinalSample(): void {
    if (!this.currentRun) return;
    const runTimeS = (Date.now() - this.currentRun.startMs) / 1000;
    const sample: TelemetrySample = {
      timestampUs: Date.now() * 1000,
      runTimeS,
      state: "IDLE",
      commandedShearPa: 0,
      commandedFlowMlMin: 0,
      commandedStepRateHz: 0,
      tempReservoirC: 0,
      triggerCount: 0,
      faultCode: 0,
    };
    this.emit("telemetry", sample);
  }

  private cleanupPort(): void {
    this.stopStatusPolling();
    this.port = null;
    this.currentRun = null;
  }

  private setConnectionState(state: ConnectionState): void {
    if (state === this._connectionState) return;
    this._connectionState = state;
    this.emit("connectionChange", state);
  }
}

function parseKv(line: string): FirmwareStatusKv {
  const out: Record<string, number | string> = {};
  // tokenize on whitespace; each token is key=value
  const tokens = line.split(/\s+/);
  for (const tok of tokens) {
    const eq = tok.indexOf("=");
    if (eq < 0) continue;
    const key = tok.slice(0, eq);
    const valRaw = tok.slice(eq + 1);
    const num = Number(valRaw);
    out[key] = Number.isFinite(num) && /^[-+]?\d/.test(valRaw) ? num : valRaw;
  }
  return out as FirmwareStatusKv;
}
