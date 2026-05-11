import { useRuntimeStore } from "@/state/runtime";
import { Switch } from "@/components/widgets/Switch";
import { Knob } from "@/components/widgets/Knob";
import { WaveformIcon } from "@/components/widgets/WaveformIcon";
import type { WaveformShape } from "@/domain/shear";

const WAVEFORMS: { value: WaveformShape; label: string }[] = [
  { value: "dc", label: "steady" },
  { value: "sine", label: "sine" },
  { value: "square", label: "square" },
  { value: "sawtooth", label: "saw" },
];

export function OscBlock() {
  const waveform = useRuntimeStore((s) => s.dialed.waveform);
  const amplitudePa = useRuntimeStore((s) => s.dialed.amplitudePa);
  const frequencyHz = useRuntimeStore((s) => s.dialed.frequencyHz);
  const setDialed = useRuntimeStore((s) => s.setDialed);
  const activeRun = useRuntimeStore((s) => s.activeRun);

  // Two rows on the same 4-col grid so the AMPL/FREQ minor knobs sit directly
  // above the waveform-switch row. Each switch occupies one column; the knobs
  // sit in cols 1 and 2, centered, so AMPL aligns vertically with STEADY and
  // FREQ aligns vertically with SINE — cols 3 and 4 of the knob row are
  // intentionally empty.
  return (
    <div className="flex h-full flex-col justify-around gap-3">
      <div className="grid grid-cols-4 items-center gap-1">
        <div className="flex justify-center">
          <Knob
            label="ampl"
            unit="Pa"
            min={0}
            max={5}
            step={0.05}
            decimals={2}
            value={amplitudePa}
            size={60}
            variant="minor"
            onChange={(v) => setDialed({ amplitudePa: v })}
          />
        </div>
        <div className="flex justify-center">
          <Knob
            label="freq"
            unit="Hz"
            min={0}
            max={5}
            step={0.05}
            decimals={2}
            value={frequencyHz}
            size={60}
            variant="minor"
            onChange={(v) => setDialed({ frequencyHz: v })}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-1">
        {WAVEFORMS.map((w) => (
          <div key={w.value} className="flex flex-col items-center gap-2">
            <Switch
              checked={waveform === w.value}
              onChange={(checked) => {
                // Mutual exclusion: clicking a checked switch keeps it checked
                // (deselect not allowed — one waveform must always be
                // selected). Clicking an unchecked switch selects it; the
                // previously-checked one auto-pops up because it's reading the
                // same shared state.
                if (checked) setDialed({ waveform: w.value });
                else if (waveform !== w.value) setDialed({ waveform: w.value });
              }}
              size={60}
              disabled={!!activeRun}
            />
            <WaveformIcon waveform={w.value} width={32} color="#14140f" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              {w.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
