// =============================================================================
// display.h — bench OLED status readout
//
// Drives a Waveshare 1.5" monochrome OLED (SSD1327, 128×128, 4-bit grayscale)
// over the Teensy's default I²C bus (pin 18 SDA / pin 19 SCL, Wire instance).
//
// Decoupling design: main.cpp keeps its globals in an anonymous namespace
// (internal linkage). The display module never reaches in. Instead, the
// caller populates a `DisplayData` snapshot and passes it to display_tick().
// ~24 bytes/tick, negligible.
//
// Caller responsibilities:
//   - Call display_setup() once from setup() after Wire begins.
//   - Each main-loop iteration: populate a DisplayData and call display_tick().
//
// Hard constraints:
//   - All I²C transfers happen inside display_tick() in the main-loop context.
//     NEVER call display_* from an ISR — the SSD1327 frame transfer is ~5–10 ms
//     and would shred STEP-pulse timing if it tried to share a context with
//     stepPulseIsr.
// =============================================================================

#pragma once

#include <stdint.h>

// Snapshot of firmware state for the display. Caller fills, display reads.
struct DisplayData {
  const char* state_name;    // e.g. "READY" / "MOTORJOG" / "FAULT"
  uint32_t step_rate_hz;     // current commanded STEP rate
  uint32_t step_count;       // pulses since boot
  uint32_t trigger_count;    // microscope-trigger rising edges
  bool dir_forward;          // true = forward, false = reverse
  uint32_t boot_millis;      // millis() value at boot, for uptime calc
};

// Initialize the OLED. Call once after Wire.begin(). Returns true on success;
// false means the SSD1327 didn't ACK on I²C (check wiring / address jumper).
bool display_setup();

// Render-tick. Call from the main loop with a freshly-populated snapshot.
// Internally rate-limited; cheap when the redraw interval hasn't elapsed yet.
void display_tick(uint32_t now_ms, const DisplayData& data);

// Force the next display_tick() to redraw on the next call (e.g. after a
// state change you want reflected immediately rather than after the throttle).
void display_invalidate();
