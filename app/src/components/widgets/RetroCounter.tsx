/**
 * RetroCounter — recessed glass-covered numerical readout.
 *
 * Visual reference: vintage VU meter / mechanical odometer aesthetic. The
 * readout reads as **set into the panel** (deep inset shadow around the
 * recess) with a glass cover (top-down highlight gradient + subtle reflective
 * sheen). Bright orange digits glow against a dark interior, evoking a
 * vacuum-fluorescent display.
 *
 * Used in the DISPLAY block for the live shear / flow / temperature readouts
 * and anywhere else a numerical telemetry value should read as an instrument
 * gauge rather than a flat label.
 *
 * Props:
 *   value   — formatted string to render (caller controls precision/unit)
 *   label   — optional small label drawn above the readout
 *   width   — readout width in px (height auto-derived)
 *   accent  — when true, renders digits in the warm-orange accent (signals
 *             "active / commanded / live"); off renders dim white
 */

import type { CSSProperties } from "react";

export interface RetroCounterProps {
  value: string;
  label?: string;
  width?: number;
  /** When true, digits render in the warm orange accent (live / active state). */
  accent?: boolean;
}

export function RetroCounter({
  value,
  label,
  width = 140,
  accent = false,
}: RetroCounterProps) {
  // Readout window dimensions
  const winHeight = width * 0.38;

  // Recessed housing: inset shadow makes it look "set into" the panel
  const housingShadow = [
    "inset 0 2px 4px rgba(0,0,0,0.55)",
    "inset 0 -1px 2px rgba(255,255,255,0.4)",
    "inset 4px 0 8px rgba(0,0,0,0.35)",
    "inset -4px 0 8px rgba(0,0,0,0.35)",
    "0 1px 0 rgba(255,255,255,0.6)",
  ].join(", ");

  // Inner display: dark recessed area where digits sit
  const screenShadow = [
    "inset 0 3px 6px rgba(0,0,0,0.85)",
    "inset 0 -1px 2px rgba(80,80,80,0.5)",
    "inset 2px 0 4px rgba(0,0,0,0.6)",
    "inset -2px 0 4px rgba(0,0,0,0.6)",
  ].join(", ");

  const digitColor = accent ? "#d73534" : "#d6d4cf";
  const digitGlow = accent
    ? "0 0 6px rgba(215,53,52,0.55), 0 0 1px rgba(229,85,84,0.8)"
    : "0 0 4px rgba(255,255,255,0.18)";

  const housingStyle: CSSProperties = {
    width,
    padding: 4,
    borderRadius: 6,
    background:
      "linear-gradient(180deg, #cfcdc7 0%, #e7e6e2 35%, #f0efeb 60%, #d4d2cc 100%)",
    boxShadow: housingShadow,
  };

  const screenStyle: CSSProperties = {
    width: "100%",
    height: winHeight,
    borderRadius: 4,
    background:
      "linear-gradient(180deg, #1a1a18 0%, #0d0d0c 50%, #1a1a18 100%)",
    boxShadow: screenShadow,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const digitStyle: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontSize: winHeight * 0.55,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: digitColor,
    textShadow: digitGlow,
    lineHeight: 1,
  };

  // Glass cover: subtle top-down gradient suggesting curved glass.
  // - Bright thin highlight at the very top
  // - Soft fade through the upper third
  // - Faint horizontal reflection band toward the lower middle
  const glassCoverStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: [
      "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0) 85%)",
    ].join(", "),
    mixBlendMode: "screen",
  };

  return (
    <div className="flex flex-col items-stretch gap-1" style={{ width }}>
      {label && (
        <div className="font-mono text-[13px] uppercase tracking-wider text-muted">
          {label}
        </div>
      )}
      <div style={housingStyle}>
        <div style={screenStyle}>
          <span data-readout style={digitStyle}>
            {value}
          </span>
          <div aria-hidden="true" style={glassCoverStyle} />
        </div>
      </div>
    </div>
  );
}
