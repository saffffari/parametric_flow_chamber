// =============================================================================
// display.cpp — bench OLED status readout (SSD1327 128×128 over I²C)
//
// Layout (top to bottom):
//   - Row 0 (small, ~10 px): header "FLOW CHAMBER"
//   - Rows 1–2 (large):      firmware state name (READY / MOTORJOG / FAULT / …)
//   - Rows 3–4 (large):      commanded STEP rate, e.g.  "3584 Hz"
//   - Row 5 (small):         step count (raw pulses since boot)
//   - Row 6 (small, right):  uptime MM:SS
//   - Row 7 (small):         direction + trigger-in count
//
// The U8g2 full-buffer constructor (the `_F_` in the name) renders to an
// internal RAM buffer and flushes it as one I²C transaction in sendBuffer().
// That keeps the per-tick I²C window predictable (~7 ms at 400 kHz fast-mode).
//
// State coupling: zero. main.cpp's globals are encapsulated in an anonymous
// namespace; the caller hands us a DisplayData snapshot each tick.
// =============================================================================

#include "display.h"

#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>

// Waveshare 1.5" mono OLED. The "_WS_" variant matches Waveshare's panel
// init sequence; if the rendered output looks shifted or has the wrong
// orientation, try _MIDAS_ or _EA_W128128 instead — same controller,
// slightly different reset/segment-remap defaults per vendor.
static U8G2_SSD1327_WS_128X128_F_HW_I2C display(U8G2_R0, /*reset=*/U8X8_PIN_NONE);

static uint32_t s_lastDrawMs = 0;
static bool s_inited = false;
static bool s_forceRedraw = false;

// Update interval. 100 ms = 10 Hz. Frame transfer at 400 kHz fast-mode I²C
// is ~7 ms; this leaves 93 ms of main-loop budget per redraw period.
static constexpr uint32_t REDRAW_INTERVAL_MS = 100;

bool display_setup() {
  // Caller is expected to have called Wire.begin() already in setup(). U8g2's
  // begin() uses Wire by default for HW_I2C constructors.
  Wire.setClock(400000);  // fast-mode; SSD1327 datasheet allows up to 400 kHz
  if (!display.begin()) {
    return false;
  }
  display.setBusClock(400000);
  display.setContrast(180);  // 0–255; 180 is comfortable in bench lighting
  s_inited = true;
  s_forceRedraw = true;
  return true;
}

void display_invalidate() {
  s_forceRedraw = true;
}

// Returns a pointer to a static "MM:SS" buffer formatted from `seconds`.
// Truncates HH cleanly; bench sessions don't run that long.
static const char* formatMMSS(uint32_t seconds) {
  static char buf[8];
  uint32_t m = (seconds / 60) % 100;  // clamp to 99 min display
  uint32_t s = seconds % 60;
  snprintf(buf, sizeof(buf), "%02lu:%02lu",
           static_cast<unsigned long>(m),
           static_cast<unsigned long>(s));
  return buf;
}

void display_tick(uint32_t now_ms, const DisplayData& data) {
  if (!s_inited) return;

  if (!s_forceRedraw && (now_ms - s_lastDrawMs) < REDRAW_INTERVAL_MS) {
    return;
  }
  s_lastDrawMs = now_ms;
  s_forceRedraw = false;

  const uint32_t uptimeS = (now_ms - data.boot_millis) / 1000UL;

  display.clearBuffer();

  // ---- Header ----
  display.setFont(u8g2_font_6x10_tr);
  display.drawStr(0, 8, "FLOW CHAMBER");

  // ---- State (large) ----
  display.setFont(u8g2_font_logisoso24_tr);
  display.drawStr(0, 36, data.state_name ? data.state_name : "?");

  // ---- STEP rate (large) ----
  char rateBuf[16];
  snprintf(rateBuf, sizeof(rateBuf), "%lu Hz",
           static_cast<unsigned long>(data.step_rate_hz));
  display.drawStr(0, 70, rateBuf);

  // ---- Step count + uptime row ----
  display.setFont(u8g2_font_6x10_tr);
  char rowBuf[24];
  snprintf(rowBuf, sizeof(rowBuf), "steps %lu",
           static_cast<unsigned long>(data.step_count));
  display.drawStr(0, 90, rowBuf);
  display.drawStr(80, 90, formatMMSS(uptimeS));

  // ---- Direction + trigger-in count footer ----
  snprintf(rowBuf, sizeof(rowBuf), "dir %s  trig %lu",
           data.dir_forward ? "FWD" : "REV",
           static_cast<unsigned long>(data.trigger_count));
  display.drawStr(0, 110, rowBuf);

  display.sendBuffer();
}
