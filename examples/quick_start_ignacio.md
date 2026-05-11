# Quick Start — Ignacio

This is the operator's-eye-view guide to running the Parametric Flow Chamber on your end. Goal: from box opened to first calcium-imaging run in under an hour.

## What's in the package

- 316L stainless flow chamber (body + cover + clamp), assembled, autoclavable
- Cover-glass support already fitted with the Thorlabs CG15KH1 #1.5H pocket
- Teensy 4.1 controller in its enclosure, USB-C cable
- Kamoer KCS peristaltic pump + 24 V power brick
- Fluidic kit: 1/16″ FEP tubing, IDEX 1/4-28 fittings, two pulsation dampeners (5 mL syringes), two standpipes, hydrophobic 0.22 µm membrane filters (Millex-FG)
- BNC trigger cable (already wired for the LSM 880 user-interface box)
- USB stick with installer + this guide + sample protocols

What you need locally:

- Reservoir bottle (any borosilicate GL45 ≥ 100 mL is fine)
- α-MEM phenol-red-free + 2 % FBS + 2 % CS + 1 % P/S — your normal imaging medium
- MLO-Y4 cells already loaded with Fura Red on a Thorlabs CG15KH1 cover glass per `docs/protocol.md`

## Step 1 — Install the operator app (Windows 11)

1. Plug the USB stick. Run **`flow-chamber-Setup.exe`**.
2. Windows SmartScreen will warn it's an unsigned app — click **More info → Run anyway**. (We didn't sign for the v0; signed builds will land later.)
3. The app installs to `%LocalAppData%\flow-chamber\` and adds a Start-menu shortcut.
4. First launch: a small window opens with **Mock** mode active by default. The synth-style control panel populates with default parameters. This is the dry-run state — no hardware needed.

## Step 2 — Connect the Teensy

1. Plug the Teensy 4.1 controller into a USB-C port on your laptop.
2. Click **Settings** (top-right of the app window).
3. Under **Interface**, pick **Serial (Teensy)**. The connection panel appears.
4. Click **Refresh**. The Teensy will appear as a `COM*` port (Windows) or `/dev/cu.usbmodem*` (macOS). It usually identifies itself as "Teensyduino" or "PJRC".
5. Click **Connect** next to that port. Status bar should turn green and show "connected".

If no port appears: unplug and replug the Teensy, click **Refresh** again. If still nothing, the Teensy may not be enumerated by Windows — check Device Manager for an unrecognized USB device and install the [Teensyduino driver](https://www.pjrc.com/teensy/td_download.html) (only needed once).

## Step 3 — Pick a study folder

Every run is saved to disk as a folder under `<study>/runs/<timestamp>_<label>/`. You need a study folder before you can run.

1. **Settings → Study folder → Open / Create study**.
2. Pick (or create) a folder — recommended: `C:\Users\<you>\Documents\flow_chamber_studies\<your_project>\`.
3. The app writes `study.json` and creates `runs/`, `protocols/`, `_trash/` subfolders. Two starter groups appear in the sidebar.

Status bar shows the current study folder. You can change it later from Settings.

## Step 4 — Calibrate the pump (gravimetric)

The shear-stress dial only works if `steps_per_ml` is correct for your pump tubing. Do this once when you first set up, and again after replacing pump tubing.

1. Set up the pump with water in the loop, off-microscope. Outlet into a tared beaker on a balance.
2. **Settings → Calibration**. Default `steps_per_ml = 6400` is a placeholder.
3. From the main control panel, set **mean = 1.0 Pa**, **waveform = DC**, **duration = 60 s**. Click **RUN**.
4. After ~60 s, weigh the beaker. Convert grams → mL (water at 25 °C: 1 g ≈ 1.003 mL).
5. The app told the firmware to run at `step_rate_hz = mean_pa × steps_per_ml × <channel-math>`. The actual delivered volume divided by the commanded volume (≈ 8.3 mL/min × 1 min for the canonical channel at 0.9 mPa·s) tells you the calibration factor. Update **steps/mL** in Settings → Calibration accordingly.
6. Repeat at 2-3 setpoints to confirm linearity. Aim for ±5 % across the range.

Calibration values persist in app settings — no need to re-enter on next launch.

## Step 5 — Mount the chamber and prime

Per `docs/protocol.md` § "Pre-experiment chamber setup":

1. Autoclave the chamber + tubing + reservoir + standpipes as one assembly.
2. In the hood, transfer the cell-loaded cover glass into the chamber pocket. Lower it straight down — do not slide.
3. Hand-tighten the clamp screws to the steel-to-steel hard stop (do not over-torque; the hard stop sets channel height).
4. Connect inlet/outlet to the loop. Prime at 5 mL/min for 2-5 min, watching for bubbles.
5. Verify SDP810 zero check: pump off → ΔP within ±1 Pa.
6. Mount on the LSM 880 stage in the stage-top incubator. Equilibrate 15-30 min.

## Step 6 — Imaging configuration (LSM 880)

Per the protocol document:

- Objective: 40×/1.2 W (water immersion, 0.28 mm WD)
- Excitation: 458 or 488 nm argon line, low laser power
- Emission: 600-680 nm via GaAsP PMT (Fura Red emission peak ~640 nm)
- Frame rate: **2 Hz** (0.5 s frame interval) for steady protocols, **4 Hz** for oscillatory
- Time series, 12-16 bit, no in-acquisition averaging
- Enable BNC trigger output → routed via the isolated trigger board to the Teensy's `PIN_TRIGGER_IN`
- In analysis, plot **−ΔF/F** (Fura Red intensity *decreases* with bound Ca²⁺)

## Step 7 — Run a Lu 2012 baseline (your first protocol)

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
5. After 360 s the firmware auto-stops. Click anywhere in the status bar's **open run folder** link to inspect the data immediately.

## What's in a run folder

```
<run>/
  metadata.json    operator, sample, started/stopped timestamps, stop reason
  system.json      firmware + app versions, calibration, channel geometry
  protocol.json    the protocol parameters
  telemetry.csv    timestamp_us, run_time_s, state, commanded_shear_pa, commanded_flow_ml_min, commanded_step_rate_hz, temp_reservoir_c, trigger_count, fault_code
  events.csv       timestamp_us, event_type, detail
  notes.md         your free-form notes (edit in any text editor)
```

The CSVs open cleanly in Excel, R, pandas, FIJI's Results table importer.

## Step 8 — Run more protocols

Frequency/amplitude sweeps, oscillatory variants, comparator runs — each one creates its own folder. Group them via the sidebar (right-click a run → Move to Group).

The default presets in your study's `protocols/` directory:
- `Baseline_0.5_Pa.json`
- `1_Pa_Sine_1_Hz.json`
- `2_Pa_Square_1_Hz.json`

> **Note (v0):** the firmware currently only runs DC steady-flow protocols (via `JOG`). Sine / square / triangle waveforms are software-rendered in the app's mock mode but require firmware extension to actually drive the pump. For your first imaging session, stick to DC. We'll ship a firmware update for waveforms in the next iteration.

## Step 9 — Send the data back

After a session:

1. Zip the entire study folder.
2. Upload to the shared drive (URL TBD) or attach to a message.
3. Note any anomalies in `notes.md` inside specific run folders — those text edits are visible to anyone reading the data later.

## Things that will go wrong on day 1

- **Bubble in the channel.** Sharp ΔP transient. Run pump backward briefly at low rate, or disconnect the inlet, flush by hand with a syringe, reconnect.
- **Pump tubing slip.** Re-seat the tubing in the pump head, recalibrate (Step 4).
- **No frames coming through trigger.** Verify the BNC isolated trigger board is wired correctly (not directly grounded to the microscope shield). The "frames in" counter in the SYNC block should increment as the LSM 880 acquires.
- **App freezes during a long run.** Telemetry buffer flushes every second; if the disk path is slow (network drive?), point the study folder somewhere local. Status-bar "open run folder" link works while the run is still active.
- **Windows SmartScreen blocks the install.** Right-click the installer → Properties → check "Unblock" → OK.

## Reach out

Issues, questions, or hardware oddities → message Alex. Include:

- Symptom + screenshot if visual
- The contents of the most recent run's `metadata.json` (so I can see the firmware/app versions and calibration)
- Photos of the chamber + tubing routing if it's a fluidic question

Good luck. Send back the first calcium trace when you have it.
