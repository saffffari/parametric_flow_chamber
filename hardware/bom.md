# Bill of Materials

> **Status:** Skeleton — to be expanded into a full vendor-linked BOM during paper-prep. The detailed parts inventory currently lives inside `hardware/electronics/README.md` (Inventory Assessment + Missing Parts To Buy Or Confirm sections) and `hardware/machining_notes.md` (Vendor Notes + costing summary).

## Chamber body

| Part | Qty | Material | Notes |
|---|---:|---|---|
| Chamber body (machined) | 1 | 316L stainless | Electropolished + passivated wetted surfaces; CAD source `hardware/cad/source/`, machinable STEP `hardware/cad/step/base.step`, drawing `hardware/drawings/base_drawing.pdf` |
| Cover plate (machined) | 1 | 316L stainless | Same finish; STEP `hardware/cad/step/cover.step`, drawing `hardware/drawings/cover_drawing.pdf` |
| Clamp / retainer frame | 1 | 316L stainless or anodized aluminum | Non-wetted; secondary fastener for cover-glass preload |

Vendor: see `hardware/machining_notes.md` § "Vendor Notes" for Xometry vs RapidDirect cost/lead-time comparison. Expected $200–500 for the chamber + cover + clamp set in standard-tolerance tier.

## Optical and fluidics

| Part | Vendor / P/N | Qty | Notes |
|---|---|---:|---|
| Cover glass | Thorlabs **CG15KH1** #1.5H, 24 × 50 × 0.170 mm | pack | Locked optical substrate; pocket geometry in `hardware/coverglass_spec.md` |
| Sealing silicone sheet | Medical-grade **neutral-cure** silicone, 0.250 mm ± 0.025 mm, 40–50 Shore A | pack | **No RTV / no acetoxy.** Source: McMaster-Carr; laser-cut by SendCutSend or Oshcut |
| FEP/PTFE tubing, 1/16" OD | McMaster `2129T11` or equivalent | meters | Inlet/outlet to chamber |
| Pump tubing (peristaltic) | platinum-cured silicone, matched to pump head | as required | |
| Reservoir | borosilicate GL45 bottle | 1 | |
| 0.22 µm hydrophobic membrane filters | Millipore Millex-FG (PTFE) **SLFG025LS** or equivalent | 4–8 | Sterile barrier in standpipe stack; 2 inline (load-bearing) + 2 vent (redundant) |
| Standpipe tubes | borosilicate or acrylic, 6 mm × 50 mm | 2 | |
| IDEX Super Flangeless 1/4-28 fittings | IDEX / Cole-Parmer | as required | Chamber inlet / outlet / pressure taps |

## Pump and motor

| Part | P/N | Qty | Notes |
|---|---|---:|---|
| Peristaltic pump (24 V stepper-driven) | Kamoer KCS or equivalent | 1 | Low-pulsation head |
| 24 V DC supply, fused | sized for pump current + driver | 1 | |
| Latching motor-power switch / E-stop | NC contacts; physically removes 24 V from TMC2209 | 1 | Fail-safe; firmware-independent |
| Inline blade fuse + holder | 1–2 A starting, adjust after current measurement | 1 | |

## Electronics

| Part | Qty | Notes |
|---|---:|---|
| Teensy 4.1 (no Ethernet) | 1 | Real-time controller; onboard SDIO + microSD |
| Teensy 4.1 terminal block breakout | 1 | Wiring interface |
| TMC2209 stepper driver carrier | 1 + 1 spare | UART config, STEP/DIR drive |
| MicroSD card | 64 GB UHS-I U3 V30 A2 | Data logging |
| Sensirion **SDP810-500Pa** differential pressure | 1 | I²C, 0.5 ms response, ±0.1 Pa zero accuracy |
| AS5600 magnetic encoder breakout + magnet | 1 | Pump-shaft phase logging |
| DS18B20 waterproof temperature probes | 3–5 | Reservoir / inlet / ambient |
| 4.7 kΩ resistor (OneWire pull-up) | 1 | |
| Waveshare 1.5" RGB OLED (128 × 128 SPI) | 1 | Local status display |
| EC11 rotary encoder | 1 | Local UI |
| Tactile buttons | 3 | `prime`, `run`, `stop` |
| Optoisolators / digital isolators | 2 | BNC trigger isolation (in + out) |
| Panel-mount BNC | 1 | Microscope trigger |
| Enclosure, cable glands, strain reliefs | as required | No loose breadboard near microscope |

## Miscellaneous tooling (one-time)

- 8-channel logic analyzer (24 MHz minimum) — STEP frequency / UART / trigger timing validation
- Oscilloscope (analog) — voltage rail and signal-integrity checks
- Multimeter, ferrule crimping kit, heat shrink, 22 AWG silicone wire

## To be filled in during paper-prep

- Per-row vendor links (Mouser / Digi-Key / McMaster / Sigma SKUs).
- Per-row USD pricing snapshot at publication.
- Optional µPIV validation rig parts (camera, laser, tracer beads) for the ~$500 PIV cross-validation station — see `hardware/electronics/README.md` § "µPIV validation rig".
- Calibration-day reference fluid (NIST-traceable glycerol-water) source and frequency.

See `hardware/machining_notes.md` for vendor-facing dimensional notes and `hardware/electronics/README.md` for the full electronics architecture and bench bring-up sequence.
