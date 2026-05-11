/**
 * Control Panel — synth-style operator surface.
 *
 * Two-column layout (right column ~1/3 of width):
 *   Left:
 *     - SHEAR (knob + roller) — top, fills height
 *     - OSC (waveforms + ampl/freq) — bottom-left half, sized to content
 *   Right:
 *     - CHANNEL (display + single-line tickers) — top, fills height
 *     - RUN (ramp-in / duration / ramp-out timing) — middle
 *     - TRANSPORT (run/stop/spin/prime) — bottom
 *
 * RUN sits directly above TRANSPORT because the timing knobs and the run
 * buttons together form the "what's the run going to do, and start it"
 * cluster. The bottom-left row has OSC alone with an empty flex-1 spacer to
 * the right so OSC stays at the same width as TRANSPORT — preserves the
 * matching button-spacing.
 *
 * Custom widgets (knobs, waveform selector, 7-segment readouts, rotating
 * wheel) ship as their own components in `widgets/`. Calibration / viscosity
 * / port / operator settings live in the Settings drawer (top-bar gear icon).
 *
 * SyncBlock is parked (not rendered) for the current Ithaca-bound build;
 * microscope trigger work is post-deadline punch list.
 */

import { TransportBlock } from "./blocks/TransportBlock";
import { ShearBlock } from "./blocks/ShearBlock";
import { OscBlock } from "./blocks/OscBlock";
import { EnvBlock } from "./blocks/EnvBlock";
import { DisplayBlock } from "./blocks/DisplayBlock";

export function ControlPanel() {
  return (
    <div className="flex h-full gap-4 px-6 pb-6 pt-1">
      {/* Main column — primary control surface. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Block className="flex-1">
          <ShearBlock />
        </Block>
        <div className="flex shrink-0 gap-4">
          <Block className="flex-1" label="OSC">
            <OscBlock />
          </Block>
          {/* Empty spacer — keeps OSC at its previous half-width (matching
              TRANSPORT) now that RUN has migrated to the right column. */}
          <div className="flex-1" aria-hidden="true" />
        </div>
      </div>

      {/* Channel column — display + readouts + run-timing + transport stacked.
          Width tuned to ~1/3 of the panel so the column matches the OSC block
          on the left, which makes TRANSPORT's 4 buttons spread at the same
          spacing as OSC's 4 waveform switches. RUN sits directly above
          TRANSPORT since the timing knobs and the run controls together form
          the "what's this run, and start it" cluster. */}
      <div className="flex w-1/3 min-w-0 shrink-0 flex-col gap-4">
        <Block className="flex-1">
          <DisplayBlock />
        </Block>
        <Block className="shrink-0">
          <EnvBlock />
        </Block>
        <Block className="shrink-0" label="TRANSPORT">
          <TransportBlock />
        </Block>
      </div>
    </div>
  );
}

function Block({
  className,
  label,
  children,
}: {
  className?: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-md bg-surface-raised p-4 ${className ?? ""}`}
    >
      {label && (
        <div className="mb-3 font-mono text-[13px] uppercase tracking-[0.25em] text-muted/60">
          {label}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
