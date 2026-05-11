# Flow Chamber Protocol: Cell Culture and Stimulus

This document is the bench protocol for MLO-Y4 calcium-flux experiments in the parallel-plate flow chamber. It covers cell culture, pre-experiment chamber setup, steady-flow stimulus, and oscillatory stimulus.

Related docs: `README.md`, `design_spec_v2.md`, `rapid_direct_design_lock.md`, `chamber_pressure_system.md`, `electronics_controller_architecture.md`, `microscope_i880_constraints.md`.

## Authoritative protocol references

According to PubMed, the closest published match to our experimental setup — MLO-Y4 osteocyte-like cells in a parallel-plate flow chamber with steady and oscillatory shear protocols and calcium imaging — is:

- **Lu, Huo, Park, Guo (2012). Calcium response in osteocytic networks under steady and oscillatory fluid flow.** *Bone* 51(3):466–73. PMID 22750013. PMC3412915. [DOI: 10.1016/j.bone.2012.05.021](https://doi.org/10.1016/j.bone.2012.05.021)

Used as the primary protocol reference for chamber-based calcium imaging timing, dye loading, and stimulus shape. Their methods are followed closely below with adaptations for the canonical chamber geometry, the LSM 880 imaging path, and the SDP810-based shear measurement system.

Supporting references:

- **Lewis et al. (2017). Osteocyte calcium signals encode strain magnitude and loading frequency in vivo.** *PNAS* 114(44):11775–11780. [DOI: 10.1073/pnas.1707863114](https://doi.org/10.1073/pnas.1707863114) — establishes the in vivo strain/frequency response framework that motivates our oscillatory shear protocol.
- **Rath et al. (2010). Correlation of cell strain in single osteocytes with intracellular calcium, but not intracellular nitric oxide, in response to fluid flow.** *J Biomech* 43(8):1560–4. PMID 20189178. [DOI: 10.1016/j.jbiomech.2010.01.030](https://doi.org/10.1016/j.jbiomech.2010.01.030) — Fluo-4 AM in MLO-Y4 with parallel-plate flow at multiple shear levels.
- **Deepak, Kayastha, McNamara (2017). Estrogen deficiency attenuates fluid flow-induced [Ca²⁺] oscillations and mechanoresponsiveness of MLO-Y4 osteocytes.** *FASEB J* 31(7):3027–3039. [DOI: 10.1096/fj.201601280R](https://doi.org/10.1096/fj.201601280R) — oscillatory flow at 1 Pa peak, 0.5 Hz in MLO-Y4.
- **Saffari (2024). Osteocyte Mechanotransduction as a Target for Orthopedic Implant Development.** Cornell honors thesis — the v1 chamber protocol; this document supersedes it for v2.

Information from PubMed in this document is attributed accordingly.

## Operating window

For the locked canonical geometry (channel **24 mm wide × 50 mm long × 0.25 mm high**, matching the full Thorlabs CG15KH1 cover-glass footprint) and α-MEM with serum at 37 °C (μ ≈ 0.9 mPa·s, per Poon et al. range of 0.83–0.95 mPa·s):

| Target shear (Pa) | Required Q (mL/min) | Predicted ΔP across 50 mm taps (Pa) |
|---|---|---|
| 0.5 | ~8.3 | 200 |
| 1.0 | ~16.7 | 400 |
| 1.5 | ~25.0 | 600 |
| 2.0 | ~33.3 | 800 |
| 3.0 | ~50.0 | 1200 |
| 5.0 | ~83.3 | 2000 |

Reynolds number stays well below 100 across this range; flow remains laminar with entry length ≪ 1 mm, so Hagen-Poiseuille applies through almost all of the 50 mm channel.

These flow rates supersede the v1 thesis values (which used a narrow 5 mm wide channel and reported flow-rate-to-shear conversions that appear to be off by ~4× regardless of channel width — the v1 dataset may need shear-axis relabeling if reused).

## Cell culture protocol

### Materials

- MLO-Y4 osteocyte-like cells (gift from Lynda Bonewald lab, U. Missouri-Kansas City; Lu et al. 2012)
- α-Minimum Essential Medium (α-MEM, Invitrogen / ThermoFisher 12571-063), with phenol red for routine culture
- α-MEM, phenol red free (Invitrogen / ThermoFisher 41061-029), for imaging working medium
- Fetal bovine serum (FBS, Hyclone)
- Calf serum (CS, Hyclone)
- Penicillin/streptomycin 100× (P/S)
- Rat tail collagen type I (BD Biosciences / Corning)
- Trypsin/EDTA 0.25 %
- DPBS, calcium- and magnesium-free
- Fura Red, AM ester (ThermoFisher F3021), 5 mM stock in dry DMSO
- Thorlabs CG15KH1 #1.5H cover glass, 24 × 50 × 0.170 mm

### Routine maintenance

1. Thaw MLO-Y4 vial into a rat tail collagen-coated T75 flask with 15 mL **culture medium**: α-MEM with phenol red + 5 % FBS + 5 % CS + 1 % P/S, pre-warmed to 37 °C.
2. Maintain at 37 °C, 5 % CO₂, ≥95 % humidity in a standard tissue-culture incubator.
3. Refresh medium 24 h after seeding, then every 3 days.
4. Subculture before reaching 70 % confluence — MLO-Y4 lose dendritic morphology above 70–80 %, which is a feature of their osteocyte-like phenotype; confluent cultures behave more like osteoblasts. This 70 % rule is followed by both Lu et al. 2012 and the v1 thesis.
5. To passage: aspirate medium, rinse with 5 mL DPBS, add 2 mL Trypsin/EDTA, incubate 3–5 min at 37 °C, neutralize with 5 mL culture medium, transfer to 15 mL conical, centrifuge 1400 RPM for 5 min, resuspend pellet in 1 mL fresh medium, count with hemocytometer or cell counter, dilute and reseed at ~3 × 10⁵ cells per T75.

### Cover glass coating

1. Place sterile Thorlabs CG15KH1 cover glass in a sterile 6-well plate, one slip per well.
2. Apply 100 µg/mL rat tail collagen type I in 0.02 N acetic acid: 500 µL per cover glass.
3. Incubate 1 h at 37 °C.
4. Aspirate collagen solution, rinse 3× with 1 mL sterile DPBS per well.
5. Air-dry briefly in the hood, then keep cover glasses in DPBS until seeding (do not let them dry out completely).

### Seeding for an experiment

1. Lift cells from a T75 at 60–70 % confluence per step 5 of "Routine maintenance" above.
2. Count cells. Adjust suspension to ~5 × 10⁴ cells/mL.
3. Plate 1 mL of suspension onto each collagen-coated cover glass in a 6-well plate (final density ~5 × 10⁴ cells per cover glass, ~2.5 × 10⁴ cells/cm²).
4. Incubate 24–72 h at 37 °C, 5 % CO₂. Cells should be ~30–60 % confluent at imaging — confluent enough to characterize a population but not so dense that dendritic morphology is lost.
5. Verify dendritic morphology under bright-field before proceeding. Cells should show clear processes connecting adjacent cells. If cells are rounded or piled, the culture is unsuitable.

### Calcium dye loading

The v1 thesis and the Lu 2012 protocol used different indicators (Fura Red vs. Fura-2 AM). For v2, use Fura Red because:

- It excites with visible light (458 / 488 / 543 nm), fully compatible with the LSM 880 lasers without UV optics.
- It is single-emission (decrease with bound Ca²⁺), avoiding the dual-PMT requirements of UV ratiometric Fura-2.
- It is what the v1 system has running; continuity with v1 reduces the validation burden.

Fluo-4 AM (intensity increases with Ca²⁺) is an acceptable alternative if a brighter forward-direction signal is preferred. Below is the Fura Red protocol; substitute identical timing for Fluo-4 if used.

1. Prepare loading medium: dilute 5 mM Fura Red AM stock 1:1000 in pre-warmed culture medium → 5 µM working solution. Make fresh; do not refreeze.
2. Aspirate culture medium from each well containing a cell-loaded cover glass.
3. Add 1.5 mL of 5 µM Fura Red working solution per well.
4. Incubate 60 min at 37 °C, 5 % CO₂, in the dark (cover the plate or use a light-tight incubator shelf).
5. Aspirate dye solution. Wash 3× with 1.5 mL pre-warmed DPBS per well.
6. Add 1.5 mL pre-warmed **working medium** per well: phenol red free α-MEM + 2 % FBS + 2 % CS + 1 % P/S. Phenol-red-free is mandatory because phenol red autofluoresces and overlaps Fura Red emission.
7. Incubate an additional 30 min at 37 °C, 5 % CO₂, in the dark, to allow intracellular de-esterification of the AM ester.
8. Cover glasses are now ready for chamber mounting. Do not let them dry; transfer to chamber within ~15 min in working medium.

## Pre-experiment chamber setup

### Sterilization

1. Autoclave the chamber, tubing, reservoir bottle, and (borosilicate) standpipes as one assembly.
2. Connect SDP810 sensor and standpipe vent filters aseptically in a hood post-autoclave.
3. Wipe sensor housings with 70 % ethanol; do not autoclave the SDP810.

### Loop priming

1. Fill reservoir bottle with ~50 mL of pre-warmed phenol red free working medium.
2. Connect reservoir, peristaltic pump, chamber inlet, chamber outlet, and return-to-reservoir tubing.
3. Run pump at low rate (~5 mL/min) for 2–5 min to fill the loop, watching for bubbles.
4. Tap and flick tubing to dislodge bubbles; if persistent, run pump backward briefly.
5. Prime the inline pulsation dampeners (set syringe plunger position to fixed mid-stroke; verify hydrophobic membrane separator is wetted on liquid side and dry on gas side).
6. Prime each standpipe: liquid level at 30 mm from bottom, gas pocket 20 mm above with the inline 0.22 µm hydrophobic membrane separator at the interface, top vent filter seated.
7. With pump off, verify SDP810 reads <±1 Pa (zero check). If offset >5 Pa, re-prime standpipes.
8. Verify dampener attenuation: run pump at 5 mL/min, view SDP810 spectrum, confirm pulsation fundamental amplitude is reduced ≥10× vs. dampener-bypass mode.

### Chamber assembly with cells

1. Pre-warm chamber on the LSM 880 stage in the stage-top incubator at 37 °C, 5 % CO₂ for ≥15 min before assembly.
2. In the hood, transfer the cell-loaded cover glass from its well to the chamber pocket while keeping the cell layer wet with working medium. Do not allow the cells to air-dry at any point.
3. Seat cover glass in the pocket without sliding; lower it straight down to avoid scraping the cell layer.
4. Lower top retainer, hand-tighten fasteners to spec, then torque per `rapid_direct_design_lock.md` channel-height hard-stop sequence. Do not over-torque — channel height is hard-stop limited, not torque limited.
5. Mount chamber on the LSM 880 stage. Connect chamber inlet, outlet, and pressure-tap tubing to the loop.
6. Run pump at very low rate (~1 mL/min, well below the 1.66 mL/min that produces 0.5 Pa shear — equivalent to ~0.3 Pa, 30 % of the experimental low-end threshold). This is "trickle prime" — clears any bubbles from the chamber path without applying meaningful shear.
7. Verify no leaks at any fitting. Verify SDP810 ΔP reads ~100 Pa (consistent with trickle flow at our channel geometry).

### Equilibration before stimulus

1. Reduce pump to 0 (no flow). Lu et al. 2012 use 15 min static equilibration to recover from mechanical disturbance of mounting; Saffari thesis used 60 min in chamber pre-experiment.
2. Verify cells are present in the LSM 880 field of view, focused on the cover glass surface, with characteristic dendritic morphology and baseline Fura Red signal stable.
3. Wait 15–30 min static equilibration. Use this time to set imaging acquisition parameters (see below).

## Imaging configuration (LSM 880)

For Fura Red on the LSM 880:

1. Objective: 40×/1.2 W (water immersion, 0.28 mm WD) for cell-resolution work, or 20×/0.8 dry for population fields. Working medium pre-loaded between the objective and the cover glass for water-immersion imaging.
2. Excitation: 458 nm or 488 nm argon laser line. Lower laser power preferred to minimize photobleaching over the multi-minute acquisition.
3. Emission: collect 600–680 nm via GaAsP PMT (Fura Red emission peaks ~640 nm).
4. Frame rate: 1–4 Hz (0.25–1.0 s frame interval). Lu et al. 2012 used 1 Hz; v1 thesis used 0.501 s intervals (~2 Hz). For the v2 build, 2 Hz is the target — fast enough to resolve the 0.5–1 Hz oscillatory stimulus harmonics, slow enough to limit photobleaching over 10 min runs.
5. Field of view sized to capture 30–80 cells in one frame at the chosen objective.
6. Acquisition mode: time series, 12-bit or 16-bit, no averaging during acquisition (averaging happens in post).
7. Inverse-intensity convention: Fura Red fluorescence decreases with bound Ca²⁺. In analysis, plot –ΔF/F so increases in plotted signal correspond to increases in [Ca²⁺]. v1 thesis used this convention.
8. Frame trigger output: enable the LSM 880 BNC trigger so each frame produces a TTL pulse routed via the isolated trigger board to Teensy pin 6 (per `chamber_pressure_system.md`). This is the time alignment between calcium frames and ΔP samples.

## Steady-flow stimulus protocol

Adapted from Lu et al. 2012. Their "1 minute baseline + 9 minutes flow" structure is preserved. Their 2 Pa peak shear is the default; 0.5, 1, and 3 Pa setpoints are also routine.

1. Confirm 15–30 min static equilibration is complete and cells show stable baseline Fura Red signal.
2. Configure LSM 880 acquisition: time series, 2 Hz frame rate, 600 frames total (5 min total acquisition).
3. Enable Teensy data logging per `chamber_pressure_system.md` log columns. Confirm SDP810, encoder, and frame-marker channels are all writing.
4. Set target shear in the controller GUI: e.g., 1.0 Pa for the standard low-shear protocol, 2.0 Pa for the Lu et al. 2012 reference, 3.0 Pa for a higher-shear comparator.
5. **t = 0 to 60 s: baseline.** Pump off. Record cells at rest. Note: in protocols that use a non-zero pre-flow for cell health, this is a "low pre-flow" baseline at the trickle-prime rate (~0.3 Pa); for an absolute-rest baseline, pump is fully off.
6. **t = 60 s: stimulus onset.** Controller commands pump to ramp from 0 to target shear over <0.5 s (effectively a step, given dampener time constants). Closed-loop PID on SDP810 ΔP holds shear at setpoint within ±3 %.
7. **t = 60 to 360 s: stimulus on.** Hold target shear for 5 minutes (300 s). Lu et al. 2012 used 9 min; reduce to 5 min for v2 unless biology requires longer to limit photobleaching. Frame trigger and ΔP sample stream both running continuously.
8. **t = 360 s: stimulus off.** Controller commands pump back to 0 (or to trickle-prime rate).
9. **t = 360 s onward: recovery.** Continue acquisition for 60–120 s post-stimulus to capture decay and recovery dynamics.
10. End acquisition. Save TIFF/CZI from LSM 880 metadata; save Teensy CSV log; verify both are time-aligned via frame markers.

Variants:

- Sub-Pa exploratory: target 0.5 Pa for low-end of MLO-Y4 response curve.
- Mid-range standard: 1.0 Pa per Deepak et al. 2017 oscillatory matched-amplitude.
- Reference comparison: 2.0 Pa per Lu et al. 2012.
- High-end comparator: 3.0 Pa (close to v1 thesis "high" setpoint, after recalculation).
- Step-function dose response: run 0.5, 1, 2, 3 Pa back-to-back with 2 min recovery between. Document order — randomize across sessions to control for bleaching and rundown.

## Oscillatory stimulus protocol

Sinusoidal shear waveform at 0.5–2 Hz to match the Lewis et al. 2017 in vivo loading frequency framework and the Deepak et al. 2017 in vitro protocol.

1. Confirm static equilibration is complete and Fura Red baseline is stable.
2. Configure LSM 880 acquisition: time series, 4 Hz frame rate (250 ms interval) — twice the highest oscillation frequency of 2 Hz, satisfying Nyquist with margin. 1200 frames for 5 min total.
3. Enable Teensy data logging. Confirm AS5600 encoder phase is being recorded for phase-locked analysis.
4. Set oscillatory parameters in controller GUI:
   - Mean shear: 1.0 Pa (mid-range bias to keep flow strictly forward; the peristaltic pump should not reverse).
   - Peak shear: 2.0 Pa (Lu 2012 standard) or 1.0 Pa above mean (Deepak 2017 1 Pa amplitude).
   - Trough shear: 0.0 Pa (bias-mean − amplitude). Pump goes to zero but does not reverse.
   - Frequency: 0.5 Hz (Lewis low end) / 1 Hz (Lewis mid; Deepak standard) / 2 Hz (Lewis high end).
   - Waveform: sine.
5. **t = 0 to 60 s: baseline.** Pump at trickle-prime rate (~0.3 Pa shear) or fully off. Acquire baseline frames and SDP810 ΔP samples.
6. **t = 60 s: stimulus onset.** Controller initiates sinusoidal modulation: τ(t) = mean + amplitude · sin(2π · f · (t − 60)). PID holds the waveform tracking against the SDP810 ΔP feedback, accepting that response time of the closed loop limits achievable amplitude tracking above ~5 Hz. At our target frequencies (0.5–2 Hz), tracking should be tight.
7. **t = 60 to 360 s: stimulus on.** 5 min of sinusoidal stimulus. ~150–600 oscillation cycles depending on frequency. Lu et al. 2012 used 9 min at 1 Hz; we shorten to 5 min for v2 to limit photobleaching.
8. **t = 360 s: stimulus off.** Controller returns to baseline.
9. **t = 360 s onward: recovery.** Continue acquisition for 60–120 s.
10. End acquisition. Verify SDP810 ΔP log shows the expected sinusoid with mean and peak matching commanded values.

Variants:

- Frequency sweep: run 0.5, 1.0, 2.0 Hz in sequence with 2 min recovery between, holding amplitude constant at 1 Pa. This directly tests the Lewis 2017 frequency-tuning hypothesis on osteocyte recruitment.
- Amplitude sweep: hold frequency at 1 Hz, vary amplitude 0.25, 0.5, 1.0 Pa.
- Pulsation-as-covariate analysis: with 4 Hz frame rate and SDP810 logging at >100 Hz, post-process the relationship between intrinsic peristaltic pulsation harmonics (logged from `pulsation_fundamental_amplitude_pa`) and calcium event timing. This is the novel methods-paper claim from `chamber_pressure_system.md`.

## Data analysis approach (post-acquisition)

Outline only; full analysis pipeline in `flow_chamber_app/`.

1. Load LSM 880 TIFF/CZI and Teensy CSV.
2. Time-align via frame markers. Verify <1 ms residual offset.
3. ROI segmentation per cell. Manual or automated; manual is standard in the bone literature.
4. Per-cell Fura Red intensity time series. Convert to –ΔF/F₀ where F₀ is the per-cell baseline mean.
5. Spike detection per Lu et al. 2012: a cell is responsive if its peak –ΔF/F₀ during stimulus exceeds 4× the standard deviation of its baseline fluctuation.
6. Spatiotemporal metrics per responsive cell:
   - Number of Ca²⁺ peaks during stimulus
   - Magnitude of first peak
   - Latency from stimulus onset to first peak
   - Inter-peak interval distribution
   - AUC under stimulus
   - Decay τ post-stimulus
7. Population metrics per experiment:
   - Responsive cell fraction (Lu 2012 metric)
   - Recruitment as a function of shear magnitude (Lewis 2017 framework)
   - Cross-experiment averages with biological replicates
8. Cross-channel sanity:
   - Confirm SDP810 ΔP held setpoint within ±3 %
   - Confirm twin_quality_ratio stayed in [0.95, 1.05]
   - Confirm bubble_likely flag did not fire during the analysis window (or exclude windows where it did)
   - Confirm calibration certificate from current experimental campaign is in metadata

## Critical references for the methods paper

According to PubMed:

- **Lu, Huo, Park, Guo (2012)** Bone — primary protocol parent. [DOI: 10.1016/j.bone.2012.05.021](https://doi.org/10.1016/j.bone.2012.05.021)
- **Lewis et al. (2017)** PNAS — in vivo loading framework. [DOI: 10.1073/pnas.1707863114](https://doi.org/10.1073/pnas.1707863114)
- **Rath et al. (2010)** J Biomech — single-cell strain–calcium correlation in MLO-Y4 with Fluo-4. [DOI: 10.1016/j.jbiomech.2010.01.030](https://doi.org/10.1016/j.jbiomech.2010.01.030)
- **Deepak, Kayastha, McNamara (2017)** FASEB J — oscillatory flow at 1 Pa, 0.5 Hz in MLO-Y4. [DOI: 10.1096/fj.201601280R](https://doi.org/10.1096/fj.201601280R)
- **Yan et al. (2018)** Cell Biol Int — 1 Pa, 2 h FSS effects on MLO-Y4 morphology and gene expression. [DOI: 10.1002/cbin.11032](https://doi.org/10.1002/cbin.11032)
- **Shah et al. (2017)** J Orthop Res — MLO-Y4 response to FSS in metal-ion contexts; relevant for the titanium-topology arm of this chamber. [DOI: 10.1002/jor.23449](https://doi.org/10.1002/jor.23449)
- **Middleton et al. (2018)** J Orthop Res — Reynolds-number dependence of osteocyte response in MLO-Y4 microfluidics. [DOI: 10.1002/jor.23773](https://doi.org/10.1002/jor.23773)

## Open questions / decisions for v2

- **Indicator choice**: Fura Red (v1 continuity) vs. Fluo-4 (simpler increase-with-Ca²⁺ readout). Fura Red recommended for direct comparison with v1 thesis data; Fluo-4 acceptable if v1 reproducibility is not a constraint.
- **Pre-flow during baseline**: zero (true rest, per the calcium-onset framing) vs. trickle (~0.3 Pa, prevents hypoxia and aligns with cell health). Recommended: zero for the headline calcium-onset experiment, with a separate validation experiment under trickle baseline to characterize any pre-flow conditioning effect.
- **Imaging duration**: 5 min (this protocol) vs. 9 min (Lu et al. 2012) vs. 3 min (v1 thesis). 5 min is the v2 default, balancing photobleaching against capturing sustained calcium dynamics; revisit if first-experiment data shows responses persist past 5 min.
- **Cell density at imaging**: 30–60 % confluent. v1 thesis ran at lower density per coverslip; Lu 2012 used micro-patterned networks (specific spacing). For v2, lock 30–60 % density unless adopting the micro-patterning approach as a separate methods extension.
- **Closed-loop sinusoidal tracking bandwidth**: the SDP810 supports 0.5 ms response, but the dampener time constant + PID tuning sets practical tracking. Verify amplitude attenuation at 0.5/1/2 Hz during bring-up step 19 of `electronics_bringup_checklist.md`.
- **Recovery duration post-stimulus**: 60 s vs. 120 s. 60 s is sufficient for first-peak and decay-τ measurements; 120 s for full network re-equilibration. Default 60 s, optional extended-recovery variant for network-dynamics experiments.
