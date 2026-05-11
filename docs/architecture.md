# Architecture

> Migrated from `design_spec_v2.md` in the dev archive (architecture/system portions). Theory and channel geometry are in `docs/theory.md`. Industrial design language is in `docs/design_language.md`. The full electronics architecture and bench bring-up sequence are consolidated in `hardware/electronics/README.md`. Vendor-facing machining notes are in `hardware/machining_notes.md`.

## System architecture

The reference system is modular:

| Module | Default choice | Reason |
|---|---|---|
| Reusable precision chamber | 316L stainless steel | stiff, machinable, cleanable, durable |
| Optical cell substrate | #1.5 borosilicate cover glass | microscope-compatible, cheap, standard |
| Experimental substrate | titanium, polymer, hydrogel, ECM, ceramic, or coated glass insert | keeps biology customizable |
| Fluidic consumables | FEP/PTFE tubing, silicone pump tubing, replaceable gasket | low cost, replaceable, accessible |
| Controller | Teensy 4.1 | deterministic pump timing, logging, trigger sync |

## Microscope constraint

The chamber is for a Zeiss LSM 880 inverted microscope.

Relevant objectives:

| Objective | Working distance | Use |
|---|---:|---|
| 10x/0.3 air | 5.2 mm | setup and locating |
| 20x/0.5 air | 2.0 mm | forgiving calcium/flow validation |
| 32x/0.85 water | 1.1 mm | long-WD higher-resolution option |
| 40x/1.2 water | 0.28 mm | primary high-NA live-cell design constraint |
| 63x/1.4 oil | 0.19 mm | Airyscan / endpoint morphology only |

Design implication: the objective-facing underside must expose the #1.5 cover glass directly in the imaging zone. No steel, gasket, screw head, retaining lip, or port boss should enter the objective clearance envelope.

Use the third-party scope-holder reference STEP at `hardware/cad/components/scope_holder.stp` as the current measured holder/objective reference for collision checks. This reference is caliper-derived and should get clearance margin, not a zero-clearance fit.

## Titanium experiment geometry

The target microscope is inverted, so opaque titanium coupons require a specific strategy. Do not assume cells on opaque metal can be imaged from below through the metal.

Acceptable strategies:

1. **Titanium-modified transparent glass floor**
   - Best for i880 high-NA live calcium imaging.
   - Examples: sputtered titanium or titanium-alloy films, thin oxide coatings, patterned/topographic transparent-compatible coatings.
   - Weakness: less implant-faithful than bulk machined/etched coupons.

2. **Opaque titanium ceiling insert**
   - Cells are cultured on titanium, then the coupon is mounted as the channel ceiling with cells facing downward into the channel.
   - Objective images from below through cover glass and media.
   - Requires long-working-distance objectives and careful channel height/focus validation.
   - This is not compatible with the 40x/1.2 water objective if the focal plane is too far above the coverslip.

3. **Alternate imaging geometry**
   - Use an upright microscope, side imaging, or another microscope if true bulk opaque coupons must be imaged from the cell side.

Decision required before final CAD: is titanium a transparent floor coating, an opaque ceiling insert, or outside this chamber's live-imaging mode?

## Seal architecture

Hard requirement: channel height and seal compression must be controlled by geometry, not by screw torque.

Current prototype architecture:

- piston/radial O-ring seal between the top flow plate and bottom plate;
- steel-to-steel hard-stop contact between top and bottom plates;
- channel height set by the machined pocket/boss/glass-thickness stack, not by O-ring compression;
- actual channel height to be empirically calibrated after machining and assembly.

Acceptable alternates if prototype leakage or repeatability fails:

1. machined channel height plus perimeter gasket/O-ring seal outside the channel;
2. laser-cut gasket defining channel height, compressed against hard stops;
3. precision spacer/shim defining channel height, with a separate perimeter seal.

Do not combine gasket thickness, O-ring squeeze, glass bending, and screw torque into an uncontrolled height stack.

## Port standard

Prototype port architecture:

- top-mounted luer sockets over the cover-glass / channel region;
- luer-lock plugs for sealed/transport mode;
- luer-to-tubing adapters for pump-loop mode;
- luer-to-vent-cap standpipe adapter for incubator culture-mode experiments if needed;
- smooth/tapered transition into the rectangular channel;
- no dead pockets or bubble traps.

Preferred luer-to-channel transition:

- avoid a vertical luer bore dumping directly into the 0.25 mm channel if packaging allows;
- use a shallow end manifold at each channel end, fully inside the sealed wetted region;
- reference manifold dimensions: about 3-5 mm long, 5-7 mm wide, 0.5-1.0 mm deep, tapering / filleting into the 24 mm × 0.25 mm channel cross-section;
- simplest vertical-bore-to-channel transition is acceptable for the first prototype if cost or machinability is prioritized, but it is expected to be worse for bubble clearing and flow distribution.

The on-hand 1/8 inch ID × 1/4 inch OD silicone tubing should not define chamber port geometry. Use it for external low-pressure loop sections only if useful.

## Fusion parameter set

Use these names in Fusion user parameters. Values are prototype nominal values unless marked as measured/reference.

| Parameter | Value | Purpose |
|---|---:|---|
| `cover_glass_l` | 50.0 mm | CG15KH1 nominal cover glass length |
| `cover_glass_w` | 24.0 mm | CG15KH1 nominal cover glass width |
| `cover_glass_t` | 0.170 mm | CG15KH1 nominal cover glass thickness |
| `cover_glass_xy_tol` | 0.2 mm | Manufacturer length / width tolerance |
| `cover_glass_t_tol` | 0.005 mm | Manufacturer thickness tolerance |
| `cover_glass_pocket_l` | 50.8 mm | Prototype pocket length for sterile drop-in placement |
| `cover_glass_pocket_w` | 24.8 mm | Prototype pocket width for sterile drop-in placement |
| `cover_glass_pocket_corner_r` | 0.5 mm | Pocket internal corner radius |
| `cover_glass_pocket_chamfer` | 0.25 mm | Small lead-in chamfer for easier coverslip placement |
| `channel_l` | 50.0 mm | Locked active channel length (matches full cover-glass length) |
| `channel_w` | 24.0 mm | Locked parallel-plate channel width (matches full cover-glass width) |
| `channel_h` | 0.25 mm | Locked channel height (hard-stop controlled) |
| `imaging_w` | 3.0 mm | Preferred central near-uniform shear imaging width |
| `developed_entry_l` | 1.0 mm | Analytical entrance length is well under 1 mm at canonical Re; whole channel is fully developed |
| `manifold_l` | 4.0 mm | Nominal shallow end-manifold length at each luer bore |
| `manifold_w` | 6.0 mm | Nominal shallow end-manifold width |
| `manifold_h` | 0.75 mm | Nominal shallow end-manifold depth before the thin channel |
| `manifold_transition_l` | 4.0 mm | Nominal taper / fillet transition into the 24 mm × 0.25 mm channel |
| `cover_glass_t_measured` | `cover_glass_t` | Replace with measured lot thickness when available |
| `boss_stack_depth` | `cover_glass_t_measured + channel_h` | Pocket / boss Z stack from glass support datum to channel ceiling |
| `o_ring_gland_clearance` | 0.0 mm | Placeholder until O-ring cross-section and gland are chosen |
| `seal_land_min_w` | 2.0 mm | Initial minimum seal/support land width around flow path |
| `body_l` | 80.0 mm | Initial reusable chamber body length envelope |
| `body_w` | 52.0 mm | Initial reusable chamber body width envelope |
| `body_t` | 12.0 mm | Initial reusable chamber body thickness envelope |
| `bottom_lip_t` | 0.75 mm | Minimum vertical thickness for objective-side glass support lip |
| `objective_window_l` | 46.0 mm | Initial objective-side opening length |
| `objective_window_w` | 23.0 mm | Initial objective-side opening width |
| `objective_ref_d` | 18.8629 mm | Measured objective / nose reference diameter |
| `objective_ref_h` | 45.0877 mm | Measured objective / nose reference height |
| `objective_clearance_radial` | 2.0 mm | Minimum radial clearance around measured objective reference |
| `objective_envelope_d` | `objective_ref_d + 2 * objective_clearance_radial` | Objective clearance envelope diameter |
| `holder_plate_l` | 175.0652 mm | Measured holder plate reference envelope length |
| `holder_plate_w` | 105.1809 mm | Measured holder plate reference envelope width |
| `holder_plate_t` | 5.0 mm | Measured holder plate reference envelope thickness |
| `luer_bore_d` | 2.0 mm | Nominal luer bore into end manifold; verify against vendor STEP |
| `luer_socket_clearance_d` | 16.0 mm | Initial keep-out diameter around top-mounted luer socket / plug |
| `luer_socket_spacing_min` | 20.0 mm | Initial minimum center spacing for finger access |
| `tube_od` | 1.5875 mm | 1/16 inch OD tubing after luer adapter |
| `m3_clearance_d` | 3.4 mm | Reference M3 clearance hole |
| `m3_head_clearance_d` | 5.8 mm | Reference M3 socket-head clearance diameter |
| `m3_thread_pilot_d` | 2.5 mm | Reference M3 tapped pilot diameter |
| `fastener_to_glass_edge_min` | 3.0 mm | Initial minimum fastener clearance from glass edge |
| `tool_clearance_near_objective` | 5.0 mm | Minimum clearance around fittings / screw heads near objective zone |

The seed script that creates these parameters in Fusion is at `hardware/cad/source/flow_chamber_v2_seed.py`.

## Culture plate / sample handling

The open-source system should include a dedicated sample culture holder or well plate.

Requirements:

- holds 24 × 50 mm cover glass or matched inserts repeatably;
- minimizes media volume;
- allows collagen coating and cell culture before chamber assembly;
- keeps samples sterile during transport;
- protects fragile cover glass;
- can support parallel conditions for material/topology experiments.

Recommended material:

- machined polycarbonate for holder / well-plate body if reused and cleaned gently;
- commercial TCPS for routine expansion culture;
- COC/COP if scaling toward disposable optical consumables.

## Controller and instrumentation essentials

Detailed controller architecture, the differential-pressure shear-verification system, and the bench bring-up sequence are all in `hardware/electronics/README.md`.

Primary controller: Teensy 4.1.

Required functions:

- deterministic pump control;
- ramped flow onset / offset;
- SD logging;
- temperature logging;
- microscope timing synchronization if facility trigger I/O is confirmed;
- timestamp authority on the microcontroller, not the laptop.

Important unresolved item: the local i880 guides do not document electrical trigger / BNC behavior. Confirm the exact facility trigger I/O before finalizing the trigger circuit.

## Validation plan

Engineering validation:

- leak test at maximum planned flow;
- gravimetric pump calibration;
- pulsation characterization with and without dampener;
- bubble-trap validation;
- channel-height inspection or flow-based shear validation;
- objective clearance validation on the i880 stage.

Biology validation:

- live/dead assay on glass and substrate variants;
- baseline Fura Red stability with no flow;
- 0.5, 1.0, 1.5, 3.0 Pa shear-response ladder;
- responding-cell fraction and calcium event metrics;
- repeated cleaning / autoclave / passivation compatibility screen;
- optional stainless control to prove chamber material is not driving the signal.

## Do not machine until

- cover glass pocket matches the Thorlabs CG15KH1 reference and later physical glass lot;
- titanium live-imaging geometry is chosen;
- channel width and height are locked;
- seal architecture is locked;
- objective clearance envelope is drawn;
- port standard is locked;
- separate STEP files and PDF drawings exist for each machined part.
