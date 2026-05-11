/**
 * LiveTrace — generic 5-second dot-graph for any scalar telemetry value.
 *
 * Compact "screen" element styled like a CRT readout: dark panel, single-color
 * dot per sample, faint dotted horizontal reference line, subtle frame border.
 * Newest sample at the right edge; samples drift left as time advances.
 *
 * Auto-scales Y to the visible window's max (with small headroom) and a
 * provided `floor` so an idle trace doesn't fly around. The caller supplies
 * a `selector` that pulls a number out of the latest TelemetrySample — same
 * widget, different data source for τ / Q / T / etc.
 */

import { useEffect, useRef, useState } from "react";
import { useRuntimeStore } from "@/state/runtime";
import type { TelemetrySample } from "@/lib/interface";

const WINDOW_MS = 5000;
const TICK_MS = 100;

interface Sample {
  t: number;
  v: number;
}

export interface LiveTraceProps {
  width: number;
  height: number;
  /** Pull the value of interest out of the latest TelemetrySample. */
  selector: (sample: TelemetrySample) => number;
  /** Dot color. Default app accent red. */
  color?: string;
  /** Y-axis floor — minimum range so an all-zero trace doesn't autoscale to noise. Default 0.5. */
  floor?: number;
  /** Aria label override for screen readers. */
  ariaLabel?: string;
}

export function LiveTrace({
  width,
  height,
  selector,
  color = "#d73534",
  floor = 0.5,
  ariaLabel,
}: LiveTraceProps) {
  const lastTelemetry = useRuntimeStore((s) => s.lastTelemetry);
  const [samples, setSamples] = useState<Sample[]>([]);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastTelemetry) return;
    const t = lastTelemetry.timestampUs / 1000;
    if (lastTsRef.current === t) return;
    lastTsRef.current = t;
    const v = selector(lastTelemetry);
    setSamples((prev) => {
      const cutoff = t - WINDOW_MS;
      const next = prev.filter((s) => s.t >= cutoff);
      next.push({ t, v });
      return next;
    });
  }, [lastTelemetry, selector]);

  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - WINDOW_MS;
      setSamples((prev) => {
        if (prev.length === 0) return prev;
        if (prev[0].t >= cutoff) return prev;
        return prev.filter((s) => s.t >= cutoff);
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const PAD_X = 4;
  const PAD_Y = 6;
  const innerW = Math.max(1, width - PAD_X * 2);
  const innerH = Math.max(1, height - PAD_Y * 2);

  const maxV = samples.reduce((m, s) => Math.max(m, s.v), 0);
  const yMax = Math.max(floor, maxV * 1.1);

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? "live trace, last 5 seconds"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <rect x={0} y={0} width={width} height={height} fill="#0a0a0a" rx={2} />
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth={1}
        rx={2}
      />
      <line
        x1={PAD_X}
        x2={width - PAD_X}
        y1={height / 2}
        y2={height / 2}
        stroke="#2a2a2a"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      {samples.map((s, i) => {
        const ageMs = now - s.t;
        if (ageMs < 0 || ageMs > WINDOW_MS) return null;
        const x = PAD_X + innerW * (1 - ageMs / WINDOW_MS);
        const y = PAD_Y + innerH * (1 - s.v / yMax);
        return <circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
      })}
    </svg>
  );
}
