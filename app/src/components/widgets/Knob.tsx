/**
 * Knob — rotary control for shear, frequency, envelope timing.
 *
 * Two visual variants, both ported from Figma file J3aZzdLaJmidPQcOxphPdE:
 *
 *   variant="major" (node 1:297, "Dial 1" State 1):
 *     Full assembly. Used for the headline SHEAR mean knob.
 *     - White recess well (233u)
 *     - 17 perimeter dot ticks over a 240° arc
 *     - 2 angled limit marks at -135° and +135°
 *     - Outer body 158.667u, radial gradient #656 → #474
 *     - Inner cap 99.167u, radial gradient #333 → #4a → #626 + heavy drop shadow
 *     - Indicator pill #d73534 (app accent), 23.917 × 6.417, on a 23u-from-center ring
 *
 *   variant="minor" (node 2009:643, "minor knob"):
 *     Stripped-down assembly. Used for everything else (ampl, freq, envelope
 *     ramps, etc.). The outer body and the 17 dot-ticks are removed; the
 *     inner cap stands alone with three simple tick lines (top + two lower
 *     limit marks). Same indicator pill.
 *
 * Both variants share the same 233.333u viewBox and the same interaction
 * model — vertical drag, scroll wheel, modifiers, double-click to type.
 *
 * Behavior (ported from Python v0.1):
 *   - Vertical click-drag (up = increase). 200 px = full range.
 *   - Shift = fine (4× slower). Ctrl/Cmd = coarse (4× faster).
 *   - Mouse wheel = step increments; same modifiers.
 *   - Double-click = type a value directly.
 *
 * 270° usable arc (-135° to +135°), 90° gap at bottom for visual breathing room.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Counter } from "./Counter";

// Geometry (degrees, measured clockwise from 12 o'clock)
const ARC_START_DEG = -135;
const ARC_SWEEP_DEG = 270;

// Flush rendering: the SVG viewBox is sized to the visible BODY (not the
// body + tick / limit-mark halo). Consumer's `size` prop maps 1:1 to the
// rendered body diameter, so a knob with size=140 occupies a 140px box and
// the dark cap fills it. Tick lines and lower limit marks render OUTSIDE
// the box via SVG overflow:visible, but they don't push the layout —
// `justify-between` aligns visible bodies, not knob bounding-boxes.

// MAJOR-only — radial tick ring. Hairline strokes (not dots) sitting just
// outside the knob body. 17 ticks over 240°, every 4th one a "major" (longer
// + slightly thicker) so the user gets a 5-major-divisions readout — like a
// synth knob with quarter markings.
const TICK_COUNT = 17;
const TICK_ARC_START = -120;
const TICK_ARC_SPAN = 240;
const TICK_BASE_R = 84;            // inner end of each tick (just past OUTER_BODY_R = 79.33)
const TICK_LEN_MINOR = 5;
const TICK_LEN_MAJOR = 9;
const TICK_THICKNESS_MINOR = 0.7;
const TICK_THICKNESS_MAJOR = 1.1;

// MAJOR-only — outer body (mid-grey radial gradient). RECESS_RING_R sits
// outside the body; the visible "outline" band = RECESS_RING_R − OUTER_BODY_R.
const OUTER_BODY_R = 158.667 / 2;
const RECESS_RING_R = 168 / 2;

// Both variants — inner cap (dark)
const INNER_CAP_R = 99.167 / 2;

// Indicator pill. The MAJOR variant gets a long, thin pill that hits the
// outer body edge and extends inward — Braun TG-60–style "line, not dot."
// MINOR keeps the original short pill.
const IND_W_MAJOR = 32;
const IND_H_MAJOR = 3.2;
const IND_W_MINOR = 23.917;
const IND_H_MINOR = 6.417;
// MAJOR radius positions the pill center such that the outer end sits on
// the body edge: radius = OUTER_BODY_R − IND_W_MAJOR/2.
const IND_RADIUS_MAJOR = OUTER_BODY_R - IND_W_MAJOR / 2;
const IND_RADIUS_MINOR = 23;

export type KnobVariant = "major" | "minor";

export interface KnobProps {
  /** Lowercase label rendered below the knob. */
  label?: string;
  /** Unit appended to the value readout (e.g. "Pa"). */
  unit?: string;
  min: number;
  max: number;
  value: number;
  /** Snap step. 0 disables snapping. */
  step?: number;
  decimals?: number;
  /** Outer frame size in px. The knob scales proportionally. Default 120. */
  size?: number;
  /** "major" = full body with dot ticks; "minor" = inner cap only with three simple ticks. */
  variant?: KnobVariant;
  showValue?: boolean;
  showLabel?: boolean;
  /** Disabled state — no interaction, dimmed. */
  disabled?: boolean;
  /**
   * How the value below the knob is formatted in the Counter:
   *   "scalar" (default): XX.XX with `decimals` decimal places.
   *   "time":             value treated as seconds, rendered MM:SS / HH:MM:SS.
   */
  valueFormat?: "scalar" | "time";
  onChange: (value: number) => void;
}

export function Knob({
  label,
  unit = "",
  min,
  max,
  value,
  step = 0,
  decimals = 2,
  size = 120,
  variant = "major",
  showValue = true,
  showLabel = true,
  disabled = false,
  valueFormat = "scalar",
  onChange,
}: KnobProps) {
  const gradientId = useId();
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Flush viewBox: equal to the visible body diameter for whichever variant.
  // The body fills the SVG; ticks / limit marks bleed outside via overflow.
  const bodyR = variant === "major" ? OUTER_BODY_R : INNER_CAP_R;
  const VB = 2 * bodyR;
  const CX = bodyR;
  const CY = bodyR;

  // Clamp + snap helper
  const normalize = useCallback(
    (v: number) => {
      let n = Math.max(min, Math.min(max, v));
      if (step > 0) n = Math.round(n / step) * step;
      return n;
    },
    [min, max, step],
  );

  // Value → arc angle
  const range = max - min;
  const fraction = range > 0 ? (value - min) / range : 0;
  const arcAngle = ARC_START_DEG + ARC_SWEEP_DEG * fraction;

  // Pointer drag (vertical; up = increase). 200 px = full range; modifiers 4×.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startValue: value };
    setIsDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    let sensitivity = 200;
    if (e.shiftKey) sensitivity = 800;
    else if (e.ctrlKey || e.metaKey) sensitivity = 50;
    const newValue =
      dragRef.current.startValue + (dy / sensitivity) * range;
    onChange(normalize(newValue));
  };
  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.preventDefault();
    const notch = -e.deltaY / 100;
    let factor = step > 0 ? step : range / 100;
    if (e.shiftKey) factor *= 10;
    else if (e.ctrlKey || e.metaKey) factor *= 0.1;
    onChange(normalize(value + notch * factor));
  };

  // Inline editing of the Counter value. Single click on the readout below
  // the knob swaps it for a real <input>; Enter or blur commits, Escape
  // cancels. The knob body itself is *not* a click target — drag/scroll/
  // type-in-counter are the only ways to change the value.
  //
  // We use an inline input instead of window.prompt because Chromium /
  // Electron silently disable window.prompt by default — it returns null
  // without ever showing a dialog.
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const startEdit = () => {
    if (disabled) return;
    setEditText(value.toFixed(decimals));
    setIsEditing(true);
  };

  const commitEdit = () => {
    if (!isEditing) return;
    const parsed = Number(editText);
    if (Number.isFinite(parsed)) onChange(normalize(parsed));
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Pre-compute MAJOR's radial tick lines (skipped for minor variant).
  // Each tick is a hairline segment from TICK_BASE_R outward. Every Nth
  // tick is a "major" (longer + slightly thicker) — yields a 5-tick
  // quartered scale at indices 0 / 4 / 8 / 12 / 16.
  const ticks =
    variant === "major"
      ? Array.from({ length: TICK_COUNT }, (_, i) => {
          const t = i / (TICK_COUNT - 1);
          const ang = TICK_ARC_START + TICK_ARC_SPAN * t;
          const rad = (ang * Math.PI) / 180;
          // Only the two endpoint ticks (bottom-left @ index 0, bottom-right
          // @ index 16) are "major"-style; the rest are uniform minor ticks.
          const isMajor = i === 0 || i === TICK_COUNT - 1;
          const len = isMajor ? TICK_LEN_MAJOR : TICK_LEN_MINOR;
          return {
            x1: CX + TICK_BASE_R * Math.sin(rad),
            y1: CY - TICK_BASE_R * Math.cos(rad),
            x2: CX + (TICK_BASE_R + len) * Math.sin(rad),
            y2: CY - (TICK_BASE_R + len) * Math.cos(rad),
            isMajor,
          };
        })
      : [];

  // Major-variant ticks bleed ~13% of body radius above the SVG box; pad the
  // wrapper top by that much so the visible top of the knob (tick tips, not
  // body) aligns with flex layout instead of poking into the row above.
  const tickClearancePx =
    variant === "major" ? Math.round(size * 0.09) : 0;

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ width: size, paddingTop: tickClearancePx }}
    >
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width={size}
        height={size}
        style={{ overflow: "visible" }}
        className={`focus:outline-none focus-visible:outline-none [&]:outline-none ${
          disabled
            ? "cursor-not-allowed pointer-events-none"
            : isDragging
              ? "cursor-ns-resize"
              : "cursor-pointer"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        /* Native SVG dblclick swallowed by setPointerCapture; handled on wrapper. */
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
      >
        <defs>
          <filter
            id={`${gradientId}-cap-shadow`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" />
            <feOffset dx="6" dy="9" result="offsetblur" />
            <feFlood floodColor="#000" floodOpacity="0.65" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* (No white recess well.) Per user request: every knob sits directly
            on the panel surface (#F6F6F6) with no white halo, matching the
            minor knob design (Figma 2008:247). The major knob's dot ticks and
            limit marks still render against the panel surface, unchanged. */}

        {/* MAJOR-only — 17 hairline radial ticks just outside the knob body,
            with every 4th tick a longer/thicker "major" division. */}
        {variant === "major" &&
          ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#1a1a1a"
              strokeWidth={t.isMajor ? TICK_THICKNESS_MAJOR : TICK_THICKNESS_MINOR}
              strokeLinecap="round"
            />
          ))}

        {/* MAJOR-only — recess shadow ring + outer body + outer body inset rim. */}
        {variant === "major" && (
          <>
            <circle
              cx={CX}
              cy={CY}
              r={RECESS_RING_R}
              fill="rgba(0,0,0,0.17)"
            />
            <circle
              cx={CX}
              cy={CY}
              r={OUTER_BODY_R}
              fill="#0d0d0d"
              filter={`url(#${gradientId}-cap-shadow)`}
            />
            <circle
              cx={CX}
              cy={CY}
              r={OUTER_BODY_R - 1.5}
              fill="none"
              stroke="rgba(0,0,0,0.33)"
              strokeWidth="2.917"
            />
          </>
        )}

        {/* Inner cap — minor variant only. The major variant collapses to a
            single solid dark disc (Braun TG-60-style); its outer body above
            already serves as the cap. */}
        {variant === "minor" && (
          <>
            <circle
              cx={CX}
              cy={CY}
              r={INNER_CAP_R}
              fill="#0d0d0d"
              filter={`url(#${gradientId}-cap-shadow)`}
            />
            <circle
              cx={CX}
              cy={CY}
              r={INNER_CAP_R - 2}
              fill="none"
              stroke="rgba(0,0,0,0.44)"
              strokeWidth="2.5"
            />
          </>
        )}

        {/* Indicator pill — rotates with value. Major: long thin pill hits
            the body edge and extends inward. Minor: short pill near center. */}
        {(() => {
          const indW = variant === "major" ? IND_W_MAJOR : IND_W_MINOR;
          const indH = variant === "major" ? IND_H_MAJOR : IND_H_MINOR;
          const indRadius = variant === "major" ? IND_RADIUS_MAJOR : IND_RADIUS_MINOR;
          return (
            <g transform={`rotate(${arcAngle + 90} ${CX} ${CY})`}>
              <rect
                x={CX - indRadius - indW / 2}
                y={CY - indH / 2}
                width={indW}
                height={indH}
                rx={indH / 2}
                ry={indH / 2}
                fill="#f0f0f0"
              />
            </g>
          );
        })()}
      </svg>

      {showLabel && label && (
        <div
          className="whitespace-nowrap font-mono text-[13px] uppercase tracking-wider text-muted"
          // MAJOR knobs get an extra 12px of breathing room between the body
          // and the label so the big knob doesn't crowd its readout.
          style={{ marginTop: variant === "major" ? 16 : 4 }}
        >
          {label.toLowerCase()}
        </div>
      )}
      {showValue && (
        <div data-readout className="mt-1">
          {isEditing ? (
            <span className="inline-flex items-center font-mono">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEdit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                onBlur={commitEdit}
                aria-label={`${label ?? "value"} input`}
                style={{
                  width: Math.max(64, Math.round(size * 0.55)),
                  fontSize: Math.max(13, Math.round(size * 0.085)),
                  // Match the Counter's deep off-white recess.
                  background: "#e0e0e0",
                  color: "#0d0d0d",
                  boxShadow: [
                    "inset 0 3px 4px rgba(0,0,0,0.18)",
                    "inset 0 1px 0 rgba(0,0,0,0.2)",
                    "inset 0 -1px 0 rgba(255,255,255,0.3)",
                    "0 0 0 1px rgba(0,0,0,0.2)",
                    "0 1px 1px rgba(255,255,255,0.2)",
                  ].join(", "),
                  borderRadius: 3,
                  border: "none",
                }}
                className="px-1.5 py-0.5 text-center font-mono focus:outline-none"
              />
              {unit && valueFormat !== "time" && (
                <span
                  className="ml-1.5 text-muted"
                  style={{ fontSize: Math.round(Math.max(13, size * 0.085) * 0.85) }}
                >
                  {unit}
                </span>
              )}
            </span>
          ) : (
            <button
              type="button"
              disabled={disabled}
              aria-label={`Set ${label ?? "value"} by typing`}
              onClick={startEdit}
              className={`focus:outline-none ${disabled ? "" : "cursor-pointer"}`}
            >
              <Counter
                value={value}
                format={valueFormat}
                digits={valueFormat === "time" ? undefined : decimals}
                size={Math.max(13, Math.round(size * 0.085))}
                unit={valueFormat === "time" ? undefined : unit || undefined}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
