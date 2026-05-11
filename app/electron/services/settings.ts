/**
 * Persistent settings (main process).
 *
 * Wraps electron-store. Replaces the QSettings-based persistence in the
 * Python v0.1 app.
 */

import Store from "electron-store";

interface CalibrationSettings {
  channelWidthMm: number;
  channelHeightMm: number;
  channelLengthMm: number;
  viscosityPaS: number;
  stepsPerMl: number;
  pumpMaxRpm: number;
  motorStepsPerRev: number;
  microstepping: number;
}

interface SettingsSchema {
  port: string | null;
  operatorName: string;
  calibration: CalibrationSettings;
  lastStudyFolder: string | null;
  sidebarOpen: boolean;
}

const DEFAULTS: SettingsSchema = {
  port: null,
  operatorName: "",
  calibration: {
    channelWidthMm: 24.0,
    channelHeightMm: 0.25,
    channelLengthMm: 50.0,
    viscosityPaS: 0.9e-3,
    stepsPerMl: 6400.0,
    pumpMaxRpm: 200.0,
    motorStepsPerRev: 200,
    microstepping: 16,
  },
  lastStudyFolder: null,
  sidebarOpen: true,
};

export class SettingsService {
  private store: Store<SettingsSchema>;

  constructor() {
    this.store = new Store<SettingsSchema>({
      name: "flow-chamber",
      defaults: DEFAULTS,
    });
  }

  get<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
    return this.store.get(key);
  }

  set<K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]): void {
    this.store.set(key, value);
  }
}
