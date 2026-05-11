import { useRuntimeStore } from "@/state/runtime";
import { Knob } from "@/components/widgets/Knob";

export function EnvBlock() {
  const dialed = useRuntimeStore((s) => s.dialed);
  const setDialed = useRuntimeStore((s) => s.setDialed);

  // 4-column grid mirrors the TRANSPORT row below so each timing knob lands
  // directly above its corresponding run-control button:
  //   col 1: RAMP IN  → RUN
  //   col 2: DURATION → STOP   (duration implicitly extends across col 3)
  //   col 3: empty               (nothing above SPIN)
  //   col 4: RAMP OUT → PRIME
  return (
    <div className="grid h-full grid-cols-4 items-center gap-2">
      <div className="flex justify-center">
        <Knob
          label="ramp in"
          unit="s"
          min={0}
          max={120}
          step={1}
          decimals={0}
          value={dialed.rampInS}
          size={60}
          variant="minor"
          valueFormat="time"
          onChange={(v) => setDialed({ rampInS: v })}
        />
      </div>
      <div className="flex justify-center">
        <Knob
          label="duration"
          unit="s"
          min={1}
          max={3600}
          step={5}
          decimals={0}
          value={dialed.durationS}
          size={60}
          variant="minor"
          valueFormat="time"
          onChange={(v) => setDialed({ durationS: v })}
        />
      </div>
      <div aria-hidden="true" />
      <div className="flex justify-center">
        <Knob
          label="ramp out"
          unit="s"
          min={0}
          max={120}
          step={1}
          decimals={0}
          value={dialed.rampOutS}
          size={60}
          variant="minor"
          valueFormat="time"
          onChange={(v) => setDialed({ rampOutS: v })}
        />
      </div>
    </div>
  );
}
