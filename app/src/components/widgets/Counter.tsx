/**
 * Counter — Braun-TG-60-style mechanical-counter readout.
 *
 * One recessed window (light chrome surface, hairline frame, subtle glass
 * sheen on top) houses all the digits. Each digit position is its own
 * vertical drum: a column of 0-9 stacked inside an `overflow: hidden`
 * window, translated so the active digit is centered. Changes animate as
 * a smooth roll between values, the way the rolling-drum mechanical
 * counters in vintage tape decks behave.
 *
 * Punctuation characters (decimal point, colon, minus) render statically —
 * they don't roll.
 *
 * Format presets:
 *   - "scalar"  → XX.XX, leading-zero padded (0.30 → "00.30"). Decimals
 *                 controlled by `digits` (default 2).
 *   - "integer" → zero-padded to at least `digits` characters (default 4).
 *   - "time"    → MM:SS for values < 1 hour; HH:MM:SS otherwise.
 */

interface CounterProps {
  value: number;
  format?: "scalar" | "integer" | "time";
  /** scalar: decimals (default 2). integer: min total digits (default 4). */
  digits?: number;
  /** Single-digit cell width in px. Cells scale to ~1.45× height. Default 14. */
  size?: number;
  /** Optional unit suffix in plain mono text (rendered outside the recess). */
  unit?: string;
}

function formatValue(
  value: number,
  format: NonNullable<CounterProps["format"]>,
  digits: number,
): string {
  if (!Number.isFinite(value)) return "----";
  if (format === "time") {
    const total = Math.max(0, Math.round(value));
    if (total < 3600) {
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (format === "integer") {
    const minDigits = Math.max(1, digits);
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(Math.round(value));
    return `${sign}${String(abs).padStart(minDigits, "0")}`;
  }
  // scalar — XX.XX with leading zero
  const dec = Math.max(0, digits);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const fixed = abs.toFixed(dec);
  const [whole, frac] = fixed.split(".");
  const wholePadded = whole.padStart(2, "0");
  return frac ? `${sign}${wholePadded}.${frac}` : `${sign}${wholePadded}`;
}

export function Counter({
  value,
  format = "scalar",
  digits,
  size = 14,
  unit,
}: CounterProps) {
  const effectiveDigits = digits ?? (format === "integer" ? 4 : 2);
  const text = formatValue(value, format, effectiveDigits);
  const chars = Array.from(text);

  const cellH = Math.round(size * 1.5);
  const cellW = size;
  const punctW = Math.max(4, Math.round(size * 0.4));
  const fontSize = Math.round(size * 1.05);
  const padX = Math.max(4, Math.round(size * 0.35));
  const padY = Math.max(2, Math.round(size * 0.18));

  return (
    <span className="inline-flex items-center align-baseline font-mono">
      <span
        aria-label={text}
        className="relative inline-flex items-center overflow-hidden rounded-[3px]"
        style={{
          // Off-white face — between the panel surface (#cccccc) and the
          // overlay white (#ffffff). Reads as a lit display rather than a
          // hole punched in the panel.
          background: "#e0e0e0",
          // Deep recess. Order:
          //   1. heavy dark inset shadow up top — the "well" cavity
          //   2. sharp dark line at the very top edge — crisp cliff
          //   3. soft inner shadow from the right too, so the well isn't
          //      flat-lit (gives the glass a sense of depth)
          //   4. bright inner sliver at bottom — catches the implied panel
          //      light
          //   5. dark hairline frame around the whole recess
          //   6. faint outer bezel shine just below the frame — the chrome
          //      bezel ring catching a touch of room light
          boxShadow: [
            "inset 0 3px 4px rgba(0,0,0,0.18)",
            "inset 0 1px 0 rgba(0,0,0,0.2)",
            "inset 0 -1px 0 rgba(255,255,255,0.3)",
            "0 0 0 1px rgba(0,0,0,0.2)",
            "0 1px 1px rgba(255,255,255,0.2)",
          ].join(", "),
          paddingLeft: padX,
          paddingRight: padX,
          paddingTop: padY,
          paddingBottom: padY,
          gap: 0,
        }}
      >
        {chars.map((ch, i) => (
          // Key by position only, NOT by character — stable key keeps the
          // DigitSlot mounted across digit changes so its CSS transition can
          // roll the drum from old digit to new. Keying with the character
          // would remount on every change and skip the animation.
          <DigitSlot
            key={i}
            char={ch}
            cellW={cellW}
            cellH={cellH}
            punctW={punctW}
            fontSize={fontSize}
          />
        ))}
        {/* Glass face — subtle top highlight fading down through neutral to
            a hint of bottom shade. Suggests a transparent sheet over the
            recessed display catching incident light. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 35%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.08) 100%)",
            borderRadius: "inherit",
          }}
        />
      </span>
      {unit && (
        <span
          className="ml-1.5 text-muted"
          style={{ fontSize: Math.round(size * 0.85) }}
        >
          {unit}
        </span>
      )}
    </span>
  );
}

function DigitSlot({
  char,
  cellW,
  cellH,
  punctW,
  fontSize,
}: {
  char: string;
  cellW: number;
  cellH: number;
  punctW: number;
  fontSize: number;
}) {
  const isDigit = /[0-9]/.test(char);
  const color = "#0d0d0d";

  if (!isDigit) {
    // Punctuation: static render, narrow cell.
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: punctW,
          height: cellH,
          color,
          fontSize,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}
      >
        {char}
      </span>
    );
  }

  const digit = parseInt(char, 10);
  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ width: cellW, height: cellH }}
    >
      {/* Drum: stack of 0-9, translated to expose the active digit. */}
      <span
        className="absolute left-0 top-0 flex flex-col items-center"
        style={{
          width: cellW,
          transform: `translateY(${-digit * cellH}px)`,
          transition: "transform 260ms cubic-bezier(0.4, 0.0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className="flex shrink-0 items-center justify-center"
            style={{
              width: cellW,
              height: cellH,
              color,
              fontSize,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}
