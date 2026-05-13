# Quick Start

Operator's-eye-view guide to running an assembled Parametric Flow Chamber. Goal: from box opened to first calcium-imaging run in well under an hour.

This document assumes the recipient has the chamber + controller already assembled, with firmware flashed and validated on the bench. For chamber fabrication and electronics bring-up, see `hardware/assembly.md` and `hardware/electronics/README.md`.

## What ships with the chamber

- 316L stainless flow chamber (body + cover + clamp), assembled, autoclavable
- Cover-glass support already fitted with the Thorlabs CG15KH1 #1.5H pocket
- Teensy 4.1 controller in its enclosure, USB-C cable
- Kamoer KCS peristaltic pump + 24 V power brick
- Fluidic kit: 1/16″ FEP tubing, IDEX 1/4-28 fittings, two pulsation dampeners (5 mL syringes + Millex-FG separators)
- BNC trigger cable (wired for the Zeiss LSM 880 user-interface box)
- USB stick with the operator-app installer + this guide + sample protocols

The inline Sensirion SLF3S-1300F flow sensor lives in the controller body and is wired to the Teensy at the factory — no operator setup required.

What the receiving lab provides:

- Reservoir bottle (any borosilicate GL45 ≥ 100 mL is fine)
- α-MEM phenol-red-free + 2 % FBS + 2 % CS + 1 % P/S (or equivalent imaging medium)
- MLO-Y4 cells already loaded with Fura Red on a Thorlabs CG15KH1 cover glass per `docs/protocol.md`

## Step 1 — Install the operator app (Windows 11)

1. Plug the USB stick. Run **`flow-chamber-Setup.exe`**.
2. Windows SmartScreen will warn it is an unsigned app — click **More info → Run anyway**. Signed builds will land in a later release.
3. The app installs to `%LocalAppData%\flow-chamber\` and adds a Start-menu shortcut.
4. First launch: a small window opens with **Mock** mode active by default. The synth-style control panel populates with default parameters. This is the dry-run state — no hardware needed.

macOS builds are also published as a signed `.dmg` artifact on each tagged release; the workflow is otherwise identical.

## Step 2 — Connect the Teensy

1. Plug the Teensy 4.1 controller into a USB-C port on the operator laptop.
2. Click **Settings** (top-right of the app window).
3. Under **Interface**, pick **Serial (Teensy)**. The connection panel appears.
4. Click **Refresh**. The Teensy appears as a `COM*` port on Windows or `/dev/cu.usbmodem*` on macOS. It usually identifies itself as "Teensyduino" or "PJRC".
5. Click **Connect** next to that port. The status bar should turn green and show "connected".

If no port appears: unplug and replug the Teensy, click **Refresh** again. If still nothing, the Teensy may not be enumerated by the OS — check Device Manager (Windows) or `system_profiler SPUSBDataType` (macOS) for an unrecognized USB device and install the [Teensyduino driver](https://www.pjrc.com/teensy/td_download.html) if needed (one-time setup).

## Step 3 — Pick a study folder

Every run is saved to disk as a folder under `<study>/runs/<timestamp>_<label>/`. A study folder must be selected before a run can be started.

1. **Settings → Study folder → Open / Create study**.
2. Pick (or create) a folder — for example `~/Documents/flow_chamber_studies/<project_name>/`.
3. The app writes `study.json` and creates `runs/`, `protocols/`, `_trash/` subfolders. Two starter groups appear in the sidebar.

The status bar shows the current study folder. It can be changed later from Settings.

## Step 4 — Calibrate the pump (gravimetric)

The shear-stress dial only works if the controller's `steps_per_ml` constant matches the installed pump tubing. Do this once when first setting up the chamber, and again after replacing pump tubing.

1. Set up the pump with water in the loop, off-microscope. Outlet into a tared beaker on a balance.
2. **Settings → Calibration**. The default `steps_per_ml = 6400` is a placeholder.
3. From the main control panel, set **mean = 1.0 Pa**, **waveform = DC**, **duration = 60 s**. Click **RUN**.
4. After ~60 s, weigh the beaker. Convert grams → mL (water at 25 °C: 1 g ≈ 1.003 mL).
5. The controller commanded `step_rate_hz = mean_pa × steps_per_ml × <channel-math>`. The actual delivered volume divided by the commanded volume (≈ 16.7 mL/min × 1 min for the canonical channel at 0.9 mPa·s and 1 Pa shear) gives the calibration factor. Update **steps/mL** in Settings → Calibration accordingly.
6. Repeat at two or three setpoints to confirm linearity. Aim for ±5 % across the range.

The SLF3S inline reading should agree with the gravimetric value within ±5 %. If it does not, the SLF3S zero may be drifting — re-run the cleaning protocol's final sterile-rinse phase (`docs/cleaning_protocol.md` § "Pre-experiment prime") before continuing.

Calibration values persist in app settings — no need to re-enter on the next launch.

## Step 5 — Mount the chamber and prime

Per `docs/protocol.md` § "Pre-experiment chamber setup":

1. Autoclave the chamber, IDEX fittings, and FEP tubing as one assembly. **Do not autoclave the controller or the SLF3S** — its wetted path is cleaned-in-place per `docs/cleaning_protocol.md`.
2. In the hood, transfer the cell-loaded cover glass into the chamber pocket. Lower it straight down — do not slide.
3. Hand-tighten the clamp screws to the steel-to-steel hard stop (do not over-torque; the hard stop sets channel height).
4. Aseptically reconnect the chamber to the controller-side loop (pump → SLF3S → dampener → chamber → return).
5. Prime at 5 mL/min for 2–5 min, watching for bubbles at the SLF3S inlet. Persistent bubbles can damage the sensor — briefly increase to 100 mL/min for 30 s to clear them.
6. SLF3S zero-point verification: with pump off, the sensor should drift to within ±0.05 mL/min of zero after a 30 s settle.
7. Mount on the LSM 880 stage in the stage-top incubator. Equilibrate 15–30 min.

## Step 6 — Imaging configuration (LSM 880)

Per the protocol document:

- Objective: 40×/1.2 W (water immersion, 0.28 mm WD)
- Excitation: 458 or 488 nm argon line, low laser power
- Emission: 600–680 nm via GaAsP PMT (Fura Red emission peak ~640 nm)
- Frame rate: **2 Hz** (0.5 s frame interval) for steady protocols, **4 Hz** for oscillatory
- Time series, 12–16 bit, no in-acquisition averaging
- Enable BNC trigger output → routed via the isolated trigger board to the Teensy's `PIN_TRIGGER_IN`
- In analysis, plot **−ΔF/F** (Fura Red intensity *decreases* with bound Ca²⁺)

## Step 7 — Run a Lu 2012 baseline (first protocol)

1. In the main control panel, dial:
   - **Mean shear**: 2.0 Pa (Lu et al. 2012 reference)
   - **Amplitude**: 0 Pa
   - **Frequency**: 0 Hz (irrelevant for DC)
   - **Waveform**: DC
   - **Duration**: 360 s
   - **Ramp in**: 0 s (step onset)
   - **Ramp out**: 0 s
2. Optional: in the SYNC block, click **Trigger** to fire one BNC pulse — verify the LSM 880 recognizes it before the run.
3. Click **RUN**. The app:
   - Creates `<study>/runs/<timestamp>_shear-2.00-Pa/` with `metadata.json`, `system.json`, `protocol.json`, an empty `telemetry.csv`, an empty `events.csv`.
   - Sends `JOG <step_rate_hz> 360000` to the firmware.
   - Polls firmware STATUS at 10 Hz and appends one row to `telemetry.csv` per poll.
4. Cells should respond within seconds. Watch the DISPLAY block readouts for τ, Q, and the frame counter.
5. After 360 s the firmware auto-stops. Click the status bar's **open run folder** link to inspect the data immediately.

## What's in a run folder

```
<run>/
  metadata.json    operator, sample, started/stopped timestamps, stop reason
  system.json      firmware + app versions, calibration, channel geometry
  protocol.json    the protocol parameters
  telemetry.csv    timestamp_us, run_time_s, state, commanded_shear_pa, commanded_flow_ml_min, measured_flow_ml_min, measured_temperature_c, commanded_step_rate_hz, trigger_count, fault_code
  events.csv       timestamp_us, event_type, detail
  notes.md         free-form notes (edit in any text editor)
```

The CSVs open cleanly in Excel, R, pandas, or FIJI's Results-table importer.

## Step 8 — Run more protocols

Frequency / amplitude sweeps, oscillatory variants, comparator runs — each one creates its own folder. Group them via the sidebar (right-click a run → Move to Group).

The default presets in the study's `protocols/` directory:
- `Baseline_0.5_Pa.json`
- `1_Pa_Sine_1_Hz.json`
- `2_Pa_Square_1_Hz.json`

> **Note (v0):** the firmware currently only runs DC steady-flow protocols (via `JOG`). Sine / square / triangle waveforms are software-rendered in the app's mock mode but require firmware extension to actually drive the pump. For first imaging sessions, stick to DC. A firmware update for waveforms will land in a follow-up release.

## Step 9 — Clean between experiments

End-of-run cleaning of the controller-side flow loop runs through the same pump that drives experiments — about 45 minutes wall time per the standard CIP cycle in `docs/cleaning_protocol.md`. The cycle is:

1. Drain residual media to waste.
2. DI-water flush.
3. 1 % Tergazyme enzymatic detergent recirculation.
4. DI-water rinses (×2).
5. 70 % IPA disinfection.
6. Final sterile DI-water rinse.
7. Storage fill (sterile water for short idle, 70 % IPA for longer).

The chamber itself is broken out of the loop, autoclaved separately, and reassembled before the next experiment. The SLF3S in the controller stays put and gets cleaned in place — never autoclaved.

## Things that will go wrong on day 1

- **Bubble in the channel.** Sharp ΔP transient and/or SLF3S bubble-detect flag. Run pump backward briefly at low rate (never run the pump dry), or disconnect the inlet, flush by hand with a syringe, reconnect.
- **Pump tubing slip.** Re-seat the tubing in the pump head and recalibrate (Step 4).
- **No frames coming through trigger.** Verify the BNC isolated trigger board is wired correctly (not directly grounded to the microscope shield). The "frames in" counter in the SYNC block should increment as the LSM 880 acquires.
- **App freezes during a long run.** Telemetry buffer flushes every second; if the disk path is slow (network drive?), point the study folder somewhere local. The status-bar "open run folder" link works while the run is still active.
- **Windows SmartScreen blocks the install.** Right-click the installer → Properties → check "Unblock" → OK.
- **SLF3S zero drift after a clean cycle.** Repeat the final sterile-water rinse of the CIP cycle — residual chemical in the channel is the most likely cause.

## Reach out

Issues, questions, or hardware oddities → open a GitHub issue against the repository, or contact the maintainers listed in `CITATION.cff`. Useful information to include:

- Symptom + screenshot if visual
- The contents of the most recent run's `metadata.json` (firmware / app versions, calibration values)
- Photos of the chamber + tubing routing if the question is fluidic
