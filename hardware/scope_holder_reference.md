# Scope Holder And Objective Reference

Reference STEP:

`D:/research/parametric flow chamber/CAD/flow_chamber_components/scope_holder.stp`

This STEP is the current measured microscope holder/objective reference, based on caliper measurements. It should be used as the working clearance envelope for the fresh CAD model unless a more accurate facility CAD model becomes available.

## Import Metadata

- File name in STEP header: `scope_holder`
- Timestamp: `2026-04-24T17:43:33-07:00`
- Originating system: Rhino 8.30
- Schema: `CONFIG_CONTROL_DESIGN`
- Parsed with CadQuery / OpenCascade
- Units assumed from Rhino export context: millimeters

## Bounding Box Readout

Combined STEP compound:

| Axis | Min | Max | Size |
|---|---:|---:|---:|
| X | -154.7470 | 20.3182 | 175.0652 mm |
| Y | -238.2137 | -133.0328 | 105.1809 mm |
| Z | -54.9922 | -4.6950 | 50.2973 mm |

Major solids:

| Solid | Likely role | Bounding size |
|---:|---|---:|
| 0 | objective / nose envelope | 18.8629 x 18.8629 x 45.0877 mm |
| 1 | holder / stage plate | 175.0652 x 105.1809 x 5.0000 mm |
| 5, 8 | side rails / holder features | 17.8256 x 93.9481 x 3.3250 mm |
| 2, 3, 4, 6, 7 | small holder pads/features | 11.0379 x 9.7398 x 1.2901 mm |

Objective/nose solid bounding box:

| Axis | Min | Max | Size |
|---|---:|---:|---:|
| X | -76.2818 | -57.4189 | 18.8629 mm |
| Y | -196.8920 | -178.0291 | 18.8629 mm |
| Z | -54.9922 | -9.9045 | 45.0877 mm |

Objective/nose centerline estimate:

- X center: -66.8504 mm
- Y center: -187.4606 mm
- Reference diameter: 18.8629 mm

Holder/stage plate bounding box:

| Axis | Min | Max | Size |
|---|---:|---:|---:|
| X | -154.7470 | 20.3182 | 175.0652 mm |
| Y | -238.2137 | -133.0328 | 105.1809 mm |
| Z | -10.1546 | -5.1546 | 5.0000 mm |

## Design Use

Use this STEP as the first-pass mechanical envelope for:

- objective clearance below the chamber;
- holder/stage footprint;
- placement of screws, thumb grips, fittings, and tubing;
- lower imaging window geometry;
- collision checking against the chamber body and clamp.

## Clearance Rule

Do not design the chamber to merely touch this envelope. Add margin because:

- the STEP is a caliper-derived approximation;
- other objectives and holders may be slightly different;
- immersion water/oil handling needs working space;
- microscope stages and sample holders have tolerances and small alignment variation.

Recommended first-pass clearance:

- at least 2 mm radial clearance around the measured objective/nose envelope;
- at least 5 mm clearance around screw heads, thumb grips, fittings, and tubing near the objective access zone;
- no steel/gasket/retainer lip below the cover glass inside the imaging window.

## CAD Implication

The fresh chamber model should import this STEP as reference geometry on a locked, non-export layer. It should not be included in RapidDirect machining exports.

Before sending steel:

- run an interference check with this reference STEP;
- export a screenshot or drawing showing objective clearance;
- if possible, confirm against the actual i880 holder/objective during a dry fit.
