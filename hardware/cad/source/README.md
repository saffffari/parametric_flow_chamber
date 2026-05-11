# Fusion Model Seed

This folder starts the clean Fusion 360 path for the v2 flow chamber.

## Current File

- `flow_chamber_v2_seed.py` creates a new Fusion design with the locked geometry parameters and one physical body: the CG15KH1 cover glass.

## Seed Philosophy

The cover glass is the first fixed object. Everything else should be designed around it.

Coordinate convention:

- `X`: flow direction / 50 mm cover-glass length
- `Y`: 24 mm cover-glass width
- `Z`: optical stack height
- `Z = 0`: fluid-facing cell surface of the cover glass
- `Z = -cover_glass_t`: objective-facing bottom surface of the cover glass

## What It Creates

- User parameters for the locked v2 geometry:
  - cover glass, pocket, channel, gasket, hard-stop, body envelope, objective clearance, port, and M3 reference dimensions
- One body:
  - `CG15KH1_24x50x0p170_cover_glass`

It does not create chamber body blanks, channel reference solids, gasket bars, port cylinders, hard-stop pads, or objective envelopes.

## How To Run

1. Open Autodesk Fusion 360.
2. Open `Scripts and Add-Ins`.
3. Run `flow_chamber_v2_seed.py`.
4. Save the generated design as the first native Fusion model.

## First Manual Modeling Move

Start from the cover-glass top face as the channel floor datum. Add the flow-channel sketch and glass pocket/support geometry around that body, using the script-created user parameters rather than typed one-off dimensions.
