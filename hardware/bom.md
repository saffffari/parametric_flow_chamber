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
| IDEX Super Flangeless 1/4-28 fittings | IDEX / Cole-Parmer | as required | Chamber inlet / outlet |

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
| Sensirion **SLF3S-1300F** inline liquid flow sensor | 1 | I²C, direct flow measurement (mL/min) + media temperature on the same frame; PEEK-wetted, biocompatible, CIP-cleaned per `docs/cleaning_protocol.md`; sits in-line between pump and chamber inlet |
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

## Validation rig (one-time per chamber, not in deployed device)

A separate bench instrument used once per chamber build to characterize the SLF3S-1300F response by cross-checking against an independent differential-pressure measurement on the chamber. Lives in the lab toolkit; not shipped with the chamber. See `docs/protocol.md` § "Per-chamber sensor validation" for the procedure and `hardware/electronics/README.md` § "Validation methodology" for the architecture.

| Part | Vendor / P/N | Qty | Notes |
|---|---|---:|---|
| Differential pressure sensor breakout | DFRobot **SEN0343** (All Sensors LWLP5000 ±500 Pa, I²C) | 1 | 3 mm barbed dual ports; pre-mounted on breakout with pull-ups + level shifter |
| Microcontroller (validation host) | Raspberry Pi Pico 2 (or any 3.3 V I²C-capable board) | 1 | Reads SEN0343 over I²C; dumps CSV over USB serial to bench laptop |
| Breadboard, half-size (400 tie-point) | generic | 1 | Mounts Pico + SEN0343 + jumpers |
| 0.22 µm hydrophobic membrane filters | Millipore Millex-FG (PTFE) **SLFG025LS** | 2 | Gas-side barrier between chamber standpipe and SEN0343 |
| Standpipe tubes | borosilicate or acrylic, 4–6 mm ID × 50 mm | 2 | Temporary, attached to chamber pressure-tap ports during validation runs only |
| Silicone tubing, 1/16" ID | Cole-Parmer or equivalent | 1 m | Connects standpipe → Millex-FG → SEN0343 barbs |
| Luer-to-barb adapters | 1/16" or 3/32" barb to female luer | 4 | Mates Millex-FG luer outlets to tubing |
| USB cable, Pico end | USB-A / USB-C to micro-USB or USB-C, depending on Pico revision | 1 | Pico → bench laptop for serial logging |

## To be filled in during paper-prep

- Per-row vendor links (Mouser / Digi-Key / McMaster / Sigma SKUs).
- Per-row USD pricing snapshot at publication.
- Optional µPIV validation rig parts (camera, laser, tracer beads) for the ~$500 PIV cross-validation station — see `hardware/electronics/README.md` § "µPIV validation rig".
- Calibration-day reference fluid (NIST-traceable glycerol-water) source and frequency.

See `hardware/machining_notes.md` for vendor-facing dimensional notes and `hardware/electronics/README.md` for the full electronics architecture and bench bring-up sequence.
