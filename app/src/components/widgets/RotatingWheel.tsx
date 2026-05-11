/**
 * RotatingWheel — peristaltic-pump roller visualization for the DISPLAY block.
 *
 * Renders a static dark wheel body with three red roller dots. The roller
 * layer rotates at `rps` rotations per second.
 *
 * Animation runs on `requestAnimationFrame` (60Hz / display refresh rate)
 * with rotation accumulated continuously. Earlier versions used a CSS
 * keyframe animation whose duration was bound to `rps`; React re-rendered
 * that style on every telemetry tick (~10Hz) and each re-render restarted
 * the keyframe at 0°, producing visible "jumps". With rAF + a ref-tracked
 * angle, prop changes never reset the visible rotation.
 */

import { useEffect, useRef } from "react";

const FIGMA_REF = 194; // Figma frame size (px); used as SVG viewBox basis
const WHEEL_R = FIGMA_REF / 2; // 97
const ROLLER_R = 13; // roller dot radius in figma units (matches single-dot screenshot)
const ROLLER_OFFSET = 60; // roller-center distance from wheel center

export interface RotatingWheelProps {
  /** Rotations per second. 0 freezes the wheel at its current angle. Negative = counter-clockwise. */
  rps?: number;
  /** Wheel diameter in px. Default 120. */
  size?: number;
  /** Roller fill color. Default app accent `#d73534`. */
  rollerColor?: string;
  /** Optional click handler. */
  onClick?: () => void;
  /** Accessible label describing what the wheel represents. */
  ariaLabel?: string;
}

const ROLLER_ANGLES = [0, 120, 240] as const;

const ROLLERS = ROLLER_ANGLES.map((deg) => {
  // SVG y-axis points down; angle 0 = right, angle 90 = down (in math terms)
  // We use 0° = right of center for the first roller; the 120° spacing puts
  // them at 4 / 8 / 12 o'clock (or rotational equivalent).
  const rad = (deg * Math.PI) / 180;
  return {
    cx: WHEEL_R + ROLLER_OFFSET * Math.cos(rad),
    cy: WHEEL_R + ROLLER_OFFSET * Math.sin(rad),
  };
});

export function RotatingWheel({
  rps = 0,
  size = 120,
  rollerColor = "#d73534",
  onClick,
  ariaLabel,
}: RotatingWheelProps) {
  const s = size / FIGMA_REF;
  const rollerLayerRef = useRef<HTMLDivElement | null>(null);
  const rpsRef = useRef(rps);
  rpsRef.current = rps;

  useEffect(() => {
    let raf = 0;
    let lastTs: number | null = null;
    let angleDeg = 0;

    const tick = (now: number) => {
      if (lastTs !== null) {
        const dtSec = (now - lastTs) / 1000;
        angleDeg = (angleDeg + rpsRef.current * 360 * dtSec) % 360;
        if (rollerLayerRef.current) {
          rollerLayerRef.current.style.transform = `rotate(${angleDeg}deg)`;
        }
      }
      lastTs = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel-body shadow stack — match the major SHEAR knob:
  //   1. Solid `rgba(0,0,0,0.17)` recess ring just outside the body. The
  //      knob renders this as an SVG circle one size up; on a div we get the
  //      same look from a zero-blur outer box-shadow. Width is tuned to the
  //      knob's ring/body ratio (~3% of size).
  //   2. Heavy offset drop shadow (dx 6, dy 9, blur 18, alpha 0.55) — exactly
  //      mirrors the knob's cap-shadow filter so the roller "sits in the
  //      panel" the same way the knob does.
  const wheelShadow = [
    `0 0 0 ${5.5 * s}px rgba(0,0,0,0.17)`,
    `${6 * s}px ${9 * s}px ${18 * s}px rgba(0,0,0,0.55)`,
  ].join(", ");

  return (
    <div
      className="relative inline-block select-none"
      style={{ width: size, height: size }}
      onClick={onClick}
      role="img"
      aria-label={ariaLabel ?? "pump roller"}
    >
      {/* Static wheel body */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background: "#0d0d0d",
          boxShadow: wheelShadow,
        }}
      />

      {/* Rotating roller layer — driven by rAF, transform updated each frame. */}
      <div
        ref={rollerLayerRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ willChange: "transform" }}
      >
        <svg
          viewBox={`0 0 ${FIGMA_REF} ${FIGMA_REF}`}
          className="w-full h-full"
        >
          {ROLLERS.map((roller, i) => (
            <circle
              key={i}
              cx={roller.cx}
              cy={roller.cy}
              r={ROLLER_R}
              fill={rollerColor}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
