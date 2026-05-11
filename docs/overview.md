# Overview

## What this is

An open-source parametric parallel-plate perfusion flow chamber for delivering programmable wall-shear-stress waveforms to MLO-Y4 osteocyte-like cells on a Zeiss LSM 880 inverted multiphoton microscope. The system covers hardware (CAD, BOM, machined parts), firmware (Teensy 4.1 + TMC2209 + isolated trigger), and an Electron operator app with a synth-style control surface.

## Who it's for

- **Wet-lab biologists** who want to apply controlled, programmable shear stress to adherent cells on an inverted microscope without writing motor-control code.
- **Replicators** building a similar chamber for osteocyte mechanotransduction, endothelial flow studies, or any parallel-plate adherent-cell shear assay in the 0.5 – 10 Pa range.
- **Method developers** extending the open-source platform — adding new sensors, new waveform protocols, multi-chamber operation, or different cell models.

## What the paper shows

Headline claims (filled in on publication):

1. **Continuous, in-loop, ms-resolved wall shear measurement** via differential pressure across the channel, time-aligned with each microscope frame. First in-loop shear measurement in an osteocyte parallel-plate flow chamber.
2. **Closed-loop shear-stabilized peristaltic perfusion** — the SDP810 sensor is the feedback element controlling pump duty cycle directly on the experimental variable (shear, not flow). Unprecedented in the MLO-Y4 literature.
3. **Quantitative logging of peristaltic pulsation as a covariate** of calcium-flux response, via the high-bandwidth pressure sensor phase-locked to the pump-shaft encoder.
4. **End-to-end open-source release** — parametric CAD, machinable STEP, deterministic firmware, operator app, calibration protocol — all under MIT (code) + CC-BY-4.0 (hardware/docs).

See the paper (TBD on publication) for the experimental dataset and quantitative results.

## How the docs are organized

| Doc | When you need it |
|---|---|
| `docs/theory.md` | The science — channel geometry, shear math, parameter family, materials |
| `docs/architecture.md` | The system — modules, microscope constraint, seal architecture, parametric CAD spec |
| `docs/protocol.md` | The wet-lab procedure — cell culture, dye loading, chamber setup, stimulus, imaging |
| `docs/design_language.md` | The aesthetic — hardware (TX-6 influence) and software (Drams/Rams) |
| `docs/reproducing.md` | The recipe — regenerate a paper figure end-to-end |
| `hardware/` | BOM, assembly, machining notes, CAD, drawings, electronics |
| `firmware/` | PlatformIO project for the Teensy controller |
| `app/` | The Electron operator app |
| `examples/demo_study/` | A sample folder-based study showing the on-disk format |

## Locked technical decisions

These are not negotiable within this paper's scope. Future revisions may revisit them; the current paper measurements are taken with these locked.

| Decision | Locked value |
|---|---|
| Cell line | MLO-Y4 osteocyte-like |
| Microscope | Zeiss LSM 880 inverted (confocal/multiphoton) |
| Reference objective | 40×/1.2 W (water, 0.28 mm WD) |
| Channel | 24 mm × 50 mm × 0.25 mm parallel-plate |
| Cover glass | Thorlabs CG15KH1 #1.5H |
| Pump | Kamoer KCS peristaltic, low-pulsation |
| Controller | Teensy 4.1 + TMC2209 |
| Body material | 316L stainless, electropolished + passivated |
| Sealing | Medical-grade neutral-cure silicone only — **no RTV / no acetoxy** |

Working fluid: α-MEM with serum at 37 °C, μ ≈ 0.9 mPa·s.

Operating shear range: 0.5 – 10 Pa. Operating flow range: ~10 – 200 mL/min through the canonical channel.

## What this project is NOT

- **Not** a long-term bioreactor (no week-long perfusion experiments without separate engineering).
- **Not** a production medical device (no FDA / CE pathway).
- **Not** a microfluidic platform — this is a macro-scale chamber, intentionally compatible with standard wet-lab workflows.

See `CLAUDE.md` for full agent / contributor conventions.
