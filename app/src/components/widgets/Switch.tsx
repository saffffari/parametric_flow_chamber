/**
 * Switch — circular push-button toggle.
 *
 * Visual: ported 1:1 from the Figma "Switch 1" component (file
 * J3aZzdLaJmidPQcOxphPdE, node 1:331 / state pair 1:697 + 1:703).
 *   - Black recessed ring (184.333 unit square)
 *   - Mid-grey base (#949494, 175u) with inset bevel
 *   - Light-grey front cap (#e3e3e3, 169.75u) with multi-layer inset shadows +
 *     a heavy drop shadow that gives the cap its "lifted out of the recess" feel
 *   - Indicator LED above the button (18.667u): grey #e8e8e8 when off, warm
 *     red #d73534 when on (matches the DialSwitch pointer / app accent)
 *   - Cap depresses ~7.58u downward while actively pressed
 *
 * One component, one boolean prop (`checked`). LED color and any future
 * variants flow off that. Default is a click-to-toggle; pass `momentary` to
 * fire onChange with `true` only while held (releases back to false).
 *
 * All measurements scale from the Figma 184.333u reference frame to whatever
 * `size` (button diameter in px) the caller provides. Default 80.
 */

import { useState, type CSSProperties } from "react";

const FIGMA_REF = 184.333;

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Button diameter in px. LED + label scale proportionally. Default 80. */
  size?: number;
  /** Lowercase label rendered below the button. */
  label?: string;
  disabled?: boolean;
  /**
   * Momentary mode: hold to keep checked = true, release fires checked = false.
   * Useful for PRIME / TRIGGER / hold-to-reset style buttons.
   */
  momentary?: boolean;
  /** Override LED-on color. Defaults to app accent `#d73534`. */
  onColor?: string;
  /**
   * Cap appearance:
   *   "light" (default): #e3e3e3 light-grey cap (matches Figma 1:331 / 2009:573)
   *   "dark": dark-grey radial gradient cap (matches knob inner-cap fill —
   *           use for trigger / arming buttons that should read as dark).
   */
  appearance?: "light" | "dark";
  /**
   * Override the cap fill. When set, replaces the appearance preset's color
   * (the grayscale inset-shadow stack still applies, so depth/lift remains).
   * Use for one-off accent buttons — e.g. a red RUN cap that should otherwise
   * keep the same chassis as the surrounding switches.
   */
  capColor?: string;
}

export function Switch({
  checked,
  onChange,
  size = 80,
  label,
  disabled = false,
  momentary = false,
  onColor = "#d73534",
  appearance = "light",
  capColor,
}: SwitchProps) {
  const [pressed, setPressed] = useState(false);
  const s = size / FIGMA_REF; // scale factor

  // LED dimensions
  const ledSize = 18.667 * s;
  const gap = 16 * s; // visual gap between LED and button

  // The button "depresses" by 7.58 figma-units when pressed (state 2/4 in Figma)
  const pressOffset = 7.583 * s;

  const handlePress = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressed(true);
    if (momentary) onChange(true);
  };
  const handleRelease = () => {
    if (disabled) return;
    setPressed(false);
    if (momentary) onChange(false);
    else onChange(!checked);
  };
  const handleCancel = () => {
    setPressed(false);
    if (momentary) onChange(false);
  };

  // The LED's box-shadow stack
  const ledOffShadow = `inset 0px ${2.333 * s}px ${8.167 * s}px ${-2.917 * s}px rgba(0,0,0,0.4)`;
  const ledOnGlow = `inset 0px ${2.333 * s}px ${8.167 * s}px ${-2.917 * s}px rgba(0,0,0,0.4), 0 0 ${10 * s}px ${onColor}80`;

  // Outer recess (black ring + grey inset bevel)
  const recessShadow = `${2.333 * s}px ${5.833 * s}px ${0.583 * s}px ${-1.75 * s}px rgba(0,0,0,0.32)`;
  const recessInsetShadow = `inset ${8.167 * s}px ${0.583 * s}px ${7 * s}px ${-1.167 * s}px black, inset ${-14 * s}px ${-11.667 * s}px ${10.5 * s}px ${-4.083 * s}px black`;
  const greyBaseInsetShadow = `inset ${-4.471 * s}px ${-7.026 * s}px ${7.026 * s}px 0px rgba(0,0,0,0.51), inset ${-7.664 * s}px ${-12.135 * s}px ${11.496 * s}px ${-5.109 * s}px white`;

  // Front cap shadows (the elaborate lit-button look)
  const capShadowLight = [
    `${25.083 * s}px ${30.917 * s}px ${53.667 * s}px ${-4.667 * s}px #1a1a1a`,
    `inset ${1.209 * s}px ${3.023 * s}px 0px ${1.814 * s}px rgba(245,245,245,0.87)`,
    `inset ${-4.232 * s}px ${-6.651 * s}px ${6.651 * s}px 0px rgba(0,0,0,0.51)`,
    `inset ${-7.255 * s}px ${-11.488 * s}px ${10.883 * s}px ${-4.837 * s}px white`,
    `inset ${1.814 * s}px ${4.232 * s}px ${6.046 * s}px ${1.209 * s}px rgba(0,0,0,0.25)`,
    `inset ${6.046 * s}px ${9.674 * s}px ${6.046 * s}px ${2.418 * s}px rgba(255,255,255,0.6)`,
    `inset ${12.697 * s}px ${12.092 * s}px ${55.625 * s}px ${-9.069 * s}px rgba(0,0,0,0.12)`,
  ].join(", ");
  // Dark cap shadow stack: same drop shadow + matching inset bevel layers
  // tuned for a dark surface (less white inset highlight, more depth shadow).
  const capShadowDark = [
    `${25.083 * s}px ${30.917 * s}px ${53.667 * s}px ${-4.667 * s}px #1a1a1a`,
    `inset ${1.209 * s}px ${3.023 * s}px 0px ${1.814 * s}px rgba(110,110,110,0.45)`,
    `inset ${-4.232 * s}px ${-6.651 * s}px ${6.651 * s}px 0px rgba(0,0,0,0.7)`,
    `inset ${-7.255 * s}px ${-11.488 * s}px ${10.883 * s}px ${-4.837 * s}px rgba(160,160,160,0.4)`,
    `inset ${1.814 * s}px ${4.232 * s}px ${6.046 * s}px ${1.209 * s}px rgba(0,0,0,0.6)`,
    `inset ${6.046 * s}px ${9.674 * s}px ${6.046 * s}px ${2.418 * s}px rgba(255,255,255,0.18)`,
    `inset ${12.697 * s}px ${12.092 * s}px ${55.625 * s}px ${-9.069 * s}px rgba(0,0,0,0.45)`,
  ].join(", ");

  const isDark = appearance === "dark";
  // Light cap: flat #e3e3e3. Dark cap: same radial gradient as the knob's
  // inner cap (#333 → #4a → #626), so triggers visually rhyme with the knobs.
  // capColor (when provided) overrides whichever preset is active, keeping
  // the appearance-tuned shadow stack so depth/lift survive the recolor.
  const capBackground = capColor
    ? capColor
    : isDark
      ? "radial-gradient(circle at 50% 35%, #626262 0%, #4a4a4a 55%, #333333 100%)"
      : "#e3e3e3";

  // When a tinted (capColor) Switch is checked, append an outer glow to the
  // cap shadow stack — soft inner halo + wider faint bloom in the cap's own
  // color. Default light/dark Switches don't glow even when checked; only
  // the RUN-style coloured cap "lights up". The glow transitions smoothly
  // with the cap's existing transform transition (we extend it to box-shadow).
  const glowOn = checked && !!capColor;
  const glowShadow = glowOn
    ? `, 0 0 ${22 * s}px ${capColor}cc, 0 0 ${48 * s}px ${capColor}55`
    : "";
  const capShadow = (isDark ? capShadowDark : capShadowLight) + glowShadow;

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ width: size }}
    >
      {/* LED indicator */}
      <div
        aria-hidden="true"
        className="rounded-full"
        style={{
          width: ledSize,
          height: ledSize,
          background: checked ? onColor : "#e8e8e8",
          boxShadow: checked ? ledOnGlow : ledOffShadow,
          transition: "background-color 120ms ease-out, box-shadow 120ms ease-out",
        }}
      />

      <div style={{ height: gap }} />

      {/* Button */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerCancel={handleCancel}
        onPointerLeave={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && handleCancel()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setPressed(true);
            if (momentary) onChange(true);
          }
        }}
        onKeyUp={(e) => {
          if (disabled) return;
          if (e.key === " " || e.key === "Enter") {
            setPressed(false);
            if (momentary) onChange(false);
            else onChange(!checked);
          }
        }}
        className={
          "relative rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
          (disabled ? "cursor-not-allowed" : "cursor-pointer")
        }
        style={{
          width: size,
          height: size,
          border: "none",
          background: "transparent",
        }}
      >
        {/* Recessed black ring with grey inset bevel */}
        <div
          aria-hidden="true"
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: 0,
            background: "black",
            boxShadow: recessShadow,
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              top: "50%",
              left: "50%",
              width: (175 / FIGMA_REF) * 100 + "%",
              height: (175 / FIGMA_REF) * 100 + "%",
              transform: "translate(-50%, -50%)",
              background: "#949494",
              boxShadow: greyBaseInsetShadow,
            }}
          />
          {/* Recess overlay shadow (the dark band when cap lifts up) */}
          <div
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              inset: 0,
              boxShadow: recessInsetShadow,
            }}
          />
        </div>

        {/* Front cap — depresses on press, lifts back on release. */}
        <div
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: (169.75 / FIGMA_REF) * 100 + "%",
            height: (169.75 / FIGMA_REF) * 100 + "%",
            transform: `translate(-50%, calc(-50% + ${pressed ? pressOffset : -9.63 * s}px))`,
            background: capBackground,
            boxShadow: capShadow,
            transition:
              "transform 90ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 200ms ease-out",
          } as CSSProperties}
        />
      </button>

      {label && (
        <div className="mt-2 font-mono text-[13px] uppercase tracking-wider text-muted">
          {label.toLowerCase()}
        </div>
      )}
    </div>
  );
}
