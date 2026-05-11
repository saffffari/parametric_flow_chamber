# Theory

> Migrated from `design_spec_v2.md` in the dev archive (theory portions). Architecture/system sections moved to `docs/architecture.md`. Industrial design language moved to `docs/design_language.md`. Cited references for the wet-lab protocol live in `docs/protocol.md`.

## Scientific target

A modular, open-source, live-cell flow chamber that applies well-defined laminar fluid shear stress while imaging osteocyte calcium signaling in real time.

Primary biological models:

- MLO-Y4 osteocyte-like cells.
- IDG-SW3 osteocyte-lineage cells.
- General adherent cell lines with substrate-specific adaptation.

Primary readouts, aligned with Lewis 2017:

- fraction of responding cells;
- activation latency after flow onset;
- calcium peak magnitude;
- decay/recovery time;
- calcium area under curve;
- event frequency / oscillation behavior;
- threshold curves across shear stress and substrate conditions.

## Optical and substrate geometry

Default substrate:

- Thorlabs CG15KH1 #1.5H cover glass reference.
- Material: Schott D263 M.
- Nominal size: 24.0 × 50.0 mm.
- Dimensional tolerance: ± 0.2 mm.
- Nominal thickness: 0.170 mm.
- Thickness tolerance: ± 0.005 mm.
- Prototype CAD pocket target before physical measurement: 50.8 mm long × 24.8 mm wide with 0.5 mm internal corner radii.
- Rationale: the cell-covered cover glass should drop into the pocket without scraping, prying, or tight sterile handling; exact XY registration is less important than gentle placement.

Default biology orientation:

- cells grow on the fluid-facing side of the cover glass;
- cover glass forms the optical floor of the channel;
- objective images from below through the cover glass.

This is the easiest geometry for high-NA live calcium imaging.

## Channel geometry

Locked reference channel:

- width: 24 mm (matches the full Thorlabs CG15KH1 cover-glass width);
- length (active): 50 mm (matches the full cover-glass length);
- height: 0.25 mm (250 µm), hard-stop controlled;
- central imaging width: 3 mm preferred for near-uniform shear (matches the LSM 880 40× field of view);
- developed entrance: at the locked geometry, the analytical entrance length is well under 1 mm across the operating envelope, so the full 50 mm channel is fully developed.

### Shear equation

For a parallel-plate channel with width `w`, height `h`, volumetric flow rate `Q`, and dynamic viscosity `μ`:

```
τ = 6 · μ · Q / (w · h²)
```

Using canonical media viscosity `μ = 0.9 mPa·s` (α-MEM with serum at 37 °C), width `w = 24 mm`, and height `h = 0.25 mm`:

| Shear stress | Flow rate |
|---:|---:|
| 0.5 Pa | 8.33 mL/min |
| 1.0 Pa | 16.67 mL/min |
| 1.5 Pa | 25.00 mL/min |
| 2.0 Pa | 33.33 mL/min |
| 3.0 Pa | 50.00 mL/min |
| 5.0 Pa | 83.33 mL/min |

Reynolds number stays below ~25 across the entire 0.5–10 Pa operating envelope; flow remains laminar with entrance length ≪ 1 mm, and Hagen-Poiseuille applies through the full 50 mm channel. See `docs/protocol.md` and `hardware/electronics/README.md` § "Pressure & Shear Verification System" for the same flow values cross-referenced with the in-loop ΔP measurement.

## Materials

| Element | Locked / preferred material |
|---|---|
| Chamber body | 316L stainless steel |
| Interior wetted finish | electropolished and passivated |
| Default cell substrate | #1.5 borosilicate cover glass |
| Titanium study substrate | titanium-modified glass or explicit ceiling insert |
| Custom well plate / holder | machined polycarbonate holder, not assay substrate |
| Tubing into chamber | 1/16 inch OD FEP/PTFE |
| Pump tubing | platinum-cured silicone matched to pump head |
| Seal | laser-cut medical silicone or FKM, or O-ring with hard stops |
| Reservoir | borosilicate GL45 bottle |
