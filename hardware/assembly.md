# Assembly

> **Status:** Skeleton — to be authored end-to-end during paper-prep with photos at each step. The detailed wet-lab procedure (cell culture, cover-glass coating, dye loading, chamber assembly with cells, equilibration) is in `docs/protocol.md`. The bench bring-up sequence for the controller is in `hardware/electronics/README.md` § "Bench Bring-Up Checklist". This file consolidates the **mechanical assembly** (chamber + tubing + reservoir, pre-cell), gating those wet-lab and electronics flows.

## Stage 0 — receive parts

1. Inspect machined parts (chamber body, cover plate, clamp frame) against drawings in `hardware/drawings/`. Critical dimensions are flagged with `◊` on the vendor PDF.
2. Confirm cover-glass pocket clears the 24 × 50 mm Thorlabs CG15KH1 lot.
3. Confirm sealing-silicone sheet is **medical-grade neutral-cure** (per `hardware/bom.md`). Reject any RTV / acetoxy-cure stock — these byproducts are cytotoxic to MLO-Y4.
4. Inspect cover-glass support lip for burrs. Deburr if needed (jeweler's file, gentle).

## Stage 1 — pre-clean

1. Ultrasonic clean machined parts in fresh deionized water, 5 min.
2. Repeat in 70 % ethanol, 5 min.
3. Air-dry under cleanroom wipe.
4. Autoclave the chamber, cover plate, clamp, fittings, and tubing as one assembly per the chamber's autoclave cycle (typically 121 °C / 15 min / wet, or per local SOP). Do **not** autoclave the SDP810 sensor or any electronics.

## Stage 2 — gasket and channel-height stack

> The channel height is **hard-stop limited** by machined geometry, not torque-limited by screws. Do not over-tighten.

1. Lay the laser-cut silicone gasket onto the chamber lip. Gasket cutout matches the channel footprint; perimeter sits on the steel land.
2. Confirm the gasket is flat — no folds, no debris under it.
3. Drop the cover glass onto the cover-glass pocket. The glass should rest in the pocket without scraping or binding (~0.4 mm clearance per side per `coverglass_spec.md`).
4. Place the cover plate on top. Engage the clamp screws hand-tight, then torque per the spec in `hardware/machining_notes.md` § "Vendor Drawing Critical Callouts" — torque to the hard-stop only, not beyond.

## Stage 3 — fluidic loop

1. Connect the IDEX 1/4-28 luer / flat-bottom fittings to the chamber's inlet and outlet bores.
2. Route 1/16" OD FEP tubing from the chamber inlet → pulsation dampener (upstream) → peristaltic pump → reservoir; from the chamber outlet → pulsation dampener (downstream) → reservoir return.
3. Connect the SDP810 differential-pressure sensor to the standpipe stack (gas-side). Reference the standpipe geometry in `hardware/electronics/README.md` § "Pressure tap and standpipe implementation".
4. Confirm the inline 0.22 µm hydrophobic membrane separators (Millex-FG) are installed between liquid and gas pockets. These are the load-bearing sterile barrier.
5. Connect both standpipes to a thermally-coupled mounting bracket so any temperature drift is common-mode and rejects in the differential measurement.

## Stage 4 — controller wiring

See `hardware/electronics/README.md` § "Bench Bring-Up Checklist" for the bench-validated wiring sequence. Do not connect the BNC trigger to the microscope until the isolated trigger board has been bench-validated for no-continuity between Teensy ground and BNC shield.

## Stage 5 — first wet-loop test (off-microscope)

1. Fill reservoir with phenol-red-free α-MEM (or DI water for the very first leak test).
2. Run pump at low flow (~5 mL/min) for 2–5 min. Watch for bubbles in the chamber, leaks at fittings, and SDP810 zero stability with pump off.
3. Verify dampener attenuation: SDP810 spectrum should show pump-fundamental amplitude reduced ≥ 10× vs dampener-bypass mode.
4. Verify gravimetric flow calibration at 5 setpoints with a balance per `hardware/electronics/README.md` § "Calibration protocol".
5. Visually inspect every fitting, the chamber-to-cover-glass interface, and the catch tray for drips during the 30-minute water-loop test.

Only after Stage 5 passes should you connect the chamber to the microscope. The wet-run gate in the bring-up checklist is mandatory.

## Stage 6 — moving to the microscope

See `docs/protocol.md` § "Pre-experiment chamber setup" for chamber assembly with cells, equilibration, and imaging configuration.

## To be filled in during paper-prep

- Step photos (chamber pre-clean, gasket placement, cover-glass seating, clamp torque, fitting engagement, standpipe priming).
- Specific torque values per the final fastener spec.
- Time estimates per stage (e.g., autoclave 90 min, gasket placement 5 min, fluidic loop 30 min).
- Common assembly failure modes and fixes (gasket folds, glass scraping, leak at port-counterbore).
