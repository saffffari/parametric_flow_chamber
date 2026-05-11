/**
 * DialSwitch — chrome rotary on/off dial in the Dieter Rams stove-knob idiom.
 *
 * Visual: ported from the Figma "Dial – Dieter Rams style" community file
 * (file key N2p7QrcLPabeEawnCEmrfQ, node 1:4). Replaces the white push-button
 * Switch where a binary on/off control reads better as a satisfying rotary.
 *
 * Layers (340u reference frame):
 *   - Outer bezel ring (340u) — chrome gradient with soft drop shadow
 *   - Inner recessed level (304u) — dark, makes the lever look set into the dial
 *   - Lever bar (72u × 300u, rounded ends) — chrome gradient, rotates around
 *     the center as state changes; fills the inner level top-to-bottom
 *   - Red pointer dot (16u, #D73534) near the top of the lever, rotates with it
 *
 * State mapping (matches the Figma):
 *   - Off → lever vertical (pointer at 12 o'clock, angle 0°)
 *   - On → lever rotated -90° CCW (pointer at 9 o'clock)
 *
 * The momentary mode rotates briefly to "on" while the pointer is held and
 * snaps back on release — useful for trigger / pulse-out actions.
 */

import { useState, type CSSProperties } from "react";

const VB = 340;
const CX = VB / 2;
const CY = VB / 2;
const BEZEL_R = 170;
const LEVEL_R = 152;
const LEVER_W = 72;
const LEVER_H = 300;
const LEVER_X = (VB - LEVER_W) / 2;
const LEVER_Y = (VB - LEVER_H) / 2;
const POINTER_R = 8;
const POINTER_OFFSET_FROM_TOP = 32; // distance of pointer from top of lever bar

export interface DialSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Diameter in px. Default 80. */
  size?: number;
  /** Label rendered below the dial. */
  label?: string;
  disabled?: boolean;
  /**
   * Momentary mode: rotate to "on" while held, snap back to "off" on release.
   * Use for trigger / pulse-out actions.
   */
  momentary?: boolean;
}

export function DialSwitch({
  checked,
  onChange,
  size = 80,
  label,
  disabled = false,
  momentary = false,
}: DialSwitchProps) {
  const [pressed, setPressed] = useState(false);

  // Angle: lever rotates -90° CCW when on. Momentary follows pressed state.
  const isOn = momentary ? pressed : checked;
  const angle = isOn ? -90 : 0;

  const handlePress = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressed(true);
    if (momentary) onChange(true);
  };
  const handleRelease = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || !pressed) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setPressed(false);
    if (momentary) onChange(false);
    else onChange(!checked);
  };
  const handleCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pressed) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setPressed(false);
    if (momentary) onChange(false);
  };
  const handleKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (momentary) {
        if (e.type === "keydown") {
          setPressed(true);
          onChange(true);
        } else {
          setPressed(false);
          onChange(false);
        }
      } else if (e.type === "keydown") {
        onChange(!checked);
      }
    }
  };

  // Scale factor for sizes outside the SVG (label spacing).
  const labelGap = size * 0.08;

  const containerStyle: CSSProperties = {
    width: size,
    userSelect: "none",
  };

  return (
    <div className="flex flex-col items-center" style={containerStyle}>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width={size}
        height={size}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerCancel={handleCancel}
        onPointerLeave={(e) =>
          e.currentTarget.hasPointerCapture(e.pointerId) && handleCancel(e)
        }
        onKeyDown={handleKey}
        onKeyUp={handleKey}
        className={
          disabled
            ? "cursor-not-allowed pointer-events-none"
            : "cursor-pointer focus:outline-none"
        }
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Bezel gradient — chrome highlight at top, darker at bottom. */}
          <linearGradient id="dial-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbfbfb" />
            <stop offset="0.35" stopColor="#dcdcdc" />
            <stop offset="0.65" stopColor="#b6b6b6" />
            <stop offset="1" stopColor="#7e7e7e" />
          </linearGradient>

          {/* Inner level — dark recess where the lever sits. */}
          <radialGradient
            id="dial-level"
            cx="50%"
            cy="38%"
            r="65%"
          >
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="0.5" stopColor="#262626" />
            <stop offset="1" stopColor="#161616" />
          </radialGradient>

          {/* Lever gradient — chrome bar; same direction as bezel for cohesion. */}
          <linearGradient id="dial-lever" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fcfcfc" />
            <stop offset="0.4" stopColor="#e0e0e0" />
            <stop offset="0.7" stopColor="#b8b8b8" />
            <stop offset="1" stopColor="#929292" />
          </linearGradient>

          {/* Bezel outer drop shadow — soft, slightly down. */}
          <filter
            id="dial-bezel-shadow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="2" dy="10" result="offsetblur" />
            <feFlood floodColor="#000" floodOpacity="0.35" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Inner level inset shadow — recessed look. Implemented via a
              radial overlay drawn just inside the level circle. */}
          <radialGradient
            id="dial-level-inset"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0.85" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.6)" />
          </radialGradient>

          {/* Lever drop shadow — gives the lever some lift. */}
          <filter
            id="dial-lever-shadow"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feFlood floodColor="#000" floodOpacity="0.45" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip the lever to the inner level so it doesn't draw on the bezel. */}
          <clipPath id="dial-inner-clip">
            <circle cx={CX} cy={CY} r={LEVEL_R} />
          </clipPath>
        </defs>

        {/* Bezel ring */}
        <circle
          cx={CX}
          cy={CY}
          r={BEZEL_R}
          fill="url(#dial-bezel)"
          filter="url(#dial-bezel-shadow)"
        />

        {/* Inner level (dark recess) + soft inset rim */}
        <circle cx={CX} cy={CY} r={LEVEL_R} fill="url(#dial-level)" />
        <circle
          cx={CX}
          cy={CY}
          r={LEVEL_R}
          fill="url(#dial-level-inset)"
          pointerEvents="none"
        />

        {/* Lever — rotates around the center. CSS transform with
            transform-origin set in absolute SVG coordinates so the rotation
            stays anchored regardless of size. transition gives a smooth flip. */}
        <g
          clipPath="url(#dial-inner-clip)"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <rect
            x={LEVER_X}
            y={LEVER_Y}
            width={LEVER_W}
            height={LEVER_H}
            rx={LEVER_W / 2}
            ry={LEVER_W / 2}
            fill="url(#dial-lever)"
            filter="url(#dial-lever-shadow)"
          />
          {/* Pointer dot near the top of the lever. */}
          <circle
            cx={CX}
            cy={LEVER_Y + POINTER_OFFSET_FROM_TOP}
            r={POINTER_R}
            fill="#D73534"
          />
        </g>
      </svg>

      {label && (
        <div
          className="font-mono text-[13px] uppercase tracking-wider text-muted"
          style={{ marginTop: labelGap }}
        >
          {label.toLowerCase()}
        </div>
      )}
    </div>
  );
}
