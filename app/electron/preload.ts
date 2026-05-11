import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "./shared/types";
import type {
  ConnectionState,
  FaultEvent,
  GroupJson,
  ImagingLinkJson,
  PortInfo,
  ProtocolJson,
  RunMetadataJson,
  RunSpec,
  StudyJson,
  StudyMetaJson,
  SystemSnapshotJson,
  TelemetrySample,
} from "./shared/types";

type Unsubscribe = () => void;

function subscribe<T>(channel: string, handler: (value: T) => void): Unsubscribe {
  const listener = (_evt: unknown, payload: T) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api = {
  // App
  getVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  getPlatform: (): Promise<NodeJS.Platform> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PLATFORM),
  openPath: (target: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_PATH, target),

  // App menu events (main → renderer). Subscriptions return unsubscribe fns.
  onOpenSettings: (handler: () => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.APP_EVT_OPEN_SETTINGS, handler),
  onLinkImage: (handler: () => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.APP_EVT_LINK_IMAGE, handler),
  onOpenLastRun: (handler: () => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.APP_EVT_OPEN_LAST_RUN, handler),
  onToggleSidebar: (handler: () => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.APP_EVT_TOGGLE_SIDEBAR, handler),
  onToggleConsole: (handler: () => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.APP_EVT_TOGGLE_CONSOLE, handler),

  // Custom title bar — window controls.
  windowMinimize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  windowMaxToggle: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAX_TOGGLE),
  windowClose: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  windowIsMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  onMaxStateChange: (handler: (maximized: boolean) => void): Unsubscribe =>
    subscribe(IPC_CHANNELS.WINDOW_EVT_MAX_STATE, handler),

  // Edit-menu role bridges, for the DOM Edit dropdown in the custom title bar.
  editUndo: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_UNDO),
  editRedo: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_REDO),
  editCut: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_CUT),
  editCopy: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_COPY),
  editPaste: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_PASTE),
  editSelectAll: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_EDIT_SELECT_ALL),
  openDemoStudy: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_DEMO_STUDY),

  // Serial
  serial: {
    listPorts: (): Promise<PortInfo[]> => ipcRenderer.invoke(IPC_CHANNELS.SERIAL_LIST_PORTS),
    connect: (port: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_CONNECT, port),
    disconnect: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.SERIAL_DISCONNECT),
    getState: (): Promise<ConnectionState> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_GET_STATE),
    runProtocol: (spec: RunSpec): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_RUN, spec),
    stop: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.SERIAL_STOP),
    prime: (durationS: number): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_PRIME, durationS),
    startContinuous: (hz: number): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_START_CONTINUOUS, hz),
    setRate: (hz: number): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_SET_RATE, hz),
    sendRaw: (line: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERIAL_SEND_RAW, line),

    onTelemetry: (handler: (sample: TelemetrySample) => void): Unsubscribe =>
      subscribe(IPC_CHANNELS.SERIAL_EVT_TELEMETRY, handler),
    onConnectionChange: (handler: (state: ConnectionState) => void): Unsubscribe =>
      subscribe(IPC_CHANNELS.SERIAL_EVT_CONNECTION, handler),
    onFault: (handler: (fault: FaultEvent) => void): Unsubscribe =>
      subscribe(IPC_CHANNELS.SERIAL_EVT_FAULT, handler),
    onLine: (handler: (line: string) => void): Unsubscribe =>
      subscribe(IPC_CHANNELS.SERIAL_EVT_LINE, handler),
  },

  // Settings
  settings: {
    get: <T>(key: string): Promise<T> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: <T>(key: string, value: T): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
  },

  // Studies
  studies: {
    pickFolder: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_PICK_FOLDER),
    open: (folder: string): Promise<StudyJson | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_OPEN, folder),
    create: (folder: string, title: string): Promise<StudyJson> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_CREATE, folder, title),
    listRuns: (folder: string): Promise<{ folder: string; metadata: RunMetadataJson }[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_LIST_RUNS, folder),
    listProtocols: (folder: string): Promise<ProtocolJson[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_LIST_PROTOCOLS, folder),
    saveProtocol: (folder: string, protocol: ProtocolJson): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_SAVE_PROTOCOL, folder, protocol),
    createGroup: (
      folder: string,
      init: { name: string; color?: string; purpose?: string },
    ): Promise<GroupJson> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_CREATE_GROUP, folder, init),
    updateGroup: (
      folder: string,
      groupId: string,
      patch: Partial<Omit<GroupJson, "id">>,
    ): Promise<GroupJson | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_UPDATE_GROUP, folder, groupId, patch),
    deleteGroup: (folder: string, groupId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_DELETE_GROUP, folder, groupId),
    updateMeta: (
      folder: string,
      patch: Partial<Omit<StudyMetaJson, "id" | "created_at" | "last_modified_at">>,
    ): Promise<StudyJson | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.STUDY_UPDATE_META, folder, patch),
    onOpenRequest: (handler: (folder: string) => void): Unsubscribe =>
      subscribe(IPC_CHANNELS.STUDY_EVT_OPEN_REQUEST, handler),
  },

  // Runs
  runs: {
    create: (
      studyFolder: string,
      metadata: RunMetadataJson,
      system: SystemSnapshotJson,
      protocol: ProtocolJson,
    ): Promise<{ folder: string }> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.RUN_CREATE,
        studyFolder,
        metadata,
        system,
        protocol,
      ),
    appendTelemetryBatch: (runFolder: string, samples: TelemetrySample[]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_APPEND_TELEMETRY_BATCH, runFolder, samples),
    appendEvent: (runFolder: string, eventType: string, detail: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_APPEND_EVENT, runFolder, eventType, detail),
    finalize: (
      runFolder: string,
      stoppedAt: string,
      durationS: number,
      stopReason: string,
    ): Promise<void> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.RUN_FINALIZE,
        runFolder,
        stoppedAt,
        durationS,
        stopReason,
      ),
    openFolder: (runFolder: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_OPEN_FOLDER, runFolder),
    delete: (runFolder: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_DELETE, runFolder),
    pickImagingFile: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_PICK_IMAGING),
    linkImaging: (runFolder: string, externalPath: string): Promise<ImagingLinkJson> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_LINK_IMAGING, runFolder, externalPath),
    update: (
      runFolder: string,
      patch: { active?: boolean; group_id?: string | null; label?: string },
    ): Promise<RunMetadataJson | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.RUN_UPDATE, runFolder, patch),
  },
};

contextBridge.exposeInMainWorld("flowChamber", api);

export type FlowChamberApi = typeof api;

declare global {
  interface Window {
    flowChamber: FlowChamberApi;
  }
}
