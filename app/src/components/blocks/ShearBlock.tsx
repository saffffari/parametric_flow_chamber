import { useEffect, useRef } from "react";

import { useRuntimeStore } from "@/state/runtime";
import { Knob } from "@/components/widgets/Knob";
import { RotatingWheel } from "@/components/widgets/RotatingWheel";
import { shearToStepRate } from "@/domain/shear";

// 50 ms = 20 Hz max RATE updates. The firmware happily accepts more, but
// at 60 fps a knob drag generates one event per frame and we'd otherwise
// flood the 115200-baud line.
const NUDGE_THROTTLE_MS = 50;

// Major knob and pump roller share a diameter so they read as paired anchors
// — control on the left, its driven actuator next to it.
const KNOB_SIZE = 200;
const ROLLER_SIZE = 200;

// The major Knob wrapper has paddingTop = round(size * 0.09) baked in so its
// tick tips don't poke into the row above (see Knob.tsx tickClearancePx).
// The roller has no such padding, so its body sits that much higher than the
// knob's body under items-start. Mirror the value on the roller wrapper to
// re-align the bodies vertically.
const KNOB_TICK_CLEARANCE = Math.round(KNOB_SIZE * 0.09);

export function ShearBlock() {
  const dialed = useRuntimeStore((s) => s.dialed);
  const setDialed = useRuntimeStore((s) => s.setDialed);
  const calibration = useRuntimeStore((s) => s.calibration);
  const runState = useRuntimeStore((s) => s.runState);
  const activeRun = useRuntimeStore((s) => s.activeRun);
  const nudgeRate = useRuntimeStore((s) => s.nudgeRate);
  const lastTelemetry = useRuntimeStore((s) => s.lastTelemetry);

  // Continuous (spin) mode = pump is spinning AND no protocol-run lifecycle
  // owns it. Protocol runs drive the firmware via their own waveform path;
  // we only nudge in continuous mode to avoid two writers fighting.
  const inContinuousMode =
    activeRun == null && runState !== "IDLE" && runState !== "FAULT";

  // Throttle state: pending value (latest) + timer id. On each onChange we
  // schedule a trailing send; if no send is in flight, we send immediately
  // (leading-edge) so the operator sees the first nudge with no lag.
  const pendingHzRef = useRef<number | null>(null);
  const lastSendMsRef = useRef(0);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
    };
  }, []);

  const flushNudge = () => {
    if (pendingHzRef.current == null) return;
    const hz = pendingHzRef.current;
    pendingHzRef.current = null;
    lastSendMsRef.current = Date.now();
    void nudgeRate(hz);
  };

  const scheduleNudge = (meanPa: number) => {
    if (!inContinuousMode) return;
    const hz = Math.round(shearToStepRate(meanPa, calibration));
    pendingHzRef.current = hz;
    const elapsed = Date.now() - lastSendMsRef.current;
    if (elapsed >= NUDGE_THROTTLE_MS) {
      flushNudge();
      return;
    }
    if (trailingTimerRef.current) return;
    trailingTimerRef.current = setTimeout(() => {
      trailingTimerRef.current = null;
      flushNudge();
    }, NUDGE_THROTTLE_MS - elapsed);
  };

  // Pump roller telemetry — derived from the live commanded STEP rate so the
  // roller advances exactly in lockstep with the firmware. Same math the
  // DISPLAY block previously used; now lives next to the SHEAR knob since the
  // pump is the actuator the knob commands.
  const stepRateHz = lastTelemetry?.commandedStepRateHz ?? 0;
  const stepsPerRev = calibration.motorStepsPerRev * calibration.microstepping;
  const wheelRps = stepsPerRev > 0 ? stepRateHz / stepsPerRev : 0;
  const wheelActive = runState !== "IDLE" && runState !== "FAULT";

  // Layout: knob + roller paired, anchored to the block's top-left. The knob
  // is the operator's input; the roller is the actuator that input drives —
  // keeping them adjacent makes the chain visually obvious. The AMPL/FREQ
  // minor knobs that used to sit on the right have moved into OscBlock (they
  // parameterize the waveform shape selected over there).
  return (
    <div className="flex h-full items-start">
      {/* items-start tops-align knob *body* and roller so their tops match.
          The Knob is a flex-col of body/label/counter; the label+counter
          stack below the body. marginLeft offsets the pair from the block's
          left edge for breathing room. marginTop backs up by exactly the
          Knob's internal tick clearance so the body — not the empty padding
          above it — sits flush with the block's content area top. */}
      <div
        className="flex items-start gap-32"
        style={{ marginLeft: 32, marginTop: -KNOB_TICK_CLEARANCE }}
      >
        <div style={{ paddingTop: KNOB_TICK_CLEARANCE }}>
          <RotatingWheel
            rps={wheelActive ? wheelRps : 0}
            size={ROLLER_SIZE}
            // Red while the pump is actually moving fluid (matches the RUN
            // button accent and signals "this is active"); white otherwise
            // so an idle panel reads as neutral.
            rollerColor={wheelActive ? "#d73534" : "#f0f0f0"}
            ariaLabel={`pump roller, ${stepRateHz.toFixed(0)} Hz`}
          />
        </div>
        <Knob
          label="shear"
          unit="Pa"
          min={0}
          max={10}
          step={0.05}
          decimals={2}
          value={dialed.meanPa}
          size={KNOB_SIZE}
          variant="major"
          onChange={(v) => {
            setDialed({ meanPa: v });
            scheduleNudge(v);
          }}
        />
      </div>
    </div>
  );
}
