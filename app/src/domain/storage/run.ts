/**
 * Run — one continuous stimulation+recording event.
 *
 * The atomic data unit. One protocol execution from start to finish. Lives on
 * disk as a folder inside a study's `runs/` directory:
 *
 *   runs/20260513_142307_Ti6Al4V-rep2-stim1/
 *     metadata.json           who / what / when / sample
 *     system.json             firmware version, calibration, channel geometry
 *     protocol.json           the protocol that ran
 *     telemetry.csv           time-series flow data
 *     events.csv              triggers, faults, operator-flagged events
 *     thumbnail.png           generated on imaging link (optional)
 *     imaging_link.json       reference to .czi file (optional)
 *     notes.md                free-form operator notes (markdown)
 *
 * Wire-format-compatible with Python v0.1.
 */

import type { Protocol, ProtocolJson } from "./protocol";

// -------------------------------------------------------------------------
// Run state machine (mirrors firmware)
// -------------------------------------------------------------------------

export type RunState =
  | "IDLE"
  | "BASELINE"
  | "RAMPING"
  | "HOLDING"
  | "RECOVERY"
  | "FAULT";

export type StopReason = "" | "completed" | "manual_stop" | "fault";

// -------------------------------------------------------------------------
// Sub-records
// -------------------------------------------------------------------------

export interface RunMetadata {
  id: string;
  label: string;
  groupId: string | null;
  active: boolean;

  operator: string;
  startedAt: string;
  stoppedAt: string;
  durationS: number;
  stopReason: StopReason;

  sampleId: string;
  cellLine: string;
  passage: string;
  platingDate: string;
  substrate: string;
  media: string;

  microscope: string;
  objective: string;
  notesExcerpt: string;

  importSource: ImportSource | null;
}

export interface ImportSource {
  sourceStudy: string;
  importedAt: string;
  originalRunId: string;
}

export interface RunMetadataJson {
  schema?: "flowchamber-run-metadata/v1";
  id: string;
  label: string;
  group_id: string | null;
  active: boolean;
  operator: string;
  started_at: string;
  stopped_at: string;
  duration_s: number;
  stop_reason: string;
  sample_id: string;
  cell_line: string;
  passage: string;
  plating_date: string;
  substrate: string;
  media: string;
  microscope: string;
  objective: string;
  notes_excerpt: string;
  import_source:
    | {
        source_study: string;
        imported_at: string;
        original_run_id: string;
      }
    | null;
}

export interface SystemSnapshot {
  firmwareName: string;
  firmwareVersion: string;
  firmwareCommit: string;

  appVersion: string;
  appCommit: string;

  channelWidthMm: number;
  channelHeightMm: number;
  channelLengthMm: number;
  viscosityPaS: number;
  stepsPerMl: number;
  stepsPerMlCalibratedAt: string;

  pumpModel: string;
  pumpMaxRpm: number;
  motorStepsPerRev: number;
  microstepping: number;
  tmcVrefV: number;
  psuVoltageV: number;
}

export interface SystemSnapshotJson {
  schema?: "flowchamber-system/v1";
  firmware_name: string;
  firmware_version: string;
  firmware_commit: string;
  app_version: string;
  app_commit: string;
  channel_width_mm: number;
  channel_height_mm: number;
  channel_length_mm: number;
  viscosity_pa_s: number;
  steps_per_ml: number;
  steps_per_ml_calibrated_at: string;
  pump_model: string;
  pump_max_rpm: number;
  motor_steps_per_rev: number;
  microstepping: number;
  tmc_vref_v: number;
  psu_voltage_v: number;
}

export interface ImagingLink {
  externalPath: string;
  sha256: string;
  sizeBytes: number;
  format: "czi" | "tiff" | "ome-tiff" | string;
  acquiredAt: string;
  triggerOffsetUs: number;
}

export interface ImagingLinkJson {
  schema?: "flowchamber-imaging-link/v1";
  external_path: string;
  sha256: string;
  size_bytes: number;
  format: string;
  acquired_at: string;
  trigger_offset_us: number;
}

// -------------------------------------------------------------------------
// Compose
// -------------------------------------------------------------------------

export interface Run {
  folder: string;
  metadata: RunMetadata;
  system: SystemSnapshot;
  protocol: Protocol;
  imaging: ImagingLink | null;
  notes: string;
}

// -------------------------------------------------------------------------
// CSV column definitions (telemetry.csv)
// -------------------------------------------------------------------------

export const TELEMETRY_COLUMNS = [
  "timestamp_us",
  "run_time_s",
  "state",
  "commanded_shear_pa",
  "commanded_flow_ml_min",
  "commanded_step_rate_hz",
  "temp_reservoir_c",
  "trigger_count",
  "fault_code",
] as const;

export type TelemetryColumn = (typeof TELEMETRY_COLUMNS)[number];

export const TELEMETRY_HEADER = TELEMETRY_COLUMNS.join(",") + "\n";
export const EVENTS_HEADER = "timestamp_us,event_type,detail\n";

// -------------------------------------------------------------------------
// Folder name generation
// -------------------------------------------------------------------------

export function runFolderName(startedAtIso: string, label: string): string {
  let stamp: string;
  try {
    const dt = new Date(startedAtIso);
    if (isNaN(dt.getTime())) throw new Error("invalid date");
    stamp =
      dt.getUTCFullYear().toString().padStart(4, "0") +
      (dt.getUTCMonth() + 1).toString().padStart(2, "0") +
      dt.getUTCDate().toString().padStart(2, "0") +
      "_" +
      dt.getUTCHours().toString().padStart(2, "0") +
      dt.getUTCMinutes().toString().padStart(2, "0") +
      dt.getUTCSeconds().toString().padStart(2, "0");
  } catch {
    stamp = nowStamp();
  }
  const safe = label
    .split("")
    .map((c) => (/[A-Za-z0-9_-]/.test(c) ? c : "_"))
    .join("")
    .slice(0, 64);
  return `${stamp}_${safe}`;
}

function nowStamp(): string {
  const d = new Date();
  return (
    d.getUTCFullYear().toString().padStart(4, "0") +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    d.getUTCDate().toString().padStart(2, "0") +
    "_" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    d.getUTCSeconds().toString().padStart(2, "0")
  );
}

// -------------------------------------------------------------------------
// JSON serialization
// -------------------------------------------------------------------------

export function metadataToJson(m: RunMetadata): RunMetadataJson {
  return {
    schema: "flowchamber-run-metadata/v1",
    id: m.id,
    label: m.label,
    group_id: m.groupId,
    active: m.active,
    operator: m.operator,
    started_at: m.startedAt,
    stopped_at: m.stoppedAt,
    duration_s: m.durationS,
    stop_reason: m.stopReason,
    sample_id: m.sampleId,
    cell_line: m.cellLine,
    passage: m.passage,
    plating_date: m.platingDate,
    substrate: m.substrate,
    media: m.media,
    microscope: m.microscope,
    objective: m.objective,
    notes_excerpt: m.notesExcerpt,
    import_source: m.importSource
      ? {
          source_study: m.importSource.sourceStudy,
          imported_at: m.importSource.importedAt,
          original_run_id: m.importSource.originalRunId,
        }
      : null,
  };
}

export function metadataFromJson(j: RunMetadataJson): RunMetadata {
  return {
    id: j.id,
    label: j.label,
    groupId: j.group_id,
    active: j.active ?? true,
    operator: j.operator ?? "",
    startedAt: j.started_at ?? "",
    stoppedAt: j.stopped_at ?? "",
    durationS: j.duration_s ?? 0,
    stopReason: (j.stop_reason ?? "") as StopReason,
    sampleId: j.sample_id ?? "",
    cellLine: j.cell_line ?? "MLO-Y4",
    passage: j.passage ?? "",
    platingDate: j.plating_date ?? "",
    substrate: j.substrate ?? "glass",
    media: j.media ?? "alpha-MEM + 10% FBS",
    microscope: j.microscope ?? "",
    objective: j.objective ?? "",
    notesExcerpt: j.notes_excerpt ?? "",
    importSource: j.import_source
      ? {
          sourceStudy: j.import_source.source_study,
          importedAt: j.import_source.imported_at,
          originalRunId: j.import_source.original_run_id,
        }
      : null,
  };
}

export function systemToJson(s: SystemSnapshot): SystemSnapshotJson {
  return {
    schema: "flowchamber-system/v1",
    firmware_name: s.firmwareName,
    firmware_version: s.firmwareVersion,
    firmware_commit: s.firmwareCommit,
    app_version: s.appVersion,
    app_commit: s.appCommit,
    channel_width_mm: s.channelWidthMm,
    channel_height_mm: s.channelHeightMm,
    channel_length_mm: s.channelLengthMm,
    viscosity_pa_s: s.viscosityPaS,
    steps_per_ml: s.stepsPerMl,
    steps_per_ml_calibrated_at: s.stepsPerMlCalibratedAt,
    pump_model: s.pumpModel,
    pump_max_rpm: s.pumpMaxRpm,
    motor_steps_per_rev: s.motorStepsPerRev,
    microstepping: s.microstepping,
    tmc_vref_v: s.tmcVrefV,
    psu_voltage_v: s.psuVoltageV,
  };
}

export function systemFromJson(j: SystemSnapshotJson): SystemSnapshot {
  return {
    firmwareName: j.firmware_name ?? "",
    firmwareVersion: j.firmware_version ?? "",
    firmwareCommit: j.firmware_commit ?? "",
    appVersion: j.app_version ?? "",
    appCommit: j.app_commit ?? "",
    channelWidthMm: j.channel_width_mm ?? 24,
    channelHeightMm: j.channel_height_mm ?? 0.25,
    channelLengthMm: j.channel_length_mm ?? 50,
    viscosityPaS: j.viscosity_pa_s ?? 0.9e-3,
    stepsPerMl: j.steps_per_ml ?? 6400,
    stepsPerMlCalibratedAt: j.steps_per_ml_calibrated_at ?? "",
    pumpModel: j.pump_model ?? "Kamoer KCS",
    pumpMaxRpm: j.pump_max_rpm ?? 200,
    motorStepsPerRev: j.motor_steps_per_rev ?? 200,
    microstepping: j.microstepping ?? 16,
    tmcVrefV: j.tmc_vref_v ?? 0.3,
    psuVoltageV: j.psu_voltage_v ?? 24,
  };
}

export function makeRunMetadata(label = "untitled run"): RunMetadata {
  return {
    id: cryptoRandomHex(16),
    label,
    groupId: null,
    active: true,
    operator: "",
    startedAt: new Date().toISOString(),
    stoppedAt: "",
    durationS: 0,
    stopReason: "",
    sampleId: "",
    cellLine: "MLO-Y4",
    passage: "",
    platingDate: "",
    substrate: "glass",
    media: "alpha-MEM + 10% FBS",
    microscope: "",
    objective: "",
    notesExcerpt: "",
    importSource: null,
  };
}

export function makeSystemSnapshot(
  overrides: Partial<SystemSnapshot> = {},
): SystemSnapshot {
  return {
    firmwareName: "",
    firmwareVersion: "",
    firmwareCommit: "",
    appVersion: "",
    appCommit: "",
    channelWidthMm: 24,
    channelHeightMm: 0.25,
    channelLengthMm: 50,
    viscosityPaS: 0.9e-3,
    stepsPerMl: 6400,
    stepsPerMlCalibratedAt: "",
    pumpModel: "Kamoer KCS",
    pumpMaxRpm: 200,
    motorStepsPerRev: 200,
    microstepping: 16,
    tmcVrefV: 0.3,
    psuVoltageV: 24,
    ...overrides,
  };
}

export type { Protocol, ProtocolJson };

function cryptoRandomHex(byteLen: number): string {
  const buf = new Uint8Array(byteLen);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < byteLen; i += 1) buf[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
