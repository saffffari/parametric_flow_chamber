/**
 * WaveformIcon — small SVG icon showing two full periods of a waveform.
 *
 * Used under each oscillator switch in OscBlock so the operator reads the
 * shape at a glance.
 */

import type { WaveformShape } from "@/domain/shear";

export interface WaveformIconProps {
  waveform: WaveformShape;
  /** Width in px. Height auto-scales to ~half. Default 36. */
  width?: number;
  /** Stroke color. Default the theme foreground. */
  color?: string;
}

const VB_W = 64; // viewBox width
const VB_H = 24; // viewBox height
const MID = VB_H / 2;
const AMP = 8; // peak/trough amplitude from midline
const STROKE = 1.6;

function buildPath(waveform: WaveformShape): string {
  switch (waveform) {
    case "dc":
      return `M 0 ${MID} L ${VB_W} ${MID}`;

    case "sine": {
      // Two full periods of a sine wave, sampled densely.
      const points: string[] = [];
      const samples = 64;
      for (let i = 0; i <= samples; i += 1) {
        const x = (i / samples) * VB_W;
        const phase = (i / samples) * 2 * Math.PI * 2; // 2 periods across width
        const y = MID - AMP * Math.sin(phase);
        points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
      }
      return points.join(" ");
    }

    case "square": {
      // Two periods. Each period: rise → high → fall → low.
      const period = VB_W / 2;
      const high = MID - AMP;
      const low = MID + AMP;
      let d = `M 0 ${low}`;
      for (let i = 0; i < 2; i += 1) {
        const x0 = i * period;
        const xMid = x0 + period / 2;
        const xEnd = x0 + period;
        d += ` L ${x0} ${high} L ${xMid} ${high} L ${xMid} ${low} L ${xEnd} ${low}`;
      }
      return d;
    }

    case "sawtooth": {
      // Two periods. Each period ramps from low to high, then drops back.
      const period = VB_W / 2;
      const high = MID - AMP;
      const low = MID + AMP;
      let d = `M 0 ${low}`;
      for (let i = 0; i < 2; i += 1) {
        const xRampEnd = (i + 1) * period;
        d += ` L ${xRampEnd} ${high} L ${xRampEnd} ${low}`;
      }
      return d;
    }

    default:
      return "";
  }
}

export function WaveformIcon({
  waveform,
  width = 36,
  color = "currentColor",
}: WaveformIconProps) {
  const height = (width * VB_H) / VB_W;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={`${waveform} waveform`}
    >
      <path d={buildPath(waveform)} />
    </svg>
  );
}
