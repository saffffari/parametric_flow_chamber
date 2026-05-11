# CLAUDE.md

Agent context and conventions for this repo. Read this in full at the start of any session before authoring code or docs.

## 1. Project state (locked unless flagged)

Single source of truth for load-bearing constants. Do not change without flagging the consequence (CAD re-machining, firmware constant updates, protocol re-validation).

| Constant | Value | Source of authority |
|---|---|---|
| Channel width | **24 mm** | Locked geometry; matches Thorlabs CG15KH1 cover-glass width |
| Channel length (active) | **50 mm** | Locked geometry; matches Thorlabs CG15KH1 cover-glass length |
| Channel height | **0.25 mm** (250 µm) | Locked geometry; hard-stop controlled, not torque-controlled |
| Cell line | **MLO-Y4** osteocyte-like | Bonewald / Kato 1997; lab-supplied |
| Microscope | **Zeiss LSM 880 inverted** | Confocal/multiphoton; both modes available |
| Reference objective | **40×/1.2 W** (water, 0.28 mm WD) | Primary high-NA live-cell constraint |
| Pump | **Kamoer KCS** peristaltic, low-pulsation head | |
| Controller MCU | **Teensy 4.1** | Deterministic timers, native USB, onboard SDIO |
| Stepper driver | **TMC2209** in STEP/DIR + UART config | |
| In-loop shear sensor | **Sensirion SDP810-500Pa** differential pressure (gas-side via standpipes) | |
| Encoder | **AS5600** magnetic, 14-bit position, I²C | |
| E-stop | **Latching motor-power switch** that physically removes 24 V from TMC2209 | |
| Sealing | **Medical-grade neutral-cure silicone only** | RTV / acetoxy-cure forbidden — see § 3 |
| Body material | **316L stainless**, electropolished + passivated | Wetted surfaces |
| Cover glass | **Thorlabs CG15KH1** #1.5H, 24 × 50 × 0.170 mm | |
| Working fluid | **α-MEM with serum** at 37 °C, μ ≈ **0.9 mPa·s** | Per Poon et al. 0.83–0.95 range |
| BNC trigger | **Optically isolated** to/from microscope | No shared ground with i880 |

## 2. Authoritative doc map

Go to the right doc first instead of grepping the whole repo.

| Doc | What it covers |
|---|---|
| `docs/theory.md` | Shear math, parameter family, scientific target, channel geometry, materials |
| `docs/architecture.md` | System modules, microscope constraint, seal architecture, Fusion parameter set, validation plan |
| `docs/protocol.md` | Wet-lab procedure: cell culture, cover-glass coating, dye loading, chamber assembly, steady and oscillatory stimulus, imaging configuration, data analysis |
| `docs/design_language.md` | Hardware aesthetic (TX-6) + software aesthetic (Drams/Rams) |
| `docs/reproducing.md` | End-to-end recipe to regenerate a paper figure (TBD; author when figures are finalized) |
| `hardware/machining_notes.md` | Vendor-facing reference: tolerances, surface finishes, port specs, drawing callouts |
| `hardware/electronics/README.md` | Controller architecture + pressure & shear verification system + bench bring-up checklist (consolidated) |
| `hardware/coverglass_spec.md` | Cover glass spec + pocket clearance |
| `hardware/microscope_i880_constraints.md` | LSM 880 stage / objective envelope |
| `hardware/scope_holder_reference.md` | Caliper-derived holder/objective reference for collision checks |
| `firmware/README.md` | PlatformIO build + Teensy upload procedure |
| `app/README.md` | Electron app build, mock-mode dev, packaging |
| `examples/demo_study/` | Reference folder-based study format (protocols + runs) |

## 3. Non-negotiable rules

- **Geometry locked.** 24 mm × 50 mm × 0.25 mm channel (matches the full Thorlabs CG15KH1 cover-glass footprint). Any change requires re-machining, re-calibration, and protocol re-validation; flag explicitly.
- **No RTV / acetoxy-cure silicone anywhere.** RTV outgasses acetic acid that kills MLO-Y4 (per Karl Lewis). Use only medical-grade neutral-cure silicone for any sealing or encapsulation.
- **No ASCII diagrams in docs.** Convert to prose + bullets, or render to image (Mermaid, SVG). Markdown tables and CLI-output code blocks are fine.
- **App surface fill locked at `#CCCCCC`** (updated 2026-05-10; was `#F6F6F6` → `#D9D9D9` → `#CCCCCC` over the same session). Window, header, sidebar, every panel block, status bar, settings drawer — all share one surface tone. Block separation is carried by hairline borders only, no tonal stepping. **Knob caps are near-black at `#0D0D0D`** (5% L) — Braun-TG-60-style dark-control-on-light-panel arrangement. The surface lock lives in `app/src/styles/globals.css` (`--color-surface` and `--color-surface-raised`); do not diverge them or hardcode the literal in components — always reference `bg-surface` / `bg-surface-raised`.
- **Sterility.** Chamber must be autoclavable. SDP810 is gas-only via standpipes; never wetted. Hydrophobic 0.22 µm membrane separators (Millex-FG) isolate gas from media.
- **E-stop must be NC** (normally closed) — fail-safe; latches motor-power-removed on actuation.
- **Teensy is 3.3 V only.** Any 5 V signal must be level-shifted or isolated. No exceptions.
- **TMC2209 `ENABLE` defaults disabled** at boot/reset (pull-up). Drivers do not energize unless commanded.
- **No CAD changes without flagging machining impact.** Steel is not free; re-cuts cost time.
- **Edit in place.** Never create `_v2`/`_old`/`_backup` filename forks. Git history is version control.

## 4. Code review discipline (recursive)

Before declaring any code-touching task done:

1. **Self-review every diff for bugs:**
   - Off-by-one errors, null/undefined access, edge cases (empty input, single element, max N), missing error handling.
   - Firmware-specific: ISR safety (no SD writes, no `malloc`, no blocking), race conditions between ISR and main loop, watchdog timing, pin direction at boot.
   - Resource leaks: file handles, sockets, allocator pairs, GPIO state.

2. **Self-review for performance:**
   - Unnecessary loops, repeated computation that could be hoisted, O(n²) where O(n) or O(n log n) is achievable.
   - Hot-path I/O, blocking SD writes, blocking USB serial in control loop.
   - In firmware: STEP pulse timing must not jitter; sensor I²C reads must complete inside their slot.

3. **Run available linters, type checkers, and tests.**

4. **If any review pass surfaces an issue, fix it and re-run the entire review from step 1.** Loop until the review converges with zero findings on a complete pass.

5. **Only then mark the task done.**

**Recursive means:** each fix can introduce new issues. Don't trust the first clean pass after a fix — restart the review.

## 5. Cross-platform discipline

The Electron app must build and run cleanly on **macOS** and **Windows**. Do not assume one OS.

- Use `path.join` / `path.resolve`; never hardcode `/` or `\` in file paths.
- Line endings: `.gitattributes` enforces `LF` for source, `CRLF` for Windows-only files.
- `serialport` ships native bindings per-platform; ensure both x64 and arm64 prebuilds are pulled at install.
- `electron-forge make` config must include both `dmg` (macOS) and `exe` / `msi` (Windows) makers.
- Verify on real hardware (or VM) before tagging a release. CI cross-builds in `.github/workflows/ci.yml`.

## 6. Hardware-in-the-loop discipline

- **Mock interface only** for `npm run dev`, CI, and any unattended test run. The mock generates realistic shear-vs-time waveforms without connecting to real hardware.
- **Never** run pump commands against a real Teensy in CI or dev unless you are explicitly bench-testing with cells absent.
- The wet-run gate in `hardware/electronics/README.md` § "Bench Bring-Up Checklist" is mandatory before any microscope run.

## 7. Documentation conventions

- Markdown only. No DOCX, no PDF source.
- **No internal version suffixes** in filenames (`_v2`, `_v3`, `_v4`).
- **Body text is version-neutral.** Current decisions are canonical; do not write "in v4 we changed X."
- The version label `v2.0` appears **only** in `CITATION.cff`, `CHANGELOG.md`, git tags, and the README citation block. Body text everywhere else is version-neutral.
- Canonical viscosity is `μ = 0.9 mPa·s`. Canonical geometry is 24 mm × 50 mm × 0.25 mm. Use these in all examples.
- No doc duplication. If two docs cover the same topic, one consolidates and the other points.

## 8. Workflow

- Plan multi-step work explicitly; track progress as you go.
- Read before writing. Always read the destination file before editing it.
- Confirm before destructive ops (deletes, force-pushes, archive purges).
- Don't create new docs unless they earn their place. The doc map in § 2 is the canonical set; additions need a justification.
- **Edit in place** — never `_old` / `_v2` / `_backup` forks. Git is the version control.

## 9. Repo gotchas

- **Figma-Make pnpm-alias quirk:** if you import a Figma-Make export that uses pnpm aliases like `"version_X@npm:..."`, clean it before `npm install` — npm doesn't understand pnpm's alias syntax. Strip alias declarations from `package.json` before install.
- **Firmware `.venv/` and `.pio/` regenerate.** Don't commit them. `pio run` rebuilds; `python -m venv .venv && pip install -r requirements.txt` rebuilds the Python tooling venv.
- **Vendor STEP files in `hardware/cad/components/` are reference-only.** Do not modify them — they're third-party CAD with their own provenance (file names encode the vendor part number). Modify only your own CAD source in `hardware/cad/source/`.

## 10. Performance budgets (firmware only)

- Main control loop: **≤ 1 ms** (timer-driven; no blocking calls).
- STEP pulse jitter: **≤ 1 µs** (hardware-timer generated, never software-loop generated).
- SD write batch size: **≥ 256 B** (avoid per-sample writes; buffer + flush).
- I²C read latency (SDP810, AS5600): **≤ 5 ms** per read; budget total bus time across all sensors.
- App-side budgets (UI frame rate, IPC latency, plot redraw cost) deferred until profiling shows they matter.

## 11. What this project is NOT

- **Not** a long-term bioreactor (no perfusion-week experiments without separate engineering).
- **Not** a production medical device (no FDA / CE clearance pathway; research-only scope).
- **Not** a chemistry rig (no high-temperature, high-pressure, organic-solvent operation).
- **Not** a microfluidic chip platform — this is a macro-scale parallel-plate chamber for in vitro mechanotransduction at osteocyte-relevant shear levels (0.5–10 Pa, 1–200 mL/min).

Do not drift into these framings even if it would make the chamber "more impressive." The scope is deliberately narrow.

## 12. Citation discipline

- All cited papers use PubMed-resolvable identifiers: prefer DOI; PMID acceptable as backup.
- Inline citation example: `(Lu et al. 2012, Bone, [DOI: 10.1016/j.bone.2012.05.021](https://doi.org/10.1016/j.bone.2012.05.021))`.
- For preprints (bioRxiv / arXiv), label explicitly: `(Smith et al. 2025, bioRxiv preprint, [DOI: ...])`.
- The bio-research MCP plugin (when used) requires this attribution format for any paper retrieved through it.

## 13. Units convention

- **SI throughout**, with these exceptions:
  - Chamber dimensions in **mm** (industry standard for machining drawings).
  - Shear stress in **Pa** (sometimes shown in `dyn/cm²` for parity with bone literature; 1 Pa = 10 dyn/cm²).
  - Microscope working distance in **mm**.
  - Time in **seconds** (SI), but minutes/hours acceptable in protocol prose where natural.
- Do not switch to imperial units anywhere.

## 14. Maintainer workspace context (out of repo)

> The maintainer's local workspace at `D:\flow_chamber\` includes sibling directories not part of the public repo: `planning/` (HANDOFF, triage queue, session log, research brief), `manuscript/` (paper draft), `literature/` (cited papers, lit-survey notes, sota_2026 review), and `archive/flow_chamber_v1/` (parked v1 thesis materials and the Python v0.1 controller app as a parity reference for the v2.0 Electron port). These are intentionally out of repo scope. Public readers cloning the repo will not have them and should not need them — the repo is self-contained for fab + firmware + app + reproduction.

## 15. Parallel agent workflow (maintainer-only)

> Multiple AI agent runs may operate on this project concurrently from the maintainer workspace. Coordinate through three shared-state files at `D:\flow_chamber\planning\`: `HANDOFF.md` (locked decisions), `user_triage_queue.md` (open user-decisions), `session_log.md` (advances / blocks / queued / next-priorities, newest entries on top). At session start, read all three before doing any work. Append findings to the triage queue rather than blocking inline. Edit shared state in place — never `_v2` / `_old` / `_backup` forks. Move resolved triage items to `## Resolved` with date and outcome. End each session with a one-paragraph `session_log.md` entry. This section is for the maintainer's local agent workflow; it does not apply to public users of the repo.
