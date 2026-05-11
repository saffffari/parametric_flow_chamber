import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// Crash diagnostics: dump any uncaught exception to a known file BEFORE Electron's
// default dialog kicks in. Helps debug packaged builds where stderr is suppressed.
const crashLogPath = path.join(os.tmpdir(), "flow-chamber-crash.log");
function logCrash(label: string, err: unknown) {
  const stamp = new Date().toISOString();
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  try {
    fs.appendFileSync(crashLogPath, `\n--- ${stamp} ${label} ---\n${msg}\n`);
  } catch {
    // best-effort
  }
}
process.on("uncaughtException", (err) => {
  logCrash("uncaughtException", err);
});
process.on("unhandledRejection", (reason) => {
  logCrash("unhandledRejection", reason);
});

import { SerialService } from "./services/serial";
import { StudyIo } from "./services/study-io";
import { SettingsService } from "./services/settings";
import { IPC_CHANNELS } from "./shared/types";
import type {
  GroupJson,
  ProtocolJson,
  RunSpec,
  RunMetadataJson,
  StudyMetaJson,
  SystemSnapshotJson,
  TelemetrySample,
} from "./shared/types";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
const serial = new SerialService();
const studyIo = new StudyIo();
const settingsSvc = new SettingsService();

function createWindow() {
  const win = new BrowserWindow({
    // Launch at the minimum supported size and let the operator stretch from
    // there. The min dims are the smallest the layout has been verified to
    // render unclipped: SHEAR + DISPLAY top row (with the 280 major knob and
    // matching roller body) + bottom row of size-140 knobs with Counter
    // value cells, plus the 3-trace DISPLAY column on the right.
    width: 1500,
    height: 920,
    minWidth: 1500,
    minHeight: 920,
    backgroundColor: "#cccccc",
    // Fully frameless — renderer draws the title bar (logo, menus, window
    // controls). The application menu is still registered so accelerators
    // continue to fire even though the native menu bar isn't visible.
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // Push maximize/unmaximize state to the renderer so the custom max/restore
  // button can reflect the current state.
  win.on("maximize", () => win.webContents.send(IPC_CHANNELS.WINDOW_EVT_MAX_STATE, true));
  win.on("unmaximize", () => win.webContents.send(IPC_CHANNELS.WINDOW_EVT_MAX_STATE, false));

  if (isDev && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

// -------------------------------------------------------------------------
// Application menu
// -------------------------------------------------------------------------

/**
 * Locate the bundled demo study. In dev `app.getAppPath()` is the source
 * `app/` dir, so its sibling is `<repo>/examples/demo_study`. In packaged
 * builds the demo is shipped via `extraResource` in forge.config.ts and
 * lands at `<resources>/demo_study`.
 */
function findDemoStudyPath(): string | null {
  const candidates = [
    path.resolve(app.getAppPath(), "..", "examples", "demo_study"),
    path.join(process.resourcesPath, "demo_study"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "study.json"))) {
      return candidate;
    }
  }
  return null;
}

async function openDemoStudy() {
  const found = findDemoStudyPath();
  if (!found) {
    if (mainWindow) {
      void dialog.showMessageBox(mainWindow, {
        type: "warning",
        message: "Demo study not found",
        detail:
          "Looked next to the app source tree and in the packaged resources " +
          "folder. Reinstall the app or pick a study folder manually via " +
          "File → Open Study Folder…",
      });
    }
    return;
  }
  mainWindow?.webContents.send(IPC_CHANNELS.STUDY_EVT_OPEN_REQUEST, found);
}

async function openStudyFolderViaPicker() {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Open or create study folder",
  });
  if (result.canceled || result.filePaths.length === 0) return;
  mainWindow.webContents.send(IPC_CHANNELS.STUDY_EVT_OPEN_REQUEST, result.filePaths[0]);
}

function sendMenuEvent(channel: string): void {
  if (mainWindow) mainWindow.webContents.send(channel);
}

function buildAppMenu(): Electron.Menu {
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ] satisfies Electron.MenuItemConstructorOptions[])
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open Demo Study",
          accelerator: "CmdOrCtrl+D",
          click: () => void openDemoStudy(),
        },
        {
          label: "Open Study Folder…",
          accelerator: "CmdOrCtrl+O",
          click: () => void openStudyFolderViaPicker(),
        },
        { type: "separator" },
        {
          label: "Link Image…",
          click: () => sendMenuEvent(IPC_CHANNELS.APP_EVT_LINK_IMAGE),
        },
        {
          label: "Open Last Run",
          click: () => sendMenuEvent(IPC_CHANNELS.APP_EVT_OPEN_LAST_RUN),
        },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "CmdOrCtrl+,",
          click: () => sendMenuEvent(IPC_CHANNELS.APP_EVT_OPEN_SETTINGS),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        {
          label: "Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => sendMenuEvent(IPC_CHANNELS.APP_EVT_TOGGLE_SIDEBAR),
        },
        {
          label: "Console",
          accelerator: "CmdOrCtrl+`",
          click: () => sendMenuEvent(IPC_CHANNELS.APP_EVT_TOGGLE_CONSOLE),
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  return Menu.buildFromTemplate(template);
}

// -------------------------------------------------------------------------
// IPC registration
// -------------------------------------------------------------------------

function registerIpcHandlers() {
  // App
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => app.getVersion());
  ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => process.platform);
  ipcMain.handle(IPC_CHANNELS.APP_OPEN_PATH, async (_evt, target: string) => {
    return shell.openPath(target);
  });

  // Serial
  ipcMain.handle(IPC_CHANNELS.SERIAL_LIST_PORTS, () => serial.listPorts());
  ipcMain.handle(IPC_CHANNELS.SERIAL_CONNECT, (_evt, port: string) => serial.connect(port));
  ipcMain.handle(IPC_CHANNELS.SERIAL_DISCONNECT, () => serial.disconnect());
  ipcMain.handle(IPC_CHANNELS.SERIAL_GET_STATE, () => serial.connectionState);
  ipcMain.handle(IPC_CHANNELS.SERIAL_RUN, (_evt, spec: RunSpec) =>
    serial.startRun({
      meanPa: spec.meanPa,
      stepRateHz: spec.stepRateHz,
      durationS: spec.durationS,
    }),
  );
  ipcMain.handle(IPC_CHANNELS.SERIAL_STOP, () => serial.stopRun());
  ipcMain.handle(IPC_CHANNELS.SERIAL_PRIME, (_evt, durationS: number) =>
    serial.prime(durationS),
  );
  ipcMain.handle(IPC_CHANNELS.SERIAL_START_CONTINUOUS, (_evt, hz: number) =>
    serial.startContinuous(hz),
  );
  ipcMain.handle(IPC_CHANNELS.SERIAL_SET_RATE, (_evt, hz: number) =>
    serial.setRate(hz),
  );
  ipcMain.handle(IPC_CHANNELS.SERIAL_SEND_RAW, (_evt, line: string) => serial.send(line));

  // Forward serial events to the renderer
  serial.on("telemetry", (sample: TelemetrySample) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SERIAL_EVT_TELEMETRY, sample);
  });
  serial.on("connectionChange", (state: string) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SERIAL_EVT_CONNECTION, state);
  });
  serial.on("line", (line: string) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SERIAL_EVT_LINE, line);
  });
  serial.on("error", (err: Error) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SERIAL_EVT_FAULT, {
      timestampUs: Date.now() * 1000,
      code: 1,
      description: err.message,
    });
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_evt, key: string) => {
    // Type lookup is checked at the renderer; main is permissive
    return settingsSvc.get(key as Parameters<typeof settingsSvc.get>[0]);
  });
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_evt, key: string, value: unknown) => {
    settingsSvc.set(
      key as Parameters<typeof settingsSvc.set>[0],
      value as never,
    );
  });

  // Studies
  ipcMain.handle(IPC_CHANNELS.STUDY_PICK_FOLDER, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select study folder",
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
  ipcMain.handle(IPC_CHANNELS.STUDY_OPEN, (_evt, folder: string) => studyIo.openStudy(folder));
  ipcMain.handle(IPC_CHANNELS.STUDY_CREATE, (_evt, folder: string, title: string) =>
    studyIo.createStudy(folder, title),
  );
  ipcMain.handle(IPC_CHANNELS.STUDY_LIST_RUNS, (_evt, folder: string) =>
    studyIo.listRuns(folder),
  );
  ipcMain.handle(IPC_CHANNELS.STUDY_LIST_PROTOCOLS, (_evt, folder: string) =>
    studyIo.listProtocols(folder),
  );
  ipcMain.handle(
    IPC_CHANNELS.STUDY_SAVE_PROTOCOL,
    (_evt, folder: string, protocol: ProtocolJson) =>
      studyIo.saveProtocol(folder, protocol),
  );
  ipcMain.handle(
    IPC_CHANNELS.STUDY_CREATE_GROUP,
    (_evt, folder: string, init: { name: string; color?: string; purpose?: string }) =>
      studyIo.createGroup(folder, init),
  );
  ipcMain.handle(
    IPC_CHANNELS.STUDY_UPDATE_GROUP,
    (_evt, folder: string, groupId: string, patch: Partial<Omit<GroupJson, "id">>) =>
      studyIo.updateGroup(folder, groupId, patch),
  );
  ipcMain.handle(
    IPC_CHANNELS.STUDY_DELETE_GROUP,
    (_evt, folder: string, groupId: string) =>
      studyIo.deleteGroup(folder, groupId),
  );
  ipcMain.handle(
    IPC_CHANNELS.STUDY_UPDATE_META,
    (_evt, folder: string, patch: Partial<StudyMetaJson>) =>
      studyIo.updateStudyMeta(folder, patch),
  );

  // Runs
  ipcMain.handle(
    IPC_CHANNELS.RUN_CREATE,
    (
      _evt,
      studyFolder: string,
      metadata: RunMetadataJson,
      system: SystemSnapshotJson,
      protocol: ProtocolJson,
    ) => studyIo.createRun(studyFolder, metadata, system, protocol),
  );
  ipcMain.handle(
    IPC_CHANNELS.RUN_APPEND_TELEMETRY_BATCH,
    (_evt, runFolder: string, samples: TelemetrySample[]) =>
      studyIo.appendTelemetryBatch(runFolder, samples),
  );
  ipcMain.handle(
    IPC_CHANNELS.RUN_APPEND_EVENT,
    (_evt, runFolder: string, eventType: string, detail: string) =>
      studyIo.appendEvent(runFolder, eventType, detail),
  );
  ipcMain.handle(
    IPC_CHANNELS.RUN_FINALIZE,
    (_evt, runFolder: string, stoppedAt: string, durationS: number, stopReason: string) =>
      studyIo.finalizeRun(runFolder, stoppedAt, durationS, stopReason),
  );
  ipcMain.handle(IPC_CHANNELS.RUN_OPEN_FOLDER, (_evt, runFolder: string) =>
    shell.openPath(runFolder),
  );
  ipcMain.handle(IPC_CHANNELS.RUN_DELETE, (_evt, runFolder: string) =>
    studyIo.deleteRun(runFolder),
  );
  ipcMain.handle(IPC_CHANNELS.RUN_PICK_IMAGING, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      title: "Link imaging file to run",
      filters: [
        { name: "Imaging files", extensions: ["czi", "tif", "tiff", "ome.tif", "ome.tiff"] },
        { name: "All files", extensions: ["*"] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
  ipcMain.handle(
    IPC_CHANNELS.RUN_LINK_IMAGING,
    (_evt, runFolder: string, externalPath: string) =>
      studyIo.linkRunImaging(runFolder, externalPath),
  );
  ipcMain.handle(
    IPC_CHANNELS.RUN_UPDATE,
    (
      _evt,
      runFolder: string,
      patch: { active?: boolean; group_id?: string | null; label?: string },
    ) => studyIo.updateRun(runFolder, patch),
  );

  // Custom title bar: window controls.
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow?.minimize());
  ipcMain.handle(IPC_CHANNELS.WINDOW_MAX_TOGGLE, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow?.close());
  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => mainWindow?.isMaximized() ?? false);

  // Edit-menu role bridges. Lets the custom DOM Edit dropdown drive the same
  // commands the native Electron `role: "cut"` etc. items would.
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_UNDO, () => mainWindow?.webContents.undo());
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_REDO, () => mainWindow?.webContents.redo());
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_CUT, () => mainWindow?.webContents.cut());
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_COPY, () => mainWindow?.webContents.copy());
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_PASTE, () => mainWindow?.webContents.paste());
  ipcMain.handle(IPC_CHANNELS.APP_EDIT_SELECT_ALL, () =>
    mainWindow?.webContents.selectAll(),
  );
  ipcMain.handle(IPC_CHANNELS.APP_OPEN_DEMO_STUDY, () => openDemoStudy());
}

// -------------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------------

app.whenReady().then(() => {
  registerIpcHandlers();
  Menu.setApplicationMenu(buildAppMenu());
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  void serial.disconnect();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
