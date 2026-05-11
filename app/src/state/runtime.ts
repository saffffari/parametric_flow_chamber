/**
 * Runtime store — connects the active hardware interface (mock or serial) to
 * the React tree via Zustand. Manages:
 *   - Connection state and live telemetry
 *   - Currently-dialed protocol parameters
 *   - Calibration constants (settings-backed)
 *   - Run lifecycle: create on disk, batch telemetry to CSV, finalize on stop
 *
 * Single global instance per renderer.
 */

import { create } from "zustand";

import {
  DEFAULT_CALIBRATION,
  shearToFlowMlMin,
  shearToStepRate,
  type CalibrationConstants,
  type WaveformShape,
} from "@/domain/shear";
import {
  metadataToJson,
  systemToJson,
  protocolToJson,
  makeRunMetadata,
  makeSystemSnapshot,
  type Protocol,
} from "@/domain/storage";
import type { GroupJson } from "@/domain/storage/group";
import type { RunMetadataJson } from "@/domain/storage/run";
import type { StudyJson } from "@/domain/storage/study";
import { MockInterface } from "@/lib/mock-interface";
import { SerialInterface } from "@/lib/serial-interface";
import type {
  ConnectionState,
  FaultEvent,
  FlowChamberInterface,
  TelemetryRunState,
  TelemetrySample,
} from "@/lib/interface";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface DialedProtocol {
  meanPa: number;
  amplitudePa: number;
  frequencyHz: number;
  waveform: WaveformShape;
  phaseDeg: number;
  durationS: number;
  rampInS: number;
  rampOutS: number;
}

export const DEFAULT_DIALED_PROTOCOL: DialedProtocol = {
  meanPa: 1.0,
  amplitudePa: 0,
  frequencyHz: 1.0,
  waveform: "dc",
  phaseDeg: 0,
  durationS: 600,
  rampInS: 30,
  rampOutS: 30,
};

export type InterfaceMode = "mock" | "serial";

export interface RunListEntry {
  folder: string;
  metadata: RunMetadataJson;
}

export type SelectedNode =
  | { kind: "study"; id: string }
  | { kind: "group"; id: string }
  | { kind: "run"; id: string };

export interface ActiveRun {
  studyFolder: string;
  runFolder: string;
  startedAt: string;
  startMs: number;
  protocol: Protocol;
}

export interface RuntimeStoreState {
  // Interface
  interface: FlowChamberInterface;
  interfaceMode: InterfaceMode;
  connectionState: ConnectionState;

  // Telemetry
  lastTelemetry: TelemetrySample | null;
  runState: TelemetryRunState;
  triggerCount: number;
  lastFault: FaultEvent | null;

  // Calibration & dialed protocol
  calibration: CalibrationConstants;
  dialed: DialedProtocol;

  // Operator + study context
  operatorName: string;
  studyFolder: string | null;
  selectedPort: string | null;
  serialPortConnected: boolean;

  // Active run (during a run lifecycle)
  activeRun: ActiveRun | null;

  // Most recently created run folder. Held after stop until the next startRun
  // so post-stop actions (link imaging, open folder) have a stable target.
  lastRunFolder: string | null;
  lastRunLabel: string | null;
  lastImagingLink: string | null;

  // Library / tree state
  study: StudyJson | null;
  runs: RunListEntry[];
  expandedNodes: Set<string>;
  selectedNode: SelectedNode | null;
  /**
   * Multi-select set of run IDs. Maintained alongside `selectedNode` — a
   * single click both seeds this set with {id} and sets selectedNode to the
   * run. Ctrl/Meta-click toggles membership. Shift-click selects a range
   * from `anchorRunId` to the clicked run in visible display order.
   * Clicking a non-run node clears this set.
   */
  selectedRunIds: Set<string>;
  /** Run that anchors range-select. Set on plain or ctrl-click. */
  anchorRunId: string | null;

  // UI chrome
  sidebarOpen: boolean;

  // ----- Actions -----
  setInterfaceMode: (mode: InterfaceMode) => Promise<void>;

  connectMock: () => Promise<void>;
  disconnect: () => Promise<void>;

  setSelectedPort: (port: string | null) => Promise<void>;
  connectToPort: (port: string) => Promise<boolean>;

  setDialed: (patch: Partial<DialedProtocol>) => void;
  setCalibration: (patch: Partial<CalibrationConstants>) => Promise<void>;
  setOperatorName: (name: string) => Promise<void>;
  setStudyFolder: (folder: string | null) => Promise<void>;

  /**
   * Open or create the study at the given folder. Reads `study.json`; if
   * missing, creates a fresh "Untitled Study". Updates the store's
   * `studyFolder` and persists the choice. Used by the App menu's
   * "Open Demo Study" / "Open Study Folder…" entries and the Settings drawer.
   */
  openStudy: (folder: string) => Promise<void>;

  startRun: () => Promise<boolean>;
  stopRun: (reason?: "completed" | "manual_stop" | "fault") => Promise<void>;
  prime: (durationS: number) => Promise<void>;

  /**
   * Bench tuning path: start the pump at a fixed step rate without going
   * through the run-lifecycle (no study folder, no run folder, no CSV).
   * Sets runState to HOLDING. Halt with stopRun().
   */
  spinAt: (stepRateHz: number) => Promise<boolean>;

  /**
   * Live step-rate update during continuous (spin) mode. No-op when nothing
   * is spinning. Renderer should throttle this to ~20 Hz when bound to a
   * dragging knob.
   */
  nudgeRate: (stepRateHz: number) => Promise<boolean>;

  /**
   * Pop a file picker, then attach the chosen imaging file (typically a
   * Zeiss .czi) to the active or most recent run. Writes
   * `<run>/imaging_link.json`. Returns the absolute path linked, or null if
   * the user cancelled the picker.
   */
  linkImaging: () => Promise<string | null>;

  // Library
  refreshLibrary: () => Promise<void>;
  toggleNodeExpansion: (id: string) => void;
  selectNode: (node: SelectedNode | null) => void;
  /**
   * Click a run with optional modifiers. `mode`:
   *   - "single" : plain click. Replace selection with {id}. Set anchor.
   *   - "toggle" : ctrl/meta. Toggle id in/out. Update anchor to clicked.
   *   - "range"  : shift. Replace selection with all run ids between
   *                `anchorRunId` and `id` in `flatOrder`. Anchor unchanged.
   */
  selectRun: (
    id: string,
    mode: "single" | "toggle" | "range",
    flatOrder: string[],
  ) => void;
  /** Wipe the multi-select set and the anchor. */
  clearRunSelection: () => void;
  /**
   * Destructively delete every run currently in `selectedRunIds`. The caller
   * confirms with the operator beforehand — no second prompt here. Refreshes
   * the library and clears selection on completion.
   */
  deleteSelectedRuns: () => Promise<void>;
  createGroup: (init: { name: string; color?: string; purpose?: string }) => Promise<void>;
  updateGroup: (
    groupId: string,
    patch: Partial<Omit<GroupJson, "id">>,
  ) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  renameStudy: (title: string) => Promise<void>;
  setRunActive: (runFolder: string, active: boolean) => Promise<void>;
  renameRun: (runFolder: string, label: string) => Promise<void>;
  moveRunToGroup: (runFolder: string, groupId: string | null) => Promise<void>;

  // UI chrome
  toggleSidebar: () => void;

  hydrateFromSettings: () => Promise<void>;
}

// -------------------------------------------------------------------------
// Telemetry batch flusher (per-run lifetime)
// -------------------------------------------------------------------------

const FLUSH_INTERVAL_MS = 1000; // batch ~10 samples per IPC call at 10 Hz

class RunFlusher {
  private buffer: TelemetrySample[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(
    private runFolder: string,
    private onError: (err: Error) => void,
  ) {}

  start() {
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
  }

  push(sample: TelemetrySample) {
    this.buffer.push(sample);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      await window.flowChamber.runs.appendTelemetryBatch(this.runFolder, batch);
    } catch (e) {
      this.onError(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

// -------------------------------------------------------------------------
// Store factory
// -------------------------------------------------------------------------

let activeFlusher: RunFlusher | null = null;
let telemetrySubscription: (() => void) | null = null;

function wireInterfaceEvents(
  iface: FlowChamberInterface,
  set: (patch: Partial<RuntimeStoreState>) => void,
): () => void {
  const offConnection = iface.onConnectionChange((state) =>
    set({
      connectionState: state,
      serialPortConnected: state === "connected",
    }),
  );
  const offTelemetry = iface.onTelemetry((sample) => {
    set({
      lastTelemetry: sample,
      runState: sample.state,
      triggerCount: sample.triggerCount,
    });
    if (activeFlusher) activeFlusher.push(sample);
  });
  const offFault = iface.onFault((fault) =>
    set({ lastFault: fault, runState: "FAULT" }),
  );
  const offTrigger = iface.onTriggerReceived((count) =>
    set({ triggerCount: count }),
  );
  return () => {
    offConnection();
    offTelemetry();
    offFault();
    offTrigger();
  };
}

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => {
  const initialMock = new MockInterface();
  telemetrySubscription = wireInterfaceEvents(initialMock, set);

  return {
    interface: initialMock,
    interfaceMode: "mock",
    connectionState: "disconnected",
    lastTelemetry: null,
    runState: "IDLE",
    triggerCount: 0,
    lastFault: null,
    calibration: { ...DEFAULT_CALIBRATION },
    dialed: { ...DEFAULT_DIALED_PROTOCOL },
    operatorName: "",
    studyFolder: null,
    selectedPort: null,
    serialPortConnected: false,
    activeRun: null,
    lastRunFolder: null,
    lastRunLabel: null,
    lastImagingLink: null,
    study: null,
    runs: [],
    expandedNodes: new Set<string>(),
    selectedNode: null,
    selectedRunIds: new Set<string>(),
    anchorRunId: null,
    sidebarOpen: true,

    setInterfaceMode: async (mode) => {
      const current = get().interface;
      const currentMode = get().interfaceMode;
      if (mode === currentMode) return;

      // Tear down current
      await current.disconnect();
      if (telemetrySubscription) {
        telemetrySubscription();
        telemetrySubscription = null;
      }
      if (current instanceof SerialInterface) {
        current.dispose();
      }

      // Spin up new
      const next: FlowChamberInterface =
        mode === "mock"
          ? new MockInterface()
          : new SerialInterface({ getCalibration: () => get().calibration });
      telemetrySubscription = wireInterfaceEvents(next, set);
      set({
        interface: next,
        interfaceMode: mode,
        connectionState: "disconnected",
        serialPortConnected: false,
      });

      // Mock auto-connects; serial waits for explicit port selection
      if (mode === "mock") {
        await next.connect();
      }
    },

    connectMock: async () => {
      await get().interface.connect();
    },

    disconnect: async () => {
      await get().interface.disconnect();
    },

    setSelectedPort: async (port) => {
      set({ selectedPort: port });
      await window.flowChamber.settings.set("port", port);
    },

    connectToPort: async (port) => {
      if (get().interfaceMode !== "serial") {
        await get().setInterfaceMode("serial");
      }
      const ok = await get().interface.connect(port);
      if (ok) {
        set({ selectedPort: port, serialPortConnected: true });
        await window.flowChamber.settings.set("port", port);
      }
      return ok;
    },

    setDialed: (patch) =>
      set((s) => ({ dialed: { ...s.dialed, ...patch } })),

    setCalibration: async (patch) => {
      const next = { ...get().calibration, ...patch };
      set({ calibration: next });
      await window.flowChamber.settings.set("calibration", next);
    },

    setOperatorName: async (name) => {
      set({ operatorName: name });
      await window.flowChamber.settings.set("operatorName", name);
    },

    setStudyFolder: async (folder) => {
      set({ studyFolder: folder });
      await window.flowChamber.settings.set("lastStudyFolder", folder);
    },

    openStudy: async (folder) => {
      try {
        let study = await window.flowChamber.studies.open(folder);
        if (!study) {
          study = await window.flowChamber.studies.create(folder, "Untitled Study");
        }
        await get().setStudyFolder(folder);
        const runs = await window.flowChamber.studies.listRuns(folder);
        // Auto-expand the study root so the user immediately sees groups.
        const expanded = new Set(get().expandedNodes);
        expanded.add(`study:${study.meta.id}`);
        set({ study, runs, expandedNodes: expanded });
      } catch (e) {
        console.error("[runtime] Failed to open/create study:", e);
      }
    },

    startRun: async () => {
      const state = get();
      if (state.activeRun) return false;

      const dialed = state.dialed;
      const calibration = state.calibration;
      const operator = state.operatorName;
      const studyFolder = state.studyFolder;

      if (!studyFolder) {
        // v0 behavior: refuse to start without a study; UI prompts user via Settings
        console.warn("[runtime] Cannot start run: no study folder selected");
        return false;
      }

      // Build run records
      const startedAt = new Date().toISOString();
      const protocol: Protocol = {
        name: `run_${Date.now()}`,
        meanPa: dialed.meanPa,
        amplitudePa: dialed.amplitudePa,
        frequencyHz: dialed.frequencyHz,
        waveform: dialed.waveform,
        phaseDeg: dialed.phaseDeg,
        durationS: dialed.durationS,
        rampInS: dialed.rampInS,
        rampOutS: dialed.rampOutS,
      };
      const metadata = makeRunMetadata(`shear ${dialed.meanPa.toFixed(2)} Pa`);
      metadata.operator = operator;
      metadata.startedAt = startedAt;
      const system = makeSystemSnapshot({
        appVersion: "0.1.0",
        firmwareName: state.interfaceMode === "mock" ? "MOCK_flow_chamber" : "flow_chamber_teensy_smoke",
        channelWidthMm: calibration.channelWidthMm,
        channelHeightMm: calibration.channelHeightMm,
        channelLengthMm: calibration.channelLengthMm,
        viscosityPaS: calibration.viscosityPaS,
        stepsPerMl: calibration.stepsPerMl,
        pumpMaxRpm: calibration.pumpMaxRpm,
        motorStepsPerRev: calibration.motorStepsPerRev,
        microstepping: calibration.microstepping,
      });

      let runFolder: string;
      try {
        const { folder } = await window.flowChamber.runs.create(
          studyFolder,
          metadataToJson(metadata),
          systemToJson(system),
          protocolToJson(protocol),
        );
        runFolder = folder;
      } catch (e) {
        console.error("[runtime] Failed to create run folder:", e);
        return false;
      }

      // Start the flusher BEFORE we kick off telemetry so no samples are lost
      activeFlusher = new RunFlusher(runFolder, (err) => {
        console.error("[runtime] Telemetry flush error:", err);
      });
      activeFlusher.start();

      set({
        activeRun: {
          studyFolder,
          runFolder,
          startedAt,
          startMs: Date.now(),
          protocol,
        },
        lastRunFolder: runFolder,
        lastRunLabel: protocol.name,
        lastImagingLink: null,
      });

      // Compute step rate for IPC RunSpec parity (mock ignores this)
      const stepRateHz = Math.round(shearToStepRate(dialed.meanPa, calibration));
      const flowMlMin = shearToFlowMlMin(dialed.meanPa, calibration);
      void flowMlMin; // logged in metadata above

      const ok = await state.interface.runProtocol({
        meanPa: dialed.meanPa,
        amplitudePa: dialed.amplitudePa,
        frequencyHz: dialed.frequencyHz,
        waveform: dialed.waveform,
        durationS: dialed.durationS,
        rampInS: dialed.rampInS,
        rampOutS: dialed.rampOutS,
      });
      void stepRateHz;

      if (!ok) {
        // Roll back the run folder reservation
        await activeFlusher.stop();
        activeFlusher = null;
        await window.flowChamber.runs.finalize(
          runFolder,
          new Date().toISOString(),
          0,
          "fault",
        );
        set({ activeRun: null });
        return false;
      }
      return true;
    },

    stopRun: async (reason: "completed" | "manual_stop" | "fault" = "manual_stop") => {
      const { interface: iface, activeRun } = get();
      await iface.stop();
      // Reset runState synchronously so the UI doesn't lag on the final
      // telemetry sample (mock emits an IDLE sample; real serial in spin mode
      // does not poll STATUS so we'd otherwise stay on the last HOLDING value).
      set({ runState: "IDLE" });

      if (!activeRun) return;
      const stoppedAt = new Date().toISOString();
      const durationS = (Date.now() - activeRun.startMs) / 1000;

      if (activeFlusher) {
        await activeFlusher.stop();
        activeFlusher = null;
      }

      try {
        await window.flowChamber.runs.finalize(
          activeRun.runFolder,
          stoppedAt,
          durationS,
          reason,
        );
        await window.flowChamber.runs.appendEvent(
          activeRun.runFolder,
          "stop",
          reason,
        );
      } catch (e) {
        console.error("[runtime] Failed to finalize run:", e);
      }
      set({ activeRun: null });
      void get().refreshLibrary();
    },

    prime: async (durationS) => {
      await get().interface.prime(2.0, durationS);
    },

    spinAt: async (stepRateHz) => {
      const state = get();
      if (state.activeRun) return false; // protocol run owns the firmware
      const ok = await state.interface.startContinuous(stepRateHz);
      if (ok) set({ runState: "HOLDING" });
      return ok;
    },

    nudgeRate: async (stepRateHz) => {
      return get().interface.setStepRate(stepRateHz);
    },

    linkImaging: async () => {
      const target = get().activeRun?.runFolder ?? get().lastRunFolder;
      if (!target) {
        console.warn("[runtime] linkImaging: no active or recent run to attach to");
        return null;
      }
      const externalPath = await window.flowChamber.runs.pickImagingFile();
      if (!externalPath) return null;
      try {
        await window.flowChamber.runs.linkImaging(target, externalPath);
        set({ lastImagingLink: externalPath });
        return externalPath;
      } catch (e) {
        console.error("[runtime] Failed to link imaging file:", e);
        return null;
      }
    },

    refreshLibrary: async () => {
      const folder = get().studyFolder;
      if (!folder) {
        set({ study: null, runs: [] });
        return;
      }
      try {
        const study = await window.flowChamber.studies.open(folder);
        const runs = await window.flowChamber.studies.listRuns(folder);
        set({ study, runs });
      } catch (e) {
        console.error("[runtime] refreshLibrary failed:", e);
      }
    },

    toggleNodeExpansion: (id) => {
      const next = new Set(get().expandedNodes);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      set({ expandedNodes: next });
    },

    selectNode: (node) => {
      // Selecting anything other than a run clears the multi-select pool.
      if (!node || node.kind !== "run") {
        set({ selectedNode: node, selectedRunIds: new Set(), anchorRunId: null });
      } else {
        set({ selectedNode: node });
      }
    },

    selectRun: (id, mode, flatOrder) => {
      const state = get();
      if (mode === "toggle") {
        const next = new Set(state.selectedRunIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({
          selectedRunIds: next,
          selectedNode: { kind: "run", id },
          anchorRunId: id,
        });
        return;
      }
      if (mode === "range" && state.anchorRunId) {
        const anchorIdx = flatOrder.indexOf(state.anchorRunId);
        const targetIdx = flatOrder.indexOf(id);
        if (anchorIdx === -1 || targetIdx === -1) {
          // Anchor no longer visible (e.g. group collapsed) — fall back to
          // single-select semantics.
          set({
            selectedRunIds: new Set([id]),
            selectedNode: { kind: "run", id },
            anchorRunId: id,
          });
          return;
        }
        const [lo, hi] =
          anchorIdx <= targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
        const range = new Set(flatOrder.slice(lo, hi + 1));
        set({
          selectedRunIds: range,
          selectedNode: { kind: "run", id },
          // anchor stays put so subsequent shift-clicks extend from the
          // original anchor instead of the most recently shift-clicked row.
        });
        return;
      }
      // "single" — also the fallback when shift-range has no valid anchor.
      set({
        selectedRunIds: new Set([id]),
        selectedNode: { kind: "run", id },
        anchorRunId: id,
      });
    },

    clearRunSelection: () =>
      set({ selectedRunIds: new Set(), anchorRunId: null }),

    deleteSelectedRuns: async () => {
      const state = get();
      if (state.selectedRunIds.size === 0) return;
      const folders = state.runs
        .filter((r) => state.selectedRunIds.has(r.metadata.id))
        .map((r) => r.folder);
      try {
        for (const folder of folders) {
          await window.flowChamber.runs.delete(folder);
        }
      } catch (e) {
        console.error("[runtime] deleteSelectedRuns failed:", e);
      }
      // If the selected-node was one of the deleted runs, drop it.
      const stillExists =
        state.selectedNode?.kind === "run" &&
        !state.selectedRunIds.has(state.selectedNode.id);
      set({
        selectedRunIds: new Set(),
        anchorRunId: null,
        selectedNode: stillExists ? state.selectedNode : null,
      });
      await get().refreshLibrary();
    },

    createGroup: async (init) => {
      const folder = get().studyFolder;
      if (!folder) return;
      try {
        await window.flowChamber.studies.createGroup(folder, init);
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] createGroup failed:", e);
      }
    },

    updateGroup: async (groupId, patch) => {
      const folder = get().studyFolder;
      if (!folder) return;
      try {
        await window.flowChamber.studies.updateGroup(folder, groupId, patch);
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] updateGroup failed:", e);
      }
    },

    deleteGroup: async (groupId) => {
      const folder = get().studyFolder;
      if (!folder) return;
      try {
        await window.flowChamber.studies.deleteGroup(folder, groupId);
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] deleteGroup failed:", e);
      }
    },

    renameStudy: async (title) => {
      const folder = get().studyFolder;
      if (!folder) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      try {
        await window.flowChamber.studies.updateMeta(folder, { title: trimmed });
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] renameStudy failed:", e);
      }
    },

    setRunActive: async (runFolder, active) => {
      try {
        await window.flowChamber.runs.update(runFolder, { active });
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] setRunActive failed:", e);
      }
    },

    renameRun: async (runFolder, label) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      try {
        await window.flowChamber.runs.update(runFolder, { label: trimmed });
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] renameRun failed:", e);
      }
    },

    moveRunToGroup: async (runFolder, groupId) => {
      try {
        await window.flowChamber.runs.update(runFolder, { group_id: groupId });
        await get().refreshLibrary();
      } catch (e) {
        console.error("[runtime] moveRunToGroup failed:", e);
      }
    },

    toggleSidebar: () => {
      const next = !get().sidebarOpen;
      set({ sidebarOpen: next });
      void window.flowChamber.settings.set("sidebarOpen", next);
    },

    hydrateFromSettings: async () => {
      try {
        const port = await window.flowChamber.settings.get<string | null>("port");
        const operatorName = await window.flowChamber.settings.get<string>("operatorName");
        const calibration =
          await window.flowChamber.settings.get<CalibrationConstants>("calibration");
        const lastStudyFolder =
          await window.flowChamber.settings.get<string | null>("lastStudyFolder");
        const sidebarOpen =
          await window.flowChamber.settings.get<boolean>("sidebarOpen");
        set({
          selectedPort: port ?? null,
          operatorName: operatorName ?? "",
          calibration: calibration ?? { ...DEFAULT_CALIBRATION },
          studyFolder: lastStudyFolder ?? null,
          sidebarOpen: sidebarOpen ?? true,
        });
      } catch (e) {
        // Renderer may load before main is ready; non-fatal
        console.warn("[runtime] Failed to hydrate settings:", e);
      }
    },
  };
});

// Auto-connect mock + hydrate settings on store creation
void useRuntimeStore.getState().connectMock();
void useRuntimeStore
  .getState()
  .hydrateFromSettings()
  .then(() => {
    // After hydration, if a study folder was persisted, load its tree so the
    // sidebar populates on launch instead of waiting for the user to re-open.
    const folder = useRuntimeStore.getState().studyFolder;
    if (folder) void useRuntimeStore.getState().openStudy(folder);
  });

// Wire the App-menu "Open Demo Study" / "Open Study Folder…" entries through
// to the openStudy action. Main process pushes the folder path on click.
window.flowChamber.studies.onOpenRequest((folder) => {
  void useRuntimeStore.getState().openStudy(folder);
});
