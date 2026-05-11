#include <Arduino.h>
#include <SD.h>
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "hardware_config.h"

namespace {

constexpr uint32_t SERIAL_BAUD = 115200;
constexpr uint32_t SERIAL_WAIT_MS = 1500;
constexpr uint32_t HEARTBEAT_INTERVAL_MS = 500;
constexpr uint32_t LOG_INTERVAL_MS = 1000;
constexpr uint32_t LOG_FLUSH_ROWS = 5;
constexpr uint32_t MIN_STEP_RATE_HZ = 1;
constexpr uint32_t MAX_STEP_RATE_HZ = 20000;
constexpr uint32_t DEFAULT_TEST_DURATION_MS = 5000;
constexpr uint32_t MAX_JOG_DURATION_MS = 30000;
constexpr char FIRMWARE_NAME[] = "flow_chamber_teensy";
constexpr char FIRMWARE_VERSION[] = "0.4.0";

enum class State {
  Booting,
  Ready,
  StepTest,
  MotorJog,
  Fault,
};

State state = State::Booting;
bool sdReady = false;
bool ledOn = false;
bool directionForward = true;
uint32_t bootMillis = 0;
uint32_t lastHeartbeatMs = 0;
uint32_t lastLogMs = 0;
uint32_t logRows = 0;
uint32_t stepAutoStopAtMs = 0;
char logPath[16] = "";
char commandBuffer[96] = "";
size_t commandLength = 0;
File logFile;
IntervalTimer stepTimer;
volatile bool stepPinHigh = false;
volatile bool driverOutputEnabled = false;
volatile uint32_t activeStepRateHz = 0;
volatile uint32_t stepCount = 0;
volatile uint32_t triggerInCount = 0;
uint32_t triggerOutCount = 0;

const char* stateName(State value) {
  switch (value) {
    case State::Booting:
      return "BOOTING";
    case State::Ready:
      return "READY";
    case State::StepTest:
      return "STEPTEST";
    case State::MotorJog:
      return "MOTORJOG";
    case State::Fault:
      return "FAULT";
  }
  return "UNKNOWN";
}

void setPumpDisabled() {
  stepTimer.end();
  stepPinHigh = false;
  activeStepRateHz = 0;
  driverOutputEnabled = false;
  digitalWrite(hw::PIN_TMC_STEP, LOW);
  digitalWrite(hw::PIN_TMC_DIR, LOW);
  digitalWrite(hw::PIN_TMC_ENABLE, hw::TMC_DISABLE_LEVEL);
  stepAutoStopAtMs = 0;
}

void stepPulseIsr() {
  stepPinHigh = !stepPinHigh;
  digitalWriteFast(hw::PIN_TMC_STEP, stepPinHigh ? HIGH : LOW);
  if (stepPinHigh) {
    stepCount++;
  }
}

// ISR for incoming microscope frame triggers on PIN_TRIGGER_IN.
// Increments a counter only — keeps ISR minimal (no SD, no malloc, no blocking).
void triggerInIsr() {
  triggerInCount++;
}

bool startStepOutput(uint32_t stepRateHz, uint32_t durationMs, bool enableDriver) {
  if (stepRateHz < MIN_STEP_RATE_HZ || stepRateHz > MAX_STEP_RATE_HZ) {
    return false;
  }

  stepTimer.end();
  stepPinHigh = false;
  activeStepRateHz = stepRateHz;
  stepCount = 0;
  driverOutputEnabled = enableDriver;

  digitalWrite(hw::PIN_TMC_STEP, LOW);
  digitalWrite(hw::PIN_TMC_DIR, directionForward ? LOW : HIGH);
  digitalWrite(hw::PIN_TMC_ENABLE, enableDriver ? hw::TMC_ENABLE_ACTIVE_LEVEL : hw::TMC_DISABLE_LEVEL);

  const uint32_t halfPeriodUs = 500000UL / stepRateHz;
  if (!stepTimer.begin(stepPulseIsr, halfPeriodUs)) {
    setPumpDisabled();
    return false;
  }

  // durationMs == 0 is the continuous-run sentinel: leave stepAutoStopAtMs at
  // 0 so updateAutoStop() never triggers. Halt with explicit STOP or RATE 0.
  stepAutoStopAtMs = (durationMs > 0) ? (millis() + durationMs) : 0;
  return true;
}

void printHelp() {
  Serial.println("OK commands:");
  Serial.println("  PING                    -> liveness check");
  Serial.println("  STATUS?                 -> board, SD, log, step, trigger status");
  Serial.println("  LOGTEST                 -> append one manual SD log row");
  Serial.println("  SDTEST                  -> reopen/create SD smoke log");
  Serial.println("  DIR 0|1                 -> set future motor direction");
  Serial.println("  STEPTEST <hz> [ms]      -> pulse STEP with driver disabled");
  Serial.println("  JOG <hz> [ms|0]         -> driver enabled; ms=0 = continuous (STOP to halt)");
  Serial.println("  RATE <hz>               -> live update step rate during active run");
  Serial.println("  TRIGGER [us]            -> fire BNC trigger OUT pulse (default 100us)");
  Serial.println("  TRIGGER_RESET           -> zero the trigger-in counter");
  Serial.println("  STOP                    -> force pump outputs disabled");
  Serial.println("  HELP                    -> show this list");
}

bool appendLogRow(const char* eventName) {
  if (!sdReady || !logFile) {
    return false;
  }

  const uint32_t now = millis();
  logFile.print(now);
  logFile.print(',');
  logFile.print(now - bootMillis);
  logFile.print(',');
  logFile.print(stateName(state));
  logFile.print(',');
  logFile.print(eventName);
  logFile.print(',');
  logFile.print(ledOn ? 1 : 0);
  logFile.print(',');
  logFile.print(activeStepRateHz);
  logFile.print(',');
  logFile.print(stepCount);
  logFile.print(',');
  logFile.println(driverOutputEnabled ? 1 : 0);

  logRows++;
  if ((logRows % LOG_FLUSH_ROWS) == 0 || strcmp(eventName, "manual") == 0) {
    logFile.flush();
  }

  return true;
}

void stopStepOutput(const char* eventName) {
  setPumpDisabled();
  state = State::Ready;
  appendLogRow(eventName);
}

void closeLog() {
  if (logFile) {
    logFile.flush();
    logFile.close();
  }
}

bool openSmokeLog() {
  closeLog();
  sdReady = false;
  logRows = 0;
  logPath[0] = '\0';

  if (!SD.begin(hw::PIN_SD_CARD)) {
    return false;
  }

  bool foundLogSlot = false;
  for (uint8_t index = 0; index < 100; index++) {
    snprintf(logPath, sizeof(logPath), "SMOKE%02u.CSV", index);
    if (!SD.exists(logPath)) {
      foundLogSlot = true;
      break;
    }
  }

  if (!foundLogSlot) {
    logPath[0] = '\0';
    return false;
  }

  logFile = SD.open(logPath, FILE_WRITE);
  if (!logFile) {
    return false;
  }

  logFile.println("timestamp_ms,uptime_ms,state,event,led,step_rate_hz,step_count,driver_enabled");
  logFile.flush();
  sdReady = true;
  appendLogRow("boot");
  return true;
}

void printStatus() {
  Serial.print("OK name=");
  Serial.print(FIRMWARE_NAME);
  Serial.print(" version=");
  Serial.print(FIRMWARE_VERSION);
  Serial.print(" state=");
  Serial.print(stateName(state));
  Serial.print(" uptime_ms=");
  Serial.print(millis() - bootMillis);
  Serial.print(" sd=");
  Serial.print(sdReady ? "ready" : "missing");
  Serial.print(" log=");
  Serial.print(sdReady ? logPath : "none");
  Serial.print(" rows=");
  Serial.print(logRows);
  Serial.print(" step_rate_hz=");
  Serial.print(activeStepRateHz);
  Serial.print(" step_count=");
  Serial.print(stepCount);
  Serial.print(" dir=");
  Serial.print(directionForward ? 1 : 0);
  Serial.print(" driver_enabled=");
  Serial.print(driverOutputEnabled ? 1 : 0);
  Serial.print(" pump_enable_pin=");
  Serial.print(hw::PIN_TMC_ENABLE);
  Serial.print(" trigger_in_count=");
  Serial.print(triggerInCount);
  Serial.print(" trigger_out_count=");
  Serial.print(triggerOutCount);
  Serial.print(" pump=");
  Serial.println(driverOutputEnabled ? "enabled" : "disabled");
}

uint32_t parseUnsignedArg(uint32_t fallback) {
  char* token = strtok(nullptr, " \t");
  if (token == nullptr) {
    return fallback;
  }

  char* end = nullptr;
  const unsigned long parsed = strtoul(token, &end, 10);
  if (end == token || *end != '\0') {
    return fallback;
  }

  return static_cast<uint32_t>(parsed);
}

uint32_t constrainedDuration(uint32_t durationMs) {
  if (durationMs == 0) {
    return DEFAULT_TEST_DURATION_MS;
  }
  if (durationMs > MAX_JOG_DURATION_MS) {
    return MAX_JOG_DURATION_MS;
  }
  return durationMs;
}

void handleCommand(char* command) {
  while (*command == ' ' || *command == '\t') {
    command++;
  }

  for (char* cursor = command; *cursor != '\0'; cursor++) {
    *cursor = static_cast<char>(toupper(*cursor));
  }

  char* verb = strtok(command, " \t");
  if (verb == nullptr) {
    return;
  }

  if (strcmp(verb, "PING") == 0) {
    Serial.print("PONG ");
    Serial.print(FIRMWARE_NAME);
    Serial.print(" ");
    Serial.println(FIRMWARE_VERSION);
  } else if (strcmp(verb, "STATUS") == 0 || strcmp(verb, "STATUS?") == 0) {
    printStatus();
  } else if (strcmp(verb, "HELP") == 0 || strcmp(verb, "?") == 0) {
    printHelp();
  } else if (strcmp(verb, "STOP") == 0) {
    stopStepOutput("stop");
    Serial.println("OK pump outputs disabled");
  } else if (strcmp(verb, "LOGTEST") == 0) {
    if (appendLogRow("manual")) {
      Serial.print("OK wrote ");
      Serial.println(logPath);
    } else {
      Serial.println("ERR SD log is not open");
    }
  } else if (strcmp(verb, "SDTEST") == 0) {
    if (openSmokeLog()) {
      Serial.print("OK SD log opened ");
      Serial.println(logPath);
    } else {
      Serial.println("ERR SD init/open failed");
    }
  } else if (strcmp(verb, "DIR") == 0) {
    if (activeStepRateHz != 0) {
      Serial.println("ERR stop before changing direction");
      return;
    }

    const uint32_t direction = parseUnsignedArg(directionForward ? 1 : 0);
    if (direction > 1) {
      Serial.println("ERR direction must be 0 or 1");
      return;
    }

    directionForward = direction == 1;
    digitalWrite(hw::PIN_TMC_DIR, directionForward ? LOW : HIGH);
    appendLogRow("dir");
    Serial.print("OK dir=");
    Serial.println(directionForward ? 1 : 0);
  } else if (strcmp(verb, "STEPTEST") == 0) {
    const uint32_t stepRateHz = parseUnsignedArg(0);
    const uint32_t durationMs = constrainedDuration(parseUnsignedArg(DEFAULT_TEST_DURATION_MS));
    if (!startStepOutput(stepRateHz, durationMs, false)) {
      Serial.println("ERR STEPTEST range is 1..20000 Hz");
      return;
    }

    state = State::StepTest;
    appendLogRow("steptest");
    Serial.print("OK steptest_hz=");
    Serial.print(stepRateHz);
    Serial.print(" duration_ms=");
    Serial.println(durationMs);
  } else if (strcmp(verb, "JOG") == 0) {
    const uint32_t stepRateHz = parseUnsignedArg(0);
    // Default duration is 0 (continuous). Run the duration through the upper
    // bound only when explicitly nonzero — preserves the 30 s safety cap on
    // bounded jogs while letting `JOG <hz> 0` (or `JOG <hz>`) run indefinitely.
    const uint32_t rawDurationMs = parseUnsignedArg(0);
    const uint32_t durationMs = (rawDurationMs == 0) ? 0 : constrainedDuration(rawDurationMs);
    if (!startStepOutput(stepRateHz, durationMs, true)) {
      Serial.println("ERR JOG range is 1..20000 Hz");
      return;
    }

    state = State::MotorJog;
    appendLogRow("jog");
    Serial.print("OK jog_hz=");
    Serial.print(stepRateHz);
    Serial.print(" duration_ms=");
    Serial.print(durationMs);
    Serial.println(" driver_enabled=1");
  } else if (strcmp(verb, "RATE") == 0) {
    // Live step-rate update during an active run. Updates the IntervalTimer
    // period in place — no STEP-edge restart click — so the operator can
    // dial speed continuously while the pump is spinning.
    const uint32_t stepRateHz = parseUnsignedArg(0);
    if (stepRateHz < MIN_STEP_RATE_HZ || stepRateHz > MAX_STEP_RATE_HZ) {
      Serial.println("ERR RATE range is 1..20000 Hz");
      return;
    }
    if (activeStepRateHz == 0) {
      Serial.println("ERR no active run; start with JOG first");
      return;
    }
    const uint32_t halfPeriodUs = 500000UL / stepRateHz;
    // IntervalTimer::update() returns void on Teensy 4.x core; it adjusts the
    // already-running timer's period in place and cannot fail at this level.
    // Failure modes (timer not running, etc.) are guarded above by the
    // activeStepRateHz == 0 check.
    stepTimer.update(halfPeriodUs);
    activeStepRateHz = stepRateHz;
    appendLogRow("rate");
    Serial.print("OK rate_hz=");
    Serial.println(stepRateHz);
  } else if (strcmp(verb, "TRIGGER") == 0) {
    // Fire a pulse on PIN_TRIGGER_OUT for the requested duration in microseconds.
    // Used to drive the microscope BNC trigger via the isolated trigger board.
    // Default pulse 100us — well above the SDP810 / typical microscope minimum
    // detectable pulse width and short enough not to disturb the main loop.
    constexpr uint32_t MAX_TRIGGER_US = 10000;  // 10ms cap
    constexpr uint32_t DEFAULT_TRIGGER_US = 100;
    uint32_t pulseUs = parseUnsignedArg(DEFAULT_TRIGGER_US);
    if (pulseUs == 0 || pulseUs > MAX_TRIGGER_US) {
      Serial.println("ERR TRIGGER pulse must be 1..10000 us");
      return;
    }
    digitalWriteFast(hw::PIN_TRIGGER_OUT, HIGH);
    delayMicroseconds(pulseUs);
    digitalWriteFast(hw::PIN_TRIGGER_OUT, LOW);
    triggerOutCount++;
    appendLogRow("trigger_out");
    Serial.print("OK trigger_out_us=");
    Serial.print(pulseUs);
    Serial.print(" trigger_out_count=");
    Serial.println(triggerOutCount);
  } else if (strcmp(verb, "TRIGGER_RESET") == 0) {
    noInterrupts();
    triggerInCount = 0;
    interrupts();
    triggerOutCount = 0;
    appendLogRow("trigger_reset");
    Serial.println("OK trigger counters reset");
  } else {
    Serial.print("ERR unknown command: ");
    Serial.println(verb);
  }
}

void pollSerial() {
  while (Serial.available() > 0) {
    const char input = static_cast<char>(Serial.read());

    if (input == '\r') {
      continue;
    }

    if (input == '\n') {
      commandBuffer[commandLength] = '\0';
      handleCommand(commandBuffer);
      commandLength = 0;
      return;
    }

    if (commandLength < sizeof(commandBuffer) - 1) {
      commandBuffer[commandLength++] = input;
    } else {
      commandLength = 0;
      Serial.println("ERR command too long");
    }
  }
}

void updateHeartbeat() {
  const uint32_t now = millis();
  if (now - lastHeartbeatMs < HEARTBEAT_INTERVAL_MS) {
    return;
  }

  lastHeartbeatMs = now;
  ledOn = !ledOn;
  digitalWrite(hw::PIN_LED, ledOn ? HIGH : LOW);
}

void updatePeriodicLog() {
  const uint32_t now = millis();
  if (now - lastLogMs < LOG_INTERVAL_MS) {
    return;
  }

  lastLogMs = now;
  appendLogRow("heartbeat");
}

void updateAutoStop() {
  if (stepAutoStopAtMs == 0) {
    return;
  }

  if (static_cast<int32_t>(millis() - stepAutoStopAtMs) >= 0) {
    stopStepOutput("auto_stop");
    Serial.println("OK auto stop");
  }
}

}  // namespace

void setup() {
  bootMillis = millis();

  pinMode(hw::PIN_LED, OUTPUT);
  pinMode(hw::PIN_TMC_STEP, OUTPUT);
  pinMode(hw::PIN_TMC_DIR, OUTPUT);
  pinMode(hw::PIN_TMC_ENABLE, OUTPUT);
  pinMode(hw::PIN_TRIGGER_OUT, OUTPUT);
  pinMode(hw::PIN_TRIGGER_IN, INPUT_PULLUP);

  digitalWrite(hw::PIN_TRIGGER_OUT, LOW);
  setPumpDisabled();

  // Microscope frame trigger: count rising edges on the isolated input.
  attachInterrupt(digitalPinToInterrupt(hw::PIN_TRIGGER_IN), triggerInIsr, RISING);

  Serial.begin(SERIAL_BAUD);
  while (!Serial && millis() - bootMillis < SERIAL_WAIT_MS) {
    updateHeartbeat();
  }

  Serial.println();
  Serial.print("BOOT ");
  Serial.print(FIRMWARE_NAME);
  Serial.print(" ");
  Serial.println(FIRMWARE_VERSION);
  Serial.println("BOOT pump outputs disabled");

  if (openSmokeLog()) {
    Serial.print("BOOT SD log opened ");
    Serial.println(logPath);
  } else {
    Serial.println("BOOT SD log unavailable; insert/format microSD and send SDTEST");
  }

  state = State::Ready;
  appendLogRow("ready");
  printHelp();
}

void loop() {
  pollSerial();
  updateHeartbeat();
  updatePeriodicLog();
  updateAutoStop();
}
