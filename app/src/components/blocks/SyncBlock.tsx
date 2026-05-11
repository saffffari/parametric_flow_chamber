import { useRuntimeStore } from "@/state/runtime";
import { Switch } from "@/components/widgets/Switch";
import { Counter } from "@/components/widgets/Counter";

export function SyncBlock() {
  const triggerCount = useRuntimeStore((s) => s.triggerCount);
  const phaseDeg = useRuntimeStore((s) => s.dialed.phaseDeg);
  const setDialed = useRuntimeStore((s) => s.setDialed);
  const interfaceMode = useRuntimeStore((s) => s.interfaceMode);
  const connectionState = useRuntimeStore((s) => s.connectionState);

  const canTrigger = interfaceMode === "serial" && connectionState === "connected";

  const fireTrigger = async () => {
    if (!canTrigger) return;
    await window.flowChamber.serial.sendRaw(`TRIGGER 100`);
  };

  return (
    <div className="flex h-full items-center justify-around gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[13px] uppercase tracking-wider text-muted">
          phase (°)
        </span>
        <input
          type="number"
          value={phaseDeg}
          step={5}
          min={-180}
          max={180}
          onChange={(e) => setDialed({ phaseDeg: Number(e.target.value) })}
          data-readout
          className="
            w-24 rounded-sm border border-border bg-surface-overlay px-2 py-1.5
            font-mono text-sm text-foreground focus:border-accent focus:outline-none
          "
        />
      </label>

      <div className="flex flex-col">
        <span className="font-mono text-[13px] uppercase tracking-wider text-muted">
          frames in
        </span>
        <div data-readout className="mt-1">
          <Counter value={triggerCount} format="integer" digits={4} size={20} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Switch
          checked={false}
          onChange={() => void fireTrigger()}
          momentary
          disabled={!canTrigger}
          size={60}
        />
        <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
          trigger
        </span>
      </div>
    </div>
  );
}
