/**
 * Tests for MockInterface — focuses on the speed-control surface
 * (`startContinuous` / `setStepRate`) added in firmware v0.4.0 / app spin
 * mode. Protocol-run paths are covered indirectly by existing app behavior.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockInterface } from "./mock-interface";
import type { TelemetrySample } from "./interface";

describe("MockInterface — continuous (spin) mode", () => {
  let iface: MockInterface;

  beforeEach(() => {
    vi.useFakeTimers();
    iface = new MockInterface();
  });

  afterEach(async () => {
    await iface.disconnect();
    vi.useRealTimers();
  });

  it("startContinuous fails when not connected", async () => {
    const ok = await iface.startContinuous(1000);
    expect(ok).toBe(false);
  });

  it("startContinuous flips connection-running state and starts emitting telemetry", async () => {
    await iface.connect();
    const samples: TelemetrySample[] = [];
    iface.onTelemetry((s) => samples.push(s));

    const ok = await iface.startContinuous(2000);
    expect(ok).toBe(true);

    // Telemetry timer is 100 ms (10 Hz). Advance 350 ms — expect ~3 samples.
    vi.advanceTimersByTime(350);
    expect(samples.length).toBeGreaterThanOrEqual(3);

    for (const s of samples) {
      expect(s.commandedStepRateHz).toBe(2000);
      expect(s.state).toBe("HOLDING");
      // Reverse-calibration: stepRate * 60 / 6400 = mL/min; / 5 = Pa
      expect(s.commandedFlowMlMin).toBeCloseTo((2000 * 60) / 6400.0, 3);
      expect(s.commandedShearPa).toBeCloseTo((2000 * 60) / 6400.0 / 5.0, 3);
    }
  });

  it("startContinuous refuses while already running", async () => {
    await iface.connect();
    expect(await iface.startContinuous(1000)).toBe(true);
    expect(await iface.startContinuous(2000)).toBe(false);
  });

  it("setStepRate updates the rate live during continuous run", async () => {
    await iface.connect();
    const samples: TelemetrySample[] = [];
    iface.onTelemetry((s) => samples.push(s));

    expect(await iface.startContinuous(1000)).toBe(true);
    vi.advanceTimersByTime(120); // ~1 sample at 1000 Hz

    expect(await iface.setStepRate(5000)).toBe(true);
    samples.length = 0;
    vi.advanceTimersByTime(220); // ~2 samples at 5000 Hz
    expect(samples.length).toBeGreaterThanOrEqual(2);
    for (const s of samples) {
      expect(s.commandedStepRateHz).toBe(5000);
    }
  });

  it("setStepRate clamps to firmware range 1..20000 Hz", async () => {
    await iface.connect();
    await iface.startContinuous(1000);

    const samples: TelemetrySample[] = [];
    iface.onTelemetry((s) => samples.push(s));

    expect(await iface.setStepRate(50000)).toBe(true);
    vi.advanceTimersByTime(120);
    expect(samples[samples.length - 1].commandedStepRateHz).toBe(20000);

    samples.length = 0;
    expect(await iface.setStepRate(0)).toBe(true);
    vi.advanceTimersByTime(120);
    expect(samples[samples.length - 1].commandedStepRateHz).toBe(1);
  });

  it("setStepRate is a no-op when not in continuous mode", async () => {
    await iface.connect();
    expect(await iface.setStepRate(5000)).toBe(false);

    // Even after a protocol run starts, setStepRate refuses (waveform path
    // owns the rate).
    await iface.runProtocol({
      meanPa: 1.0,
      amplitudePa: 0,
      frequencyHz: 0,
      waveform: "dc",
      durationS: 60,
    });
    expect(await iface.setStepRate(5000)).toBe(false);
  });

  it("stop halts continuous mode and emits a final IDLE sample", async () => {
    await iface.connect();
    const samples: TelemetrySample[] = [];
    iface.onTelemetry((s) => samples.push(s));

    await iface.startContinuous(1000);
    vi.advanceTimersByTime(220);
    expect(samples.length).toBeGreaterThan(0);

    samples.length = 0;
    await iface.stop();

    // Exactly one final IDLE sample, then no further emissions.
    expect(samples.length).toBe(1);
    expect(samples[0].state).toBe("IDLE");
    expect(samples[0].commandedStepRateHz).toBe(0);

    vi.advanceTimersByTime(500);
    expect(samples.length).toBe(1);
  });

  it("disconnect cleans up continuous mode", async () => {
    await iface.connect();
    await iface.startContinuous(1000);

    const samples: TelemetrySample[] = [];
    iface.onTelemetry((s) => samples.push(s));

    await iface.disconnect();
    samples.length = 0;
    vi.advanceTimersByTime(500);
    expect(samples).toHaveLength(0);
  });

  it("status reports HOLDING during continuous mode", async () => {
    await iface.connect();
    await iface.startContinuous(1500);
    const status = await iface.status();
    expect(status?.state).toBe("HOLDING");
    expect(status?.pump).toBe("running");
  });
});
