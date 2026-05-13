# Parametric Flow Chamber

Open-source, parametric, parallel-plate perfusion flow chamber for delivering programmable wall-shear-stress waveforms to MLO-Y4 osteocyte-like cells on a Zeiss LSM 880 inverted multiphoton microscope. Includes hardware CAD, Teensy 4.1 firmware, and an Electron operator app with a synth-style control surface.

This repo is the companion to the paper. A first-time reader should be able to fabricate the chamber, flash the firmware, run the controller app, and reproduce paper figures from this single repository.

## Quickstart

| Goal | Path |
|---|---|
| Understand the science | [`docs/theory.md`](docs/theory.md) → [`docs/architecture.md`](docs/architecture.md) |
| Run the wet-lab protocol | [`docs/protocol.md`](docs/protocol.md) |
| Fabricate the chamber | [`hardware/bom.md`](hardware/bom.md) → [`hardware/assembly.md`](hardware/assembly.md) → [`hardware/machining_notes.md`](hardware/machining_notes.md) → vendor PDFs in [`hardware/drawings/`](hardware/drawings) |
| Flash the firmware | [`firmware/README.md`](firmware/README.md) |
| Run the operator app | [`app/README.md`](app/README.md) |
| Reproduce a paper figure | [`docs/reproducing.md`](docs/reproducing.md) (TBD) |

## What this is

A laminar parallel-plate perfusion chamber where the operator dials a single wall-shear-stress waveform in physical units (Pa). All other engineering quantities — flow rate, step pulse rate, microstepping, motor current — derive from chamber geometry, media viscosity, and the shear setpoint. The operator never sees an RPM.

The chamber:

- 316L stainless body, electropolished and passivated wetted surfaces.
- 24 mm × 50 mm × 0.25 mm channel under a Thorlabs CG15KH1 #1.5H cover glass.
- Inverted-microscope geometry: cells on the cover-glass floor, objective images from below.
- Autoclavable. No RTV silicone. No acetoxy-cure adhesives.

The controller:

- Teensy 4.1 + TMC2209 stepper driver running PlatformIO firmware.
- Inline liquid flow measurement via Sensirion SLF3S-1300F (PEEK-wetted, in the controller body, reports flow rate + media temperature on the same I²C frame).
- Closed-loop control on wall shear stress via direct flow + Hagen-Poiseuille geometry mapping.
- Optically-isolated BNC trigger to/from the microscope.
- microSD log of every sample, time-aligned with each LSM 880 frame.

In-loop measurement is via direct liquid flow (SLF3S-1300F). The differential-pressure approach is described in the methods section as a one-time per-chamber validation step, not as a deployed-device sensor; see `docs/protocol.md` for the validation procedure and `hardware/electronics/README.md` for the architecture.

The app:

- Electron + React + TypeScript with a synth-style control panel (OSC / SHEAR / ENV / DISPLAY / SYNC / TRANSPORT / MASTER).
- Mock-first: full development without hardware.
- Folder-based study persistence (JSON + CSV per run, no proprietary container).
- Mac (`.dmg`) and Windows (`.exe`/`.msi`) builds.

## Repo layout

- `docs/` — theory, architecture, protocol, design language, reproducing-a-figure recipes
- `hardware/` — BOM, assembly, machining notes, CAD source + STEP + drawings, electronics
- `firmware/` — PlatformIO project for Teensy 4.1
- `app/` — Electron + React + TypeScript operator app
- `examples/` — sample folder-based study and figure-regen scripts
- `.github/` — issue templates and CI workflows

## Status

This is the v2.0 release: the first public release. v1.0 was an undergraduate honors thesis prototype (Saffari, Cornell, 2024) that was not publicly released; v2.0 is a full rebuild with a parametric CAD source, a deterministic-timing firmware, and a new operator app on the Electron stack. See [`CHANGELOG.md`](CHANGELOG.md).

## Citing this work

If you use this chamber, the firmware, the app, or methods derived from this repository in academic work, please cite both the paper and the software archive.

**Software** (this repository):

```
Saffari, A., Rocca, I., Matthews, M., & Lewis, K. (2026).
Parametric Flow Chamber (v2.0).
[DOI / GitHub URL TBD on publication]
```

**Paper** (the methods paper this repository accompanies): TBD on publication.

A machine-readable citation file is in [`CITATION.cff`](CITATION.cff). GitHub renders the "Cite this repository" button from it.

## License

- **Code** (`firmware/`, `app/`, scripts in `examples/`): [MIT License](LICENSE).
- **Hardware and documentation** (`hardware/`, `docs/`, `examples/figures/`): [Creative Commons Attribution 4.0 International](LICENSE-HARDWARE).

These are the standard JOSS-aligned pair for open-source hardware companions to academic papers. You may use, modify, fabricate, and redistribute under these terms; please give appropriate credit and indicate any changes you made.

## Contributing

Issues and pull requests are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md). Use the issue templates for bug reports, feature requests, and hardware questions.

## Acknowledgements

Cell line: MLO-Y4 (Bonewald lab, U. Missouri-Kansas City; gift; Lu et al. 2012). In vivo loading framework: Lewis et al. 2017 (Cornell). Machining: vendor TBD. Microscopy: Cornell Imaging Facility.
