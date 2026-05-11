# Machining notes — consolidated

> Merged from `cad_parameter_lock_v2.md`, `flow-chamber-machining-notes.md`, `rapid_direct_design_lock.md`, and `CAD/fusion/README.md` from the dev archive. Section dividers (`---`) preserve source boundaries; heading levels in source sections have been demoted by one level so the merged doc has a single H1 title.

> **Geometry note:** several source sections were authored against an earlier 5 mm × 0.250 mm × 45 mm narrow-channel geometry with μ = 7.2e-4 Pa·s. The canonical geometry per `planning/HANDOFF.md` is now **24 mm × 50 mm × 0.25 mm** with **μ = 0.9 mPa·s** at 37 °C — channel matches the full Thorlabs CG15KH1 cover-glass footprint. The "CAD Parameter Lock V2" and "Flow Reference" tables below have been updated to the canonical geometry; older narrative paragraphs in the "Flow Chamber — Machining Reference Notes" and "RapidDirect Design Lock" sections may still reference the narrow channel. Trust the locked-parameter table.

> **Cross-references:** Source sections reference `design_spec_v2.md` (now split into `docs/theory.md` + `docs/architecture.md`), `electronics_controller_architecture.md` and `electronics_bringup_checklist.md` (now consolidated in `hardware/electronics/README.md`), and `chamber_pressure_system.md` (also in `hardware/electronics/README.md`). Cross-references in body text below have **not** been updated.

---

## CAD Parameter Lock V2

Use this as the parameter source for the fresh CAD model. Do not bury these values only in sketches or feature names.

### Locked Inputs

| Parameter | Value | Status | Notes |
|---|---:|---|---|
| Microscope | Zeiss LSM 880 inverted | locked | Design for inverted imaging through cover glass |
| Reference objective | 40x/1.2 water | locked | 0.28 mm working distance; most important clearance constraint |
| Setup objective | 20x/0.5 air | locked | 2.0 mm working distance; useful for first validation |
| Holder/objective reference STEP | `CAD/flow_chamber_components/scope_holder.stp` | locked reference | Caliper-derived current holder/objective model |
| Reference objective/nose envelope | 18.8629 mm diameter x 45.0877 mm tall | measured reference | From STEP solid 0 bounding box |
| Reference holder plate envelope | 175.0652 x 105.1809 x 5.0000 mm | measured reference | From STEP solid 1 bounding box |
| Industrial design reference | `design_language_tx6.md` | locked reference | TX-6-inspired precision-instrument language; function and sterility override aesthetics |
| Cover glass reference part | Thorlabs CG15KH1 | locked | Procurement reference, not confirmed in hand |
| Cover glass material | Schott D263 M | locked | From drawing `TTN140107-E0W` |
| Cover glass nominal length | 50.0 mm | locked | Dimensional tolerance +/- 0.2 mm |
| Cover glass nominal width | 24.0 mm | locked | Current CAD must be corrected if using 22.65 mm placeholder |
| Cover glass nominal thickness | 0.170 mm | locked | Thickness tolerance +/- 0.005 mm |
| Cover glass pocket length | 50.8 mm | prototype lock | Allows sterile drop-in with cell-covered glass; update after measuring actual lot |
| Cover glass pocket width | 24.8 mm | prototype lock | Allows sterile drop-in with cell-covered glass; update after measuring actual lot |
| Cover glass pocket corner radius | 0.5 mm | prototype lock | Cleaner than dogbone relief; pocket clearance accounts for sharp glass corners |
| Cover glass refractive index | 1.523 at 589.3 nm | reference | From Thorlabs drawing |
| Chamber body material | 316L stainless steel | locked | Electropolish/passivate wetted surfaces |
| Default cell substrate | collagen type I-coated cover glass | locked | Default general assay |
| Chamber port standard | Luer socket | prototype lock | Keeps chamber modular; supports plugs, pump adapters, and culture vent adapters |
| Chamber tubing | McMaster `2129T11` or equivalent 1/16 inch OD FEP/PTFE | preferred | Low-dead-volume inlet/outlet after luer adapter |
| Channel width | 24.0 mm | locked | Matches full cover-glass width |
| Channel length | 50.0 mm | locked | Matches full cover-glass length |
| Channel height | 0.25 mm | locked | Hard-stop controlled |
| Target shear range | 0.5-5.0 Pa | preferred | 8.33-83.33 mL/min for 24 × 50 × 0.25 mm channel at μ = 0.9 mPa·s |

### Dimensions To Measure Before Final CAD

| Item | Needed measurement | Why it matters |
|---|---|---|
| Actual cover glass lot after purchase | length, width, thickness range | Confirms pocket clearance and glass support geometry |
| Objective lower clearance | available stage/objective envelope if facility can confirm | Prevents steel/fastener collision |
| Fitting hardware | luer socket/plug engagement, adapter clearance, tubing route | Prevents inaccessible ports and side-loading |
| Gasket/O-ring stock | actual thickness or cord diameter, durometer | Sets seal groove and hard-stop stack |
| Pump tubing/head | exact tubing size and pump head spec | Sets flow calibration and pulsation expectations |
| Stage insert | opening size, clips, travel limits | Sets chamber footprint and mounting envelope |

### Clearance Margins

| Clearance | Minimum target | Notes |
|---|---:|---|
| Radial clearance around measured objective/nose envelope | 2.0 mm | Increase if geometry allows |
| Clearance around fittings/screw heads near objective access zone | 5.0 mm | Avoid hand/tool/objective conflicts |
| Steel/gasket below glass in active imaging window | 0 mm allowed | Imaging window should expose cover glass directly |

### Open Decisions

| Decision | Recommended default | Consequence |
|---|---|---|
| Titanium imaging geometry | titanium-modified transparent glass floor | Best fit for inverted high-NA live calcium imaging |
| Seal architecture | piston/radial seal between top and bottom plates plus steel-to-steel hard stop | O-ring seals pressure; machined steel stack controls repeatable channel height |
| Clamp fastener family | M3 or M4 | Must clear stage/objective and avoid glass point loading |
| Temperature sensing | reservoir/inlet/ambient only | Avoids bulky chamber sensor ports |
| Trigger I/O | confirm with i880 facility | Do not finalize electrical interface on assumptions |

### Flow Reference

For canonical media `μ = 0.9 mPa·s` (α-MEM with serum at 37 °C), `w = 24 mm`, `h = 0.25 mm`:

| Shear stress | Flow rate |
|---:|---:|
| 0.5 Pa | 8.33 mL/min |
| 1.0 Pa | 16.67 mL/min |
| 1.5 Pa | 25.00 mL/min |
| 2.0 Pa | 33.33 mL/min |
| 3.0 Pa | 50.00 mL/min |
| 5.0 Pa | 83.33 mL/min |

### Vendor Drawing Critical Callouts

- Channel height and floor flatness.
- Cover glass pocket length/width/depth.
- Objective-side window and clearance envelope.
- Seal groove or gasket seat geometry.
- Hard-stop compression surfaces.
- Port thread, counterbore, through-bore, and transition.
- Luer bore to channel end-manifold transition.
- Surface finish on wetted/sealing surfaces.
- Deburr/clean/passivate/electropolish notes.
- Do not break sharp sealing lips unless specifically called out.

### Naming

Recommended fresh CAD file names:

- `flow_chamber_v2_reference.3dm` or native CAD equivalent
- `flow_chamber_v2_body.step`
- `flow_chamber_v2_clamp.step`
- `flow_chamber_v2_retainer.step`
- `flow_chamber_v2_gasket.dxf`
- `flow_chamber_v2_rapiddirect_drawings.pdf`

---

## Flow Chamber — Machining Reference Notes

> Current status note: this file is a machining reference, not the current design lock. Some assumptions conflict with the latest inventory and microscope constraints, especially cover glass size, channel width, and seal architecture. Before ordering steel, use `design_spec_v2.md` and `rapid_direct_design_lock.md` as the authoritative source.

MLO-Y4 fluid shear stress chamber, stainless steel + coverslip ceiling design. Reference doc for generating technical drawings and submitting to Xometry or RapidDirect.

---

### Design Summary

Parallel-plate flow chamber for MLO-Y4 osteocyte calcium imaging on LSM 880. Cells cultured on coverslip, inverted so coverslip forms the channel ceiling. Flow driven by Kamoer KCS peristaltic pump through IDEX Super Flangeless fittings and 1/16" OD × 0.030" ID FEP tubing.

#### Target Operating Conditions
- Working fluid: α-MEM with serum at 37 °C (μ ≈ 0.9 mPa·s, per Poon et al. range of 0.83–0.95 mPa·s)
- Flow rate range: 8–85 mL/min (covers 0.5–5 Pa wall shear stress)
- Canonical operating point: **16.7 mL/min → 1.0 Pa (10 dyn/cm²)**
- Reynolds number at operating point: ~25 (fully laminar)
- Backpressure at operating point: ~400 Pa across the 50 mm channel
- Max pump back-pressure capability: ~1.5 bar (substantial margin)

---

### Channel Geometry

| Parameter | Value | Rationale |
|---|---|---|
| Channel height | 0.25 mm | Set by hard-stop machined geometry (lip step + cover glass) |
| Channel width | 24 mm | Matches full Thorlabs CG15KH1 cover-glass width; central 16 mm has shear within 5% of calculated value |
| Active channel length (under coverslip) | 50 mm | Matches full Thorlabs CG15KH1 cover-glass length |
| Entrance length (inlet transition → imaging region) | <1 mm analytical at canonical Re; whole channel is fully developed |
| Imaging region | central 3 mm wide × any axial location | Sized to LSM 880 40× field of view |
| Outlet converging region | n/a | Channel matches cover-glass footprint; luer manifolds at each end |
| Inlet diverging transition | n/a | Luer-bore-to-channel manifold (see `docs/architecture.md` § "Port standard") |

#### Shear Stress Reference (τ = 6μQ/wh²) at μ = 0.9 mPa·s, w = 24 mm, h = 0.25 mm

| τ (Pa) | τ (dyn/cm²) | Q (mL/min) | Re |
|---|---|---|---|
| 0.5 | 5 | 8.33 | ~12 |
| 1.0 | 10 | 16.67 | ~25 |
| 2.0 | 20 | 33.33 | ~50 |
| 3.0 | 30 | 50.00 | ~75 |
| 5.0 | 50 | 83.33 | ~125 |

---

### Material & Finish

#### Material
- **316 stainless steel**
- 316 (not 304) for superior corrosion resistance and biocompatibility
- Sheet or bar stock depending on chamber body thickness (likely ~15–20 mm thick)

#### Surface Treatment
- **Electropolish all interior surfaces** per ASTM B912, target Ra ≤ 0.4 μm (16 μin)
- **Passivate per ASTM A967**, Citric 3 method (or Nitric 2)
- Removes free iron, reduces protein fouling, improves cleanability

#### Surface Finish Callouts
| Surface | Finish |
|---|---|
| Lip top (gasket seal face) | Ra 0.4 μm (16 μin) **critical** |
| Channel floor | Ra 0.8 μm (32 μin) — electropolish improves to ~0.4 |
| Port flat-bottom counterbore | Ra 0.4 μm (16 μin) **critical** |
| External surfaces | Ra 1.6 μm (63 μin), standard |
| Transition regions | Ra 0.8 μm (32 μin) |

---

### Critical Dimensions (Flag with ◊ on Drawing)

These drive the shear stress calculation and sealing performance. 100% inspection required.

| Dimension | Value | Tolerance | Notes |
|---|---|---|---|
| **Lip-top to chamber-floor step** | 0.100 mm | ±0.005 mm | Defines channel height (with gasket) |
| **Lip top flatness** | — | 0.005 mm across perimeter | Any tilt → wedge-shaped channel |
| **Chamber floor parallelism to lip top** | — | 0.010 mm | Uniform channel height |
| **Port counterbore perpendicularity** | — | 0.010 mm to thread axis | IDEX ferrule seal integrity |

#### Why the Step Height is the Critical Dimension
Channel height = (floor depth below lip) + (compressed gasket thickness)
= F + G_c

For target 250 μm channel with 250 μm uncompressed gasket at 40% compression (G_c = 150 μm):
- F = 100 μm (machined)
- G_c = 150 μm (defined by gasket thickness and lip height controlling compression)

Controlling one machined dimension (the step) is easier than controlling two surfaces independently.

---

### Port Specifications

#### 1/4-28 UNF Flat-Bottom Ports (IDEX Standard)
Per IDEX/Upchurch convention for Super Flangeless fittings.

| Feature | Dimension | Tolerance |
|---|---|---|
| Thread | 1/4-28 UNF-2B | Per ASME B1.1 |
| Thread depth (min) | 6.0 mm (0.25") | — |
| Pilot hole diameter (for tap) | 5.5 mm | +0.05 / -0.00 |
| Pilot hole depth | 8.0 mm min | — |
| **Flat-bottom counterbore diameter** | 3.2 mm | ±0.05 mm |
| **Flat-bottom counterbore depth** | 2.0 mm | ±0.1 mm |
| Through-bore to channel | 1.5–2.0 mm | ±0.1 mm |
| Counterbore flat surface finish | Ra 0.4 μm | **critical** |

#### Port Placement
- **Inlet**: one end wall of channel, centered on channel cross-section
- **Outlet**: opposite end wall, mirrored
- Ports enter from channel end walls (not through coverslip)
- Port axis aligned with flow direction

#### Thermocouple Port (Optional, Recommended)
Additional 1/4-28 port near imaging region, sized for 1/16" OD sheathed probe:
- Same thread/counterbore spec as flow ports
- Can be used with IDEX Super Flangeless nut + ferrule on 1/16" OD probe sheath
- Placement: side wall of chamber, between entrance length and imaging region

---

### Coverslip Interface

#### Coverslip Spec
- **Thorlabs CG15KH1 #1.5H, 24 × 50 × 0.170 mm**
- Thickness: 170 μm nominal (±0.005 mm per Thorlabs drawing)
- Material: Schott D263 M borosilicate

#### Coverslip Recess (in chamber body top surface)
| Feature | Dimension | Tolerance |
|---|---|---|
| Recess length | 50.8 mm | +0.1 / -0.0 |
| Recess width | 24.8 mm | +0.1 / -0.0 |
| Recess depth | Match coverslip + clamp gap | ±0.05 mm |

0.4 mm clearance per side for sterile drop-in placement of cell-loaded glass.

#### Coverslip Deflection Check
At 80 Pa channel pressure: δ ≈ 0.5 μm (0.2% of channel height) — negligible.
10× overpressure still only 5 μm deflection. Design is robust.

---

### Gasket Specifications

#### Material
- **Medical-grade silicone** (or FKM/Viton for higher chemical resistance)
- **Durometer: 40–50 Shore A**
- **Thickness: 0.250 mm ±0.025 mm**

#### Source
- McMaster-Carr sheet stock (P/N for 0.010" ≈ 0.254 mm medical silicone: verify at order time)
- Laser-cut by SendCutSend or Oshcut, batch of 10+

#### Gasket Geometry
- Overall footprint: matches coverslip (24 × 50 mm) with features machined into stainless for registration
- Channel cutout: 24 mm × 50 mm rectangular (matches the full active channel under glass)
- Port pass-throughs if gasket extends over ports

#### Compression Target
- Uncompressed: 0.250 mm
- Compressed: 0.150 mm (40% compression, within silicone's happy range)
- Compression defined by machined lip height (stop-limited, not torque-limited)

---

### Clamp Frame (Separate Part — Aluminum)

#### Purpose
Press coverslip down against lip, compress gasket to defined thickness.

#### Design Principles
- Aluminum (6061 is fine — doesn't touch fluid)
- Clamps coverslip **against the lip**, not directly against the gasket
- ≥4 M3 socket-head screws around perimeter
- Relief pocket in center so frame doesn't touch cells or chamber interior
- Thickness: ~5 mm

#### Tolerances
- Standard milling tolerance (±0.1 mm) is fine
- No critical surfaces

---

### Achievable Tolerances (Xometry/RapidDirect, 3-Axis CNC, 316 SS)

| Feature Type | Standard | Comfortable (moderate upcharge) | Premium (higher upcharge) |
|---|---|---|---|
| Linear tolerance | ±0.025 mm (±0.001") | ±0.013 mm (±0.0005") | ±0.005 mm (±0.0002") |
| Flatness | 0.025 mm | 0.010 mm | 0.005 mm |
| Surface finish | Ra 3.2 μm | Ra 0.8 μm | Ra 0.4 μm |

**Feature size limits (well within our design):**
- Minimum endmill radius: 0.5 mm (creates internal corner fillets)
- Minimum feature: 0.5 mm
- Max aspect ratio (depth:width): 4:1 comfortable
- Minimum wall thickness: 0.5 mm

**Our tightest feature: 100 μm lip step at ±5 μm** — pushes into premium tier, worth the upcharge.

---

### Default Tolerances & General Notes (Drawing Boilerplate)

#### Title Block
- Material: 316 stainless steel
- Finish: Electropolished interior surfaces per ASTM B912, Ra ≤ 0.4 μm
- Post-treatment: Passivate per ASTM A967, Citric 3
- Units: mm
- Projection: Third angle (US) or First angle (EU) — specify

#### General Notes to Include on Drawing
```
1. Material: 316 stainless steel, annealed
2. Electropolish all interior fluid-contact surfaces per ASTM B912
   Target Ra ≤ 0.4 μm (16 μin)
3. Passivate per ASTM A967, Citric 3 method
4. Remove all burrs and sharp edges
5. Clean internal passages thoroughly — no swarf, chips, or debris permitted
6. Critical dimensions flagged with ◊ — 100% inspection required
7. Default linear tolerance: ±0.1 mm unless otherwise specified
8. Default angular tolerance: ±1°
9. Threads: 1/4-28 UNF-2B, flat-bottom per IDEX Super Flangeless standard
10. Do not break edges on sealing surfaces (lip top, counterbore bottoms)
```

---

### Recommended Drawing Views

1. **Isometric** — orientation reference, not dimensioned
2. **Top view** — channel layout, port positions, coverslip recess footprint
3. **Bottom view** — any mounting features (stage dowel pins, etc.)
4. **Section A-A** (longitudinal, through channel length) — shows lip profile, floor, port entry geometry
5. **Section B-B** (transverse, through channel width) — shows rectangular channel cross-section, lip shoulders
6. **Detail: Lip Step** — 10× scale, dimensions the 0.100 ±0.005 mm critical feature
7. **Detail: Port** — 5× scale, shows 1/4-28 thread, counterbore, through-bore

---

### Stage Indexing (Optional)

For repeatable positioning session-to-session on the LSM 880:
- Two dowel pin holes on bottom face, Ø3 mm H7 fit
- Spacing to match LSM 880 stage insert — confirm with microscope documentation before specifying
- Tolerance: ±0.05 mm on hole position

---

### Vendor Notes

#### Xometry
- Domestic (US), ~1 week lead time
- Online instant quote with critical dimension flags
- Good for aluminum clamp frame (fast turnaround on simple parts)

#### RapidDirect
- China partner shops, 1–2 week lead time
- Generally cheaper for stainless
- Good for primary chamber body
- Tolerance specs honored with callouts

#### Cost Optimization
- Batch order 2–3 chambers — setup cost amortizes
- Don't blanket-spec tight tolerance; only flag what matters
- Let endmill leave natural corner fillets (no need to spec)
- Quote standard tier first, then selectively upgrade critical features

#### Expected Cost
- Chamber body: $150–300 depending on tolerance/finish tier
- Clamp frame (aluminum): $50–100
- Gasket batch (10 pcs laser-cut): $20
- Lead time: 1–3 weeks

---

### Design Validation Checklist (Before Sending to Vendor)

- [ ] Channel geometry confirms target shear range (check with τ = 6μQ/bh²)
- [ ] Entrance length ≥ 10× required L_e at max Reynolds number
- [ ] Coverslip deflection calculated at max pressure, <1% of channel height
- [ ] Lip step height dimensioned with ±0.005 mm tolerance
- [ ] Lip flatness called out with GD&T symbol (0.005 mm)
- [ ] All 1/4-28 ports have flat-bottom counterbores to IDEX spec
- [ ] Port counterbore surface finish callout (Ra 0.4 μm)
- [ ] Electropolish + passivation noted in general notes
- [ ] Gasket material and thickness spec'd
- [ ] Clamp frame designed as separate part
- [ ] Coverslip size (24×50 mm, #1.5H, Thorlabs CG15KH1) confirmed against drawing
- [ ] Stage indexing features matched to LSM 880 insert geometry

---

### Related References

- Lewis et al. 2017, PNAS — in vivo reference study (this chamber is the in vitro analog)
- Lu et al. 2012, Bone — MLO-Y4 FSS calcium imaging, steady vs oscillatory
- IDEX Super Flangeless fitting catalog — for 1/4-28 port geometry
- Thorlabs coverslip spec sheets (CG15KH1, #1.5H, 24×50 × 0.170 mm)
- ibidi Application Note 11 — parallel-plate shear stress reference

---

## RapidDirect Design Lock

Related design documents: `README.md`, `design_spec_v2.md`, `coverglass_spec.md`, `microscope_i880_constraints.md`, `scope_holder_reference.md`, `materials_evaluation.md`, `electronics_controller_architecture.md`, and `electronics_bringup_checklist.md`.

Purpose: track the hardware on hand, identify what still affects the machined steel parts, and freeze the decisions that would be expensive to change after machining.

### Current Inventory

#### Controllers and compute

| Item | Qty | Status for this build | Steel-part impact |
|---|---:|---|---|
| Teensy 4.1, no Ethernet | 1 | Primary real-time controller | None |
| Teensy 4.1 terminal block breakout | 1 | Primary wiring interface | None |
| ESP32-S3 N16R8 with PinPlus shield | 1 | Backup / wireless monitor / future UI | None |
| MicroSD card, 64 GB UHS-I U3 V30 A2 | 1 | Data logging storage | None |

#### Displays and controls

| Item | Qty | Status for this build | Steel-part impact |
|---|---:|---|---|
| Waveshare 1.5 inch grayscale OLED, 128 x 128 | 1 | Optional status display | None |
| Waveshare 1.5 inch RGB OLED, 128 x 128 | 1 | Optional status display | None |
| EC11 rotary encoder modules | 5 | Optional manual UI | None |

#### Sensors

| Item | Qty | Status for this build | Steel-part impact |
|---|---:|---|---|
| DS18B20 waterproof temperature probes | 5 | Reservoir / inlet / ambient temperature logging | Do not design chamber around these probes unless probe OD is measured; typical waterproof probes are too large for low-dead-volume chamber ports |
| LIS3DSH tri-axis accelerometers | 2 | Optional pump vibration / stage leveling | None |
| Adafruit SPH0645LM4H I2S MEMS mic | 1 | Not applicable to current chamber | None |

#### Motor and electronics

| Item | Qty | Status for this build | Steel-part impact |
|---|---:|---|---|
| TMC2209 stepper motor drivers | 2 | Pump driver, one spare | None |
| 8-channel 24 MHz logic analyzer (Lonely Binary) | 1 | Multi-channel digital protocol decode (UART/I2C/SPI) | None |
| FNIRSI 1014D handheld oscilloscope | 1 | Analog signal integrity, voltage measurement, DDS signal generation. 2-channel 100 MHz / 1 GSa/s, FFT, Lissajous, 100× HV probe included | None |
| 4.7 kohm resistors | 10 | OneWire pull-ups / general use | None |
| Mini solderless breadboards | 3 | Prototype only | None |
| Jumper wire kit | 1 | Prototype only | None |
| 22 AWG silicone wire kit | 1 | Harnessing | None |
| Heat shrink kit | 1 | Harnessing | None |
| Ferrule crimping kit | 1 | Final wiring | None |
| Inline fuse holders | 10 | 24 V motor rail protection | None |
| Automotive blade fuse kit | 1 | 24 V motor rail protection | None |

#### Fluidics and optical parts

| Item | Qty | Status for this build | Steel-part impact |
|---|---:|---|---|
| Medical silicone tubing, 1/8 inch ID, 1/4 inch OD, 10 ft | 1 | Useful for reservoir / low-pressure loop sections, not ideal for low-dead-volume chamber ports | Do not machine fixed ports around this tubing unless choosing barb architecture intentionally |
| Precision fused silica microscope slides, 1 mm thick | 2 | Possible calibration / alternate substrate | Do not affect current steel unless explicitly supporting 1 mm slide mode |

### Missing Or Not Confirmed

These are not in the current inventory list but affect either the final build or the steel order.

| Item | Needed for | Steel-part impact |
|---|---|---|
| Kamoer KCS 24 V peristaltic pump, or confirmed equivalent | Flow generation | Pump choice affects flow range and pulsation, but not chamber steel if ports remain standard |
| 24 V power supply | Pump motor rail | None |
| Optocouplers / digital isolators | Microscope and motor-domain isolation | None |
| Measured holder/objective STEP | Objective/stage collision check | Use `CAD/flow_chamber_components/scope_holder.stp`; reference only, not exported to RapidDirect |
| 1/16 inch OD FEP tubing | Low-dead-volume chamber connection | Port standard should be chosen around this, not around 1/4 inch OD silicone |
| IDEX / Upchurch 1/4-28 flat-bottom nuts and ferrules | Chamber inlet/outlet connections | Hard port geometry input |
| Thorlabs CG15KH1 #1.5H cover glass pack | Default optical substrate | Hard pocket/retainer/gasket input; not currently confirmed in hand |
| Silicone sheet, FKM sheet, or O-ring cord | Seal | Hard gland / gasket geometry input |
| Final fasteners | Clamp preload | Hard screw clearance / thread / counterbore input |
| Dowel pins / stage indexing hardware | Repeatable microscope positioning | Hard only if stage indexing is included now |

### Current CAD Readout

Read from `parametric_02.3dm` using `rhino3dm`.

| CAD datum | Observed value |
|---|---|
| Model units | millimeters |
| Model absolute tolerance | 0.001 mm |
| Main steel body object | about 79.352 x 52.000 x 15.880 mm |
| Lower steel retainer object | about 79.352 x 52.000 x 8.000 mm |
| Glass Brep vertices | 50.000 x 22.648 x 0.170 mm |
| Media Brep vertices | 50.000 x 22.648 x 0.250 mm |
| Lower-retainer central opening vertices | about 46.000 x 14.648 mm |
| Current imported hardware | FEP tubing, quick-turn tube couplings, luer fittings, thumb screws, pump/reservoir/stage models |

Hard concern: the procurement reference is Thorlabs CG15KH1, 24.0 x 50.0 x 0.170 mm, while the newest CAD glass body appears to be 50.000 x 22.648 mm. If that is not an intentional trimmed/placeholder object, the glass pocket is wrong for the target coverslips.

### Conflicts To Resolve Before Sending Steel

#### 1. Cover glass size

Decision needed: use Thorlabs CG15KH1 #1.5H, 24 x 50 mm cover glass as the locked optical substrate.

If yes, the steel must have:

- prototype glass pocket clearance: 50.8 mm long
- prototype glass pocket clearance: 24.8 mm wide
- pocket internal corner radius: 0.5 mm
- no steel intrusion into the objective cone below the imaging window
- retainer support that clamps the glass without point-loading the optical field

Update after drawing review: the part has +/- 0.2 mm length/width tolerance. Because the glass will be inserted with cells on it, the prototype pocket should be loose enough for sterile drop-in placement rather than a snug slip fit. Use 50.8 x 24.8 mm before physical lot measurement unless the actual cover glass pack justifies tightening the pocket.

Do not send the current design if the actual glass pocket is 22.648 mm wide and the physical glass is 24 mm wide.

#### 2. Channel geometry — RESOLVED

Locked: **24 mm × 50 mm × 0.25 mm** (full cover-glass footprint × hard-stop-controlled height) at media μ = 0.9 mPa·s. The 0.5–5 Pa shear range maps to 8.33–83.33 mL/min, which sits comfortably inside the Kamoer KCS pump envelope.

Historical context (preserved for audit; do not act on these): earlier source documents disagreed across narrow-channel options — Thesis v1 (75 × 5 × 0.254 mm, 20–39 mL/min for 1.5–3 Pa), machining notes draft (45 × 5 × 0.250 mm), an `oring_layout.svg` sketch (64 × 12 × 0.200 mm), and a transitional Rhino model with a 50 × 22.648 mm media body. None of those is canonical.

#### 3. Seal architecture

Current prototype architecture:

- top and bottom plates close against steel-to-steel hard-stop faces;
- top-plate boss and bottom-pocket stack set repeatable channel height;
- piston/radial O-ring seal between top and bottom plates holds the wetted cavity pressure;
- luer plugs/adapters seal inlet and outlet depending on operating mode;
- underside cover-glass support lip remains the main risk item to validate.

There are older competing architectures in the notes:

| Architecture | What defines channel height | Risk |
|---|---|---|
| Thin laser-cut gasket | gasket cutout and controlled compression | Replaceable, simple, but gasket thickness/compression must be measured |
| Machined recess plus O-ring perimeter seal | machined channel depth | More reusable, but requires a separate hard stop so O-ring squeeze does not bend the glass |

Do not mix an O-ring perimeter, a channel-height gasket, and torque-dependent glass compression unless the hard stop dimensions are explicit.

Steel lock requirement: channel height must be stop-limited, not torque-limited. Absolute channel height can be empirically calibrated after machining, but repeated assembly should return to the same steel-to-steel stop. At 0.25 mm height, a 0.005 mm height error is about 4 percent shear error.

#### 4. Port standard

Prototype recommendation: use top-mounted luer sockets for inlet and outlet. This keeps the chamber modular for luer plugs, pump adapters, external tubing adapters, and culture vent-cap adapters without locking the machined chamber body into a single IDEX flat-bottom ecosystem.

Do not machine the steel around 1/8 inch ID x 1/4 inch OD silicone tubing unless intentionally switching to barb fittings. That tubing is useful elsewhere in the loop, but it is too large for low-dead-volume chamber inlet/outlet geometry.

Port lock:

- inlet and outlet placed above channel/end regions where they are accessible and outside the objective clearance zone
- luer sockets modeled from known hardware or vendor STEP
- luer plugs/adapters have finger clearance
- smooth transition into rectangular channel
- shallow end manifold preferred between each luer bore and the 24 mm x 0.25 mm channel cross-section
- no abrupt dead-volume pocket at port-to-channel interface
- optional spare side port only if it can be plugged flush and will not create a bubble trap

#### 5. Fasteners

Documents/CAD disagree between M3, M5, and thumb-screw hardware.

Decision needed: lock one fastener family for the glass clamp. Prefer M3 or M4 around the optical stack unless a preload calculation requires larger screws.

Steel lock requirement:

- compression controlled by shoulders/hard stops, not screw torque
- screws cannot chip glass edges
- screw heads must clear the microscope stage and objective travel
- RapidDirect drawing must separate clearance holes, tapped holes, and counterbores

#### 6. Temperature sensing

The DS18B20 probes are useful, but they should not drive chamber machining unless their exact stainless probe OD is measured.

Recommendation: use DS18B20 in the reservoir, near inlet tubing, and ambient/stage environment. Do not add a large DS18B20 chamber port to the steel body for v2. A small optional 1/4-28 probe port is acceptable only if using a 1/16 inch OD sheathed probe later.

### Locked Scientific Target

The chamber should support:

- MLO-Y4 osteocyte-like cells, with future IDG-SW3 compatibility if practical
- Fura Red calcium imaging through Thorlabs CG15KH1 #1.5H glass on Zeiss LSM i880
- laminar shear in the 0.2 to 3.0 Pa range
- stable baseline, controlled onset, and synchronized timing
- response metrics aligned with Lewis 2017: responding-cell fraction, latency, decay/recovery, event frequency, AUC, and threshold curves, not only spike height

### RapidDirect Package Checklist

Before uploading:

- [ ] Export separate STEP files for each machined part, not the full assembly with imported hardware
- [ ] Generate PDF drawings for each steel part
- [ ] Confirm cover glass pocket fits physical 24 x 50 mm glass
- [ ] Confirm prototype pocket is 50.8 x 24.8 mm with 0.5 mm corner radii, or update after measuring actual glass lot
- [ ] Confirm channel width, height, and active length are final
- [ ] Dimension channel height with tolerance and inspection callout
- [ ] Dimension glass support / hard-stop geometry
- [ ] Dimension gasket or O-ring gland according to the chosen seal architecture
- [ ] Dimension luer sockets, plug/adapter clearance, through-bores, and luer-to-channel transitions
- [ ] Confirm all ports are reachable by tools and fittings after assembly
- [ ] Confirm fastener standard, tapped depths, and clearances
- [ ] Confirm objective clearance from below
- [ ] Interference-check chamber against `CAD/flow_chamber_components/scope_holder.stp`
- [ ] Confirm no steel edge touches the imaging region or glass optical path
- [ ] Add finish notes: 316 stainless, deburr, clean internal passages, passivate
- [ ] Call out critical sealing surfaces and channel floor finish
- [ ] Ask vendor not to break edges on sealing lips

### Current Recommendation

Do not send the steel files until the CAD reflects the locked geometry: 24 × 50 mm cover-glass pocket plus a 24 × 50 × 0.25 mm channel matching the full cover-glass footprint. Verify that no transitional CAD body still encodes the historical narrow-channel (5 mm) or 22.648 mm placeholder-glass values.

### Microscope Lock

Additional constraint from the Zeiss LSM 880 guides: the chamber should be compatible with inverted imaging through #1.5 glass, especially the 40x/1.2 water objective with 0.28 mm working distance. The underside imaging window must expose the coverslip directly and keep steel, gasket, screw heads, and port/fitting geometry outside the objective clearance envelope.

Detailed microscope notes are in `microscope_i880_constraints.md`.

---

## Fusion Model Seed

This folder starts the clean Fusion 360 path for the v2 flow chamber.

### Current File

- `flow_chamber_v2_seed.py` creates a new Fusion design with the locked geometry parameters and one physical body: the CG15KH1 cover glass.

### Seed Philosophy

The cover glass is the first fixed object. Everything else should be designed around it.

Coordinate convention:

- `X`: flow direction / 50 mm cover-glass length
- `Y`: 24 mm cover-glass width
- `Z`: optical stack height
- `Z = 0`: fluid-facing cell surface of the cover glass
- `Z = -cover_glass_t`: objective-facing bottom surface of the cover glass

### What It Creates

- User parameters for the locked v2 geometry:
  - cover glass, pocket, channel, gasket, hard-stop, body envelope, objective clearance, port, and M3 reference dimensions
- One body:
  - `CG15KH1_24x50x0p170_cover_glass`

It does not create chamber body blanks, channel reference solids, gasket bars, port cylinders, hard-stop pads, or objective envelopes.

### How To Run

1. Open Autodesk Fusion 360.
2. Open `Scripts and Add-Ins`.
3. Run `flow_chamber_v2_seed.py`.
4. Save the generated design as the first native Fusion model.

### First Manual Modeling Move

Start from the cover-glass top face as the channel floor datum. Add the flow-channel sketch and glass pocket/support geometry around that body, using the script-created user parameters rather than typed one-off dimensions.
