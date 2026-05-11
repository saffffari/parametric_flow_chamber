/**
 * FlowCellView — particle abstraction of the channel for the DISPLAY block.
 *
 * Side-on view of the parallel-plate channel. ~140 points are advected by the
 * Poiseuille parabolic velocity profile u(y) ∝ (1 − y²). No motion trails, no
 * drawn walls; the recessed screen frame *is* the channel boundary, and the
 * relative speed of centerline vs near-wall particles carries the gradient
 * visually on its own.
 *
 * Sensor parametrization:
 *   - Q (flow, mL/min)  → particle advection velocity (linear in Q)
 *   - T (°C)            → Brownian jitter amplitude (kT scaling, very subtle)
 *
 * Particles are kept in a ref'd array so the rAF loop does not trigger React
 * re-renders. Same pattern as RotatingWheel.
 *
 * Aspect note: the real channel is 50 mm × 0.25 mm — a 200 : 1 slot. The
 * widget renders at the (width, height) the parent gives it (locked to 2:1
 * upstream), which exaggerates h so the parabolic profile is legible. Relative
 * velocities and Poiseuille curvature are preserved; only the visible y scale
 * is stretched.
 */

import { useEffect, useRef } from "react";

const N_PARTICLES = 320;

// Reference Q at which the centerline particle traverses the canvas in ~1 s.
// Tuned to feel responsive across the chamber's 8–83 mL/min operating range
// (0.5–5 Pa at 24×50×0.25 mm, μ = 0.9 mPa·s).
const Q_REF_MLMIN = 60;
// Reference temperature (canonical media temp). Brownian jitter scales with
// (T_K / T_REF_K) so cold media barely moves while hot media has visible hum.
const T_REF_C = 37;

export interface FlowCellViewProps {
  width: number;
  height: number;
  /** Volumetric flow rate (mL/min). Drives particle advection speed. */
  flowMlMin: number;
  /** Liquid temperature (°C). Drives Brownian jitter amplitude. */
  tempC: number;
  /** Optional aria label override. */
  ariaLabel?: string;
}

interface Particle {
  x: number; // normalized 0..1 along flow direction
  y: number; // normalized -1..+1 across channel height; ±1 = walls
}

export function FlowCellView({
  width,
  height,
  flowMlMin,
  tempC,
  ariaLabel,
}: FlowCellViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);

  // Latest props mirrored into a ref so the rAF loop reads them without
  // restarting on every telemetry tick. Matches the RotatingWheel pattern.
  const propsRef = useRef({ flowMlMin, tempC });
  propsRef.current = { flowMlMin, tempC };

  // One-shot particle initialization. Uniform fill so the channel is "primed"
  // on first paint instead of dribbling in from the inlet.
  if (particlesRef.current === null) {
    const arr: Particle[] = [];
    for (let i = 0; i < N_PARTICLES; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random() * 2 - 1,
      });
    }
    particlesRef.current = arr;
  }

  // Resize the backing store on width/height change. HiDPI handled here so
  // the rAF loop draws in CSS pixels.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }, [width, height]);

  // rAF render loop — runs once for the component lifetime.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastTs: number | null = null;

    const tick = (now: number) => {
      const particles = particlesRef.current;
      if (!particles) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // dt seconds, clamped to absorb tab-switch gaps.
      const dt = lastTs == null ? 0 : Math.min((now - lastTs) / 1000, 0.1);
      lastTs = now;

      const p = propsRef.current;

      // Poiseuille mean velocity normalized to canvas-per-second.
      // uCenter = 1.5 × uMean from the parabolic profile.
      const uMeanNorm = Math.max(0, p.flowMlMin) / Q_REF_MLMIN;
      const uCenterNorm = 1.5 * uMeanNorm;

      // Brownian σ — physically D = kT/(6πμr). Here we just take the kT term
      // and ignore the rest (constant for a given particle size / viscosity),
      // then tune the absolute magnitude so it's visible but not jarring.
      const tK = p.tempC + 273.15;
      const tRefK = T_REF_C + 273.15;
      const tempFactor = Math.max(0.5, tK / tRefK);
      const sigma = Math.sqrt(2 * dt) * tempFactor * 0.006;

      const w = width;
      const h = height;

      // Integrate particles. The screen edges are the channel walls — no
      // internal padding, no drawn wall lines.
      for (const part of particles) {
        // Parabolic velocity at this y. u(y) = uCenter · (1 − y²).
        const vx = uCenterNorm * (1 - part.y * part.y);
        part.x += vx * dt;

        // Brownian jitter. Y > X because cross-flow diffusion is the more
        // visually interesting one (would mix the velocity profile).
        part.x += sigma * gauss() * 0.3;
        part.y += sigma * gauss();

        // Reflect at walls; parabolic vx → 0 there but Brownian can poke a
        // particle through.
        if (part.y > 1) part.y = 2 - part.y;
        else if (part.y < -1) part.y = -2 - part.y;
        if (part.y > 1) part.y = 1;
        else if (part.y < -1) part.y = -1;

        // Wrap at the outlet — respawn at the inlet on a fresh y.
        if (part.x > 1) {
          part.x -= 1;
          part.y = Math.random() * 2 - 1;
        }
        if (part.x < 0) part.x += 1;
      }

      // ---------- draw ----------

      // Dark panel fill. The wrapper div carries the rounded frame and the
      // recess shadow, so the canvas just paints the field.
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      // Particles — single dot per particle, full canvas span.
      ctx.fillStyle = "#e8e8e8";
      for (const part of particles) {
        const px = part.x * w;
        const py = ((part.y + 1) / 2) * h;
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  // Recess + frame stack — stronger than the original pass for a deeper,
  // more pronounced "lit display in a deep recess" feel.
  //
  // Layering note: CSS draws inset box-shadow above the background but
  // *below* element content, so a canvas child would cover an inset shadow
  // applied to its own wrapper. We therefore split the treatment:
  //   - Outer wrapper carries the outset hairline frame.
  //   - A sibling overlay div (pointer-events: none) sits over the canvas
  //     and carries both the inset recess shadows and a glass-sheen gradient.
  const insetShadow = [
    "inset 0 6px 12px rgba(0,0,0,0.75)",
    "inset 0 1px 0 rgba(0,0,0,0.85)",
    "inset 2px 0 6px rgba(0,0,0,0.4)",
    "inset 0 -1px 0 rgba(255,255,255,0.45)",
  ].join(", ");

  // Glass cover — top-bright reflection fading through transparent to a hint
  // of bottom shade. Stronger than the original to read as a clear glass
  // sheet over the lit display.
  const glassSheen =
    "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)";

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? "channel flow visualization, points advected by Poiseuille profile"}
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.7)",
        background: "#0a0a0a",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "block",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 8,
          boxShadow: insetShadow,
          background: glassSheen,
        }}
      />
    </div>
  );
}

// Box-Muller. Cached pair, second sample served from cache for free.
let _gaussCached: number | null = null;
function gauss(): number {
  if (_gaussCached !== null) {
    const v = _gaussCached;
    _gaussCached = null;
    return v;
  }
  let u1 = Math.random();
  while (u1 === 0) u1 = Math.random();
  const u2 = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0 = mag * Math.cos(2 * Math.PI * u2);
  _gaussCached = mag * Math.sin(2 * Math.PI * u2);
  return z0;
}
