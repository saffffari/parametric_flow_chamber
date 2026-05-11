/**
 * Types shared between the main process and the renderer (preload bridge).
 *
 * Keep this module pure — type declarations only, no runtime imports of
 * Node-only modules. Both bundles import these to keep the IPC contract
 * type-safe across processes.
 */

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type TelemetryRunState =
  | "IDLE"
  | "BASELINE"
  | "RAMPING"
  | "HOLDING"
  | "RECOVERY"
  | "FAULT";

export interface TelemetrySample {
  timestampUs: number;
  runTimeS: number;
  state: TelemetryRunState;
  commandedShearPa: number;
  commandedFlowMlMin: number;
  commandedStepRateHz: number;
  tempReservoirC: number;
  triggerCount: number;
  faultCode: number;
}

export interface FaultEvent {
  timestampUs: number;
  code: number;
  description: string;
}

export interface PortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

export interface RunSpec {
  meanPa: number;
  amplitudePa: number;
  frequencyHz: number;
  waveform: "dc" | "sine" | "square" | "sawtooth";
  durationS: number;
  rampInS: number;
  rampOutS: number;
  /** Pre-computed by renderer using the active CalibrationConstants. */
  stepRateHz: number;
}

// -------------------------------------------------------------------------
// Folder-based study schemas (renderer ↔ main)
// -------------------------------------------------------------------------

export interface StudyMetaJson {
  schema?: "flowchamber-study/v1";
  id: string;
  title: string;
  authors: string;
  affiliation: string;
  target_journal: string;
  hypothesis: string;
  status: string;
  doi: string;
  created_at: string;
  last_modified_at: string;
}

export interface GroupJson {
  id: string;
  name: string;
  color: string;
  purpose: string;
}

export interface StudyJson {
  schema: "flowchamber-study/v1";
  meta: StudyMetaJson;
  groups: GroupJson[];
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
  import_source: {
    source_study: string;
    imported_at: string;
    original_run_id: string;
  } | null;
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

export interface ProtocolJson {
  schema?: "flowchamber-protocol/v1";
  name: string;
  mean_pa: number;
  amplitude_pa: number;
  frequency_hz: number;
  waveform: "dc" | "sine" | "square" | "sawtooth";
  phase_deg: number;
  duration_s: number;
  ramp_in_s: number;
  ramp_out_s: number;
}

export interface ImagingLinkJson {
  schema?: "flowchamber-imaging-link/v1";
  /** Absolute path to the imaging file (e.g., a Zeiss .czi from the LSM 880). */
  external_path: string;
  /** Optional content hash. Empty when not computed (default; multi-GB CZIs are slow). */
  sha256: string;
  /** File size in bytes at link-time, 0 if file did not exist when linked. */
  size_bytes: number;
  /** "czi", "tiff", "ome-tiff", or whatever extension the file has. */
  format: string;
  /** ISO timestamp of file mtime at link-time, "" if file did not exist. */
  acquired_at: string;
  /** Trigger-to-acquisition offset in microseconds. 0 until correlation tooling lands. */
  trigger_offset_us: number;
}

// -------------------------------------------------------------------------
// IPC channel names (single source of truth — used by both sides)
// -------------------------------------------------------------------------

export const IPC_CHANNELS = {
  // App
  APP_GET_VERSION: "app:get-version",
  APP_GET_PLATFORM: "app:get-platform",
  APP_OPEN_PATH: "app:open-path",

  // Serial
  SERIAL_LIST_PORTS: "serial:list-ports",
  SERIAL_CONNECT: "serial:connect",
  SERIAL_DISCONNECT: "serial:disconnect",
  SERIAL_RUN: "serial:run",
  SERIAL_STOP: "serial:stop",
  SERIAL_PRIME: "serial:prime",
  SERIAL_START_CONTINUOUS: "serial:start-continuous",
  SERIAL_SET_RATE: "serial:set-rate",
  SERIAL_GET_STATE: "serial:get-state",
  SERIAL_SEND_RAW: "serial:send-raw",

  // Serial events (main → renderer)
  SERIAL_EVT_TELEMETRY: "serial:evt-telemetry",
  SERIAL_EVT_CONNECTION: "serial:evt-connection",
  SERIAL_EVT_FAULT: "serial:evt-fault",
  SERIAL_EVT_LINE: "serial:evt-line",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",

  // Studies
  STUDY_PICK_FOLDER: "study:pick-folder",
  STUDY_OPEN: "study:open",
  STUDY_CREATE: "study:create",
  STUDY_LIST_RUNS: "study:list-runs",
  STUDY_LIST_PROTOCOLS: "study:list-protocols",
  STUDY_SAVE_PROTOCOL: "study:save-protocol",
  STUDY_CREATE_GROUP: "study:create-group",
  STUDY_UPDATE_GROUP: "study:update-group",
  STUDY_DELETE_GROUP: "study:delete-group",
  STUDY_UPDATE_META: "study:update-meta",

  // Studies — main → renderer events (App menu fires these so the renderer
  // can pick up "Open Demo Study" / "Open Study Folder…" without UI plumbing
  // in main process)
  STUDY_EVT_OPEN_REQUEST: "study:evt-open-request",

  // Runs
  RUN_CREATE: "run:create",
  RUN_APPEND_TELEMETRY_BATCH: "run:append-telemetry-batch",
  RUN_APPEND_EVENT: "run:append-event",
  RUN_FINALIZE: "run:finalize",
  RUN_OPEN_FOLDER: "run:open-folder",
  RUN_PICK_IMAGING: "run:pick-imaging",
  RUN_LINK_IMAGING: "run:link-imaging",
  RUN_UPDATE: "run:update",
  RUN_DELETE: "run:delete",

  // App menu events (main → renderer). The native menu fires these so
  // renderer state changes (settings drawer, sidebar, console, link image,
  // open last run) can be triggered from File / View menus.
  APP_EVT_OPEN_SETTINGS: "app:evt-open-settings",
  APP_EVT_LINK_IMAGE: "app:evt-link-image",
  APP_EVT_OPEN_LAST_RUN: "app:evt-open-last-run",
  APP_EVT_TOGGLE_SIDEBAR: "app:evt-toggle-sidebar",
  APP_EVT_TOGGLE_CONSOLE: "app:evt-toggle-console",

  // Custom title bar — window controls + edit-menu role bridging.
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAX_TOGGLE: "window:max-toggle",
  WINDOW_CLOSE: "window:close",
  WINDOW_IS_MAXIMIZED: "window:is-maximized",
  WINDOW_EVT_MAX_STATE: "window:evt-max-state",
  APP_EDIT_UNDO: "app:edit-undo",
  APP_EDIT_REDO: "app:edit-redo",
  APP_EDIT_CUT: "app:edit-cut",
  APP_EDIT_COPY: "app:edit-copy",
  APP_EDIT_PASTE: "app:edit-paste",
  APP_EDIT_SELECT_ALL: "app:edit-select-all",
  APP_OPEN_DEMO_STUDY: "app:open-demo-study",
} as const;
