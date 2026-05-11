#pragma once

#include <Arduino.h>

namespace hw {

constexpr uint8_t PIN_LED = LED_BUILTIN;

// Keep the first pump driver physically safe during bring-up.
// Most TMC2209 carrier boards use active-low ENABLE, so HIGH means disabled.
constexpr uint8_t PIN_TMC_STEP = 2;
constexpr uint8_t PIN_TMC_DIR = 3;
constexpr uint8_t PIN_TMC_ENABLE = 4;
constexpr bool TMC_ENABLE_ACTIVE_LEVEL = LOW;
constexpr bool TMC_DISABLE_LEVEL = !TMC_ENABLE_ACTIVE_LEVEL;

constexpr uint8_t PIN_TRIGGER_OUT = 5;
constexpr uint8_t PIN_TRIGGER_IN = 6;

constexpr uint8_t PIN_OLED_RST = 8;
constexpr uint8_t PIN_OLED_DC = 9;
constexpr uint8_t PIN_OLED_CS = 10;

constexpr uint8_t PIN_ONEWIRE = 20;

constexpr uint8_t PIN_ENCODER_A = 24;
constexpr uint8_t PIN_ENCODER_B = 25;
constexpr uint8_t PIN_ENCODER_SW = 26;

constexpr int PIN_SD_CARD = BUILTIN_SDCARD;

}  // namespace hw
