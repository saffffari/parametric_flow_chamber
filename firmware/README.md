# Flow Chamber Teensy Firmware

Dry bench firmware for the Teensy 4.1 controller. This first target only proves
the Teensy, USB serial, onboard LED, and onboard microSD logging. It does not
drive fluidics.

## Hardware For This Step

- Teensy 4.1
- USB cable
- microSD card in the Teensy 4.1 onboard socket, optional but recommended

Do not connect the pump, TMC2209, or microscope trigger during this first smoke
test.

## Build And Upload

This project uses PlatformIO. A local PlatformIO environment has been created in
`.venv`, so these commands work even if `pio` is not globally installed:

```powershell
cd "D:\research\parametric flow chamber\firmware"
.\.venv\Scripts\pio.exe run -e teensy41
.\.venv\Scripts\pio.exe run -e teensy41 -t upload
.\.venv\Scripts\pio.exe device monitor -b 115200
```

During upload, press the Teensy program button if PlatformIO/Teensy Loader asks
for it.

## Serial Smoke Test

Open the serial monitor at `115200` baud and send:

```text
PING
STATUS?
LOGTEST
STOP
```

Expected responses:

```text
PONG flow_chamber_teensy_smoke 0.1.0
OK name=flow_chamber_teensy_smoke version=0.1.0 state=READY ...
OK wrote SMOKE00.CSV
OK pump outputs disabled
```

The onboard LED should blink twice per second. If a microSD card is present, the
firmware creates `SMOKE00.CSV`, `SMOKE01.CSV`, etc. with heartbeat rows.

## Dry STEP Test

Before wiring the TMC2209 or pump, verify the STEP output with a logic analyzer:

- logic analyzer `GND` to Teensy `GND`
- logic analyzer channel 0 to Teensy pin `2`

Commands:

```text
STEPTEST 100 5000
STATUS?
STEPTEST 1000 5000
STOP
```

`STEPTEST` pulses pin `2`, but keeps the TMC2209 enable pin disabled. The second
argument is duration in milliseconds. The firmware auto-stops after the duration.

## Dry Motor Jog

Only use `JOG` after the TMC2209 is wired correctly, current is set low, the 24 V
rail is fused, and no tubing or liquid is installed.

Initial command:

```text
JOG 100 3000
STOP
```

`JOG` enables the TMC2209 enable pin, pulses STEP, and auto-stops after the
requested duration. Duration is capped at 30 seconds. Use `DIR 0` or `DIR 1` to
change direction, but only while stopped.

## Safety Defaults

Pin 4 is configured as the future TMC2209 `ENABLE` pin and is driven disabled on
boot. Most TMC2209 carrier boards use active-low enable, so this firmware drives
that pin high and reports `pump=disabled` in `STATUS?`.

Command safety behavior:

- `STOP` ends the timer and drives TMC2209 `ENABLE` disabled.
- `STEPTEST` never enables the driver.
- `JOG` is time-limited and auto-stops.
- Direction changes are rejected while step pulses are active.
