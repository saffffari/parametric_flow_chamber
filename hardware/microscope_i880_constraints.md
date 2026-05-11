# Zeiss LSM 880 Inverted Microscope Constraints

Related design documents: `README.md`, `design_spec_v2.md`, `coverglass_spec.md`, `scope_holder_reference.md`, `rapid_direct_design_lock.md`, and `materials_evaluation.md`.

Source PDFs:

- `C:/Users/alex/Downloads/i880 Detailed User Guide.pdf`
- `C:/Users/alex/Downloads/i880 Condensed User Guide.pdf`
- `C:/Users/alex/Downloads/Airy Scan_i880.pdf`

## System Summary

The target microscope is an inverted Zeiss LSM 880 with confocal and multiphoton capability. Confocal detectors are spectrally resolved and can be used with standard visible excitation lines or multiphoton excitation. Non-descanned detectors are only for multiphoton excitation.

For the flow chamber, this means the optical path should be designed primarily around inverted imaging through #1.5 glass, with no steel or gasket intrusion under the objective-facing field.

## Laser And Detector Capabilities

Available visible/confocal excitation lines shown in the condensed guide:

- 405 nm diode
- 458 nm argon
- 488 nm argon
- 514 nm argon
- 543 nm HeNe
- 561 nm DPSS
- 633 nm HeNe

Multiphoton:

- Insight tunable line: 680 to 1300 nm
- Insight fixed line: 1040 nm
- Steering hole: 1000 to 1080 nm
- Definite Focus does not work at 850 to 900 nm and above 1100 nm, per guide

Detector notes:

- Ch1 and Ch2 are standard alkali PMTs.
- ChS1 is an array of 32 high-sensitivity GaAsP PMTs and can use up to 8 channels in channel mode.
- Ch2 and ChS can run integration or photon-counting mode; photon-counting is mainly for weak signals.
- NDD / BiG detectors require multiphoton excitation; do not use laser lines below 700 nm with NDD detectors.

## Objective Table

From the i880 condensed guide.

| Mag | NA | Immersion | Cover glass spec (mm) | WD (mm) | Objective type | Transmission >0.5 |
|---:|---:|---|---:|---:|---|---|
| 10x | 0.3 | Air | 0.17 | 5.2 | EC Plan-Neofluar | 350-1200 nm |
| 20x | 0.5 | Air | 0.17 | 2.0 | EC Plan-Neofluar | 350-1250 nm |
| 10x | 0.45 | Water | 0.17 | 1.8 | C-Apochromat | 350-1200 nm |
| 32x | 0.85 | Water | 0-0.17 | 1.1 | C-Achroplan | 450-1300 nm |
| 40x | 1.2 | Water | 0.14-0.19 | 0.28 | C-Apochromat | 350-1150 nm |
| 40x | 1.4 | Oil | 0.17 | 0.13 | Plan-Apochromat | 380-1200 nm |
| 63x | 0.75 | Air | 0-1.5 | 1.7 | LD Plan-Neofluor | 350-950 nm |
| 63x | 1.4 | Oil | 0.17 | 0.19 | Plan-Apochromat | 350-1300 nm |

## CAD Consequences

### Optical substrate

The design should lock to #1.5 glass. The current reference part is Thorlabs CG15KH1 #1.5H, `24 x 50 x 0.170 mm`, Schott D263 M. Do not substitute thick plastic or a 1 mm slide for the reference flow-imaging configuration.

### Working distance

The chamber should be designed so the `40x/1.2 water` objective can reach the coverslip from below. This is the most realistic high-NA objective for live aqueous samples because it accepts 0.14 to 0.19 mm cover glass and has a 0.28 mm working distance.

The 40x oil and 63x oil objectives have even shorter working distances, 0.13 and 0.19 mm. They are poor mechanical reference objectives for a wet perfusion chamber unless the underside is nearly bare coverslip and immersion handling is acceptable.

The 20x air objective has 2.0 mm working distance and is forgiving for setup, low-magnification calcium time series, and validation, but it should not define the final chamber because it is not the limiting case.

### Underside geometry

In the imaging zone:

- expose the coverslip directly to the objective side
- keep metal retainer lips, screw heads, gasket material, and port bosses outside the objective cone
- avoid raised features near the coverslip underside
- include a generous lower window around the active channel, not just a narrow slot

The design should include a drawn objective clearance envelope around the 40x/1.2 water objective. If exact nose geometry is unavailable, keep the underside opening as large and flat as the steel strength allows.

Current measured reference geometry is available at `CAD/flow_chamber_components/scope_holder.stp`. Use it for collision checking, but preserve clearance margin because it is a caliper-derived reference and other objective/holder combinations may vary.

### Incubation/environment

The microscope supports temperature and CO2 control through the incubation toolbar. The chamber should not assume room-temperature experiments only. The external loop should tolerate 37 C media, and the chamber should not block environmental enclosure closure or stage travel.

### Time series

ZEN time series acquisition requires setting interval and cycles. An interval shorter than frame or line scan time is ineffective. The firmware should log pump and stimulus events with its own timestamp authority, then analysis should align those timestamps with frame timing from `.czi` metadata and experiment logs.

The local guides do not document the electrical trigger specification in detail. Before building the trigger circuit around a Zeiss BNC assumption, confirm the specific i880 trigger I/O behavior with the facility or microscope hardware panel.

## Imaging Mode Recommendations

### Fura Red calcium imaging

Use standard confocal mode, not Airyscan, for high-speed calcium time series. Fura Red work is primarily time-resolution and photobleaching limited, not super-resolution limited.

Relevant settings from the guide:

- 12-bit data is recommended for quantitative low-intensity measurements.
- Pinhole around 1 Airy unit is the normal confocal compromise.
- Sequential tracks reduce crosstalk but slow acquisition.
- Avoid unnecessary averaging for calcium dynamics because averaging reduces temporal resolution.
- Use time series with interval and cycle count; frame interval cannot beat actual scan time.

### Airyscan

Airyscan is useful for morphology, endpoint imaging, and high-resolution validation of cell attachment/network structure, but it is not the primary mode for real-time shear-response calcium traces.

Airyscan-specific constraints:

- recommended high-NA objective: 63x/1.4 oil
- zoom 1.8 or higher
- frame size optimal or 1024 x 1024 or larger
- speed max, averaging 1, bit depth 12 or 16
- alignment must be good before acquisition
- tile scans are not possible with Airyscan

This reinforces the need for a chamber underside that does not prevent close oil/water objectives from reaching the glass, even if most calcium runs use lower magnification.

### Multiphoton/NDD

For multiphoton with internal detectors, the pinhole can be opened fully because the nonlinear excitation provides optical sectioning. For NDD/BiG detector use, all confocal lasers and room lights must be off, and visible lasers must not be routed to NDD detectors.

The chamber should avoid unnecessary autofluorescent materials near the optical path, because multiphoton/NDD workflows are sensitive to background and stray light.

## Objective Choice For Chamber Validation

Recommended validation ladder:

1. `10x/0.3 air`, WD 5.2 mm: leak-safe setup, locating cells, coarse time series.
2. `20x/0.5 air`, WD 2.0 mm: first calcium time-series validation and debris/flow visualization.
3. `40x/1.2 water`, WD 0.28 mm: final high-NA live-cell design constraint and publication-quality calcium imaging.
4. `63x/1.4 oil`, WD 0.19 mm: Airyscan or endpoint morphology only if the chamber underside and immersion handling are proven safe.

## RapidDirect Design Lock Additions

- CAD must show the lower objective-side window and clearance envelope.
- Chamber must be compatible with `24 x 50 x 0.17 mm` #1.5 cover glass.
- The active imaging region should sit over exposed glass, not over a metal shelf.
- Port bodies, tubing, fittings, screws, and thumb grips must not collide with the objective turret, stage insert, incubation enclosure, or condenser/illumination path.
- Do not rely on Airyscan for live shear calcium traces; design for standard confocal time series first.
