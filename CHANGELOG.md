# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha] — 2026-05-10

First packaged alpha build. The operator app is feature-complete against the
mock interface; live firmware integration resumes on the bench when the
replacement Teensy + TMC2209 land. Tracked toward the v2.0 paper-companion
release captured below — this is the first public-shape snapshot of that work.

### Added

- Electron operator app — custom frameless title bar (File / Edit / View
  dropdowns + window controls), Braun TG-60-inspired control surface, SHEAR
  major knob paired with a pump-roller wheel, OSC waveform + AMPL/FREQ minor
  knobs, RUN (ramp-in / duration / ramp-out), TRANSPORT (run/stop/spin/prime),
  CHANNEL block with a Poiseuille-flow particle visualization and live
  SHEAR/FLOW/TEMP/TIMER readouts.
- Library sidebar with study tree, multi-select runs (shift / ctrl click),
  inline rename on double-click, +group / +run shortcuts, right-click delete
  for one or many runs.
- Folder-based study persistence (JSON + CSV per run) and mock interface
  enabling hardware-free development of every UI path.
- Firmware (`firmware/`) and open-hardware artifacts (`hardware/`) staged for
  bench integration; see `[2.0.0]` below for the full v2.0 manifest.

### Known limitations

- Bench-side firmware verification deferred to the next bench session.
- No imaging-file SHA256, no run import, no auto-updater.

## [2.0.0] — TBD

Initial public release. Paper companion repo for the parametric parallel-plate flow chamber.

### Added

- Open hardware: parametric Fusion CAD (`hardware/cad/source/`), machinable STEP (`hardware/cad/step/`), vendor-facing PDF drawings (`hardware/drawings/`), third-party component STEP files (`hardware/cad/components/`), bill of materials (`hardware/bom.md`), assembly procedure (`hardware/assembly.md`), machining reference notes (`hardware/machining_notes.md`).
- Firmware for Teensy 4.1 + TMC2209: PlatformIO project under `firmware/` with deterministic STEP-pulse generation, microSD logging, isolated BNC trigger interface, watchdog, and host serial protocol.
- Electron operator app (`app/`): React 18 + TypeScript, Tailwind v4, Radix UI, motion, Zustand, uPlot. Synth-style operator surface (OSC / SHEAR / ENV / DISPLAY / SYNC / TRANSPORT / MASTER). Folder-based study persistence (JSON + CSV per run). Mock interface for hardware-free development. Mac (`.dmg`) and Windows (`.exe`/`.msi`) builds.
- Documentation: scientific theory and shear math (`docs/theory.md`), system architecture (`docs/architecture.md`), wet-lab protocol (`docs/protocol.md`), industrial design language (`docs/design_language.md`), differential-pressure shear-verification system (`hardware/electronics/README.md`), microscope and cover-glass constraints.
- Examples: a sample folder-based study (`examples/demo_study/`) demonstrating the on-disk format, with sample protocols (sine, square, triangle, DC) and run telemetry.
- Open-source ceremony files: MIT for code, CC-BY-4.0 for hardware/docs, `CITATION.cff`, `CONTRIBUTING.md`, GitHub issue templates and CI workflows.

## [1.0.0] — 2024 (retrospective)

Undergraduate honors thesis prototype (Saffari, Cornell, 2024). v1.0 was not publicly released; v2.0 (this release) is the first public release. Source materials from the thesis are preserved internally at `archive/flow_chamber_v1/thesis_source/` (out of repo scope; not shipped). The v1.0 Python/Qt controller app is preserved at `archive/flow_chamber_v1/python_v0.1_app/` as a parity reference for the v2.0 Electron port.

### Carried forward into v2.0

- Channel geometry and shear-equation framework (refined to canonical 24 mm × 50 mm × 0.25 mm).
- Folder-based study persistence schema (JSON + CSV); v2.0 wire-format is identical so old/new tooling cross-reads.
- Calcium-imaging protocol via Fura Red on the Zeiss LSM 880; updated for the canonical chamber geometry and a six-parameter waveform family.

### Superseded

- Internal v3.9 / v4.0 / v4.1 dev sprints (between v1.0 and v2.0) are retired; their work product is folded into v2.0 directly.
- v1.0 5 mm × 0.250 mm × 75 mm legacy channel; superseded by the 24 mm × 50 mm × 0.25 mm canonical channel (full cover-glass-footprint width).
