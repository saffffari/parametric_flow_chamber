import { useEffect, useRef, useState } from "react";
import { useRuntimeStore } from "@/state/runtime";
import { Counter } from "@/components/widgets/Counter";
import { FlowCellView } from "@/components/widgets/FlowCellView";

// No aspect lock on width. Height is capped at the SHEAR major-knob diameter
// (kept in sync with ShearBlock's KNOB_SIZE) so the display reads as a
// shoulder-height instrument display next to the major control.
const FCV_HEIGHT = 200;

export function DisplayBlock() {
  const last = useRuntimeStore((s) => s.lastTelemetry);

  const shear = last?.commandedShearPa ?? 0;
  const flow = last?.measuredFlowMlMin ?? last?.commandedFlowMlMin ?? 0;
  const tempC = last?.measuredTempC ?? last?.tempReservoirC ?? 0;
  const runTimeS = last?.runTimeS ?? 0;

  // CHANNEL layout: FlowCellView spans the column width at the top, readouts
  // below in a single horizontal row (SHEAR / FLOW / TEMP / TIMER). The
  // column is wide enough (~1/3 of panel) to fit them on one line. The pump
  // roller lives in the SHEAR block; this block is dedicated to *what the
  // fluid is doing inside the channel* plus the elapsed-time clock.
  return (
    <div className="flex h-full flex-col gap-3">
      <FlowCellPanel flowMlMin={flow} tempC={tempC} />

      {/* Same 4-col grid as RUN and TRANSPORT so SHEAR/FLOW/TEMP/TIMER
          counters land vertically aligned to the run-timing knobs and the
          run buttons. The Stat is centered in each cell — its label rides
          above the counter and follows the counter's centerline, but the
          label's width doesn't push the grid around. */}
      <div className="grid shrink-0 grid-cols-4 items-end gap-3">
        <div className="flex justify-center">
          <Stat label="SHEAR" unit="Pa" value={shear} />
        </div>
        <div className="flex justify-center">
          <Stat label="FLOW" unit="mL/min" value={flow} />
        </div>
        <div className="flex justify-center">
          <Stat label="TEMP" unit="°C" value={tempC} />
        </div>
        <div className="flex justify-center">
          <Stat label="TIMER" value={runTimeS} format="time" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  unit,
  value,
  format = "scalar",
}: {
  label: string;
  unit?: string;
  value: number;
  format?: "scalar" | "integer" | "time";
}) {
  // Same wrapper structure the Knob widget uses for its under-the-body
  // readout: just-the-label on top, Counter (digits + unit-to-the-right)
  // below. items-center keeps the recess horizontally centered with the
  // label so the white face stays put across the row.
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <Counter
        value={value}
        format={format}
        digits={format === "scalar" ? 2 : undefined}
        size={13}
        unit={unit}
      />
    </div>
  );
}

// Autosized FlowCellView wrapper — observes its own bounding box and forwards
// a halved 2:1 rectangle to the canvas. Keeps the canvas API explicit
// (width/height props) while letting it scale with available flex space.
function FlowCellPanel({
  flowMlMin,
  tempC,
}: {
  flowMlMin: number;
  tempC: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const w = Math.floor(e.contentRect.width);
      const h = Math.floor(e.contentRect.height);
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Width fills the container; height is locked to FCV_HEIGHT (= SHEAR knob
  // diameter). If the container is shorter than that we clamp so nothing
  // overflows, but in normal layout this stays at exactly FCV_HEIGHT.
  const fitW = box.w;
  const fitH = Math.min(box.h, FCV_HEIGHT);
  const ready = fitW >= 1 && fitH >= 1;

  return (
    <div ref={ref} className="flex min-h-0 flex-1 items-start justify-center">
      {ready && (
        <FlowCellView
          width={Math.floor(fitW)}
          height={Math.floor(fitH)}
          flowMlMin={flowMlMin}
          tempC={tempC}
        />
      )}
    </div>
  );
}
