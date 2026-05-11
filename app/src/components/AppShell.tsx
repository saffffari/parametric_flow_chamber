import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Sidebar } from "./Sidebar";
import { ControlPanel } from "./ControlPanel";
import { SettingsDrawer } from "./SettingsDrawer";
import { FirmwareConsole } from "./FirmwareConsole";
import { useRuntimeStore } from "@/state/runtime";

// `-webkit-app-region` lives outside the standard React typings; cast through.
const DRAG: CSSProperties = { WebkitAppRegion: "drag" } as CSSProperties;
const NO_DRAG: CSSProperties = { WebkitAppRegion: "no-drag" } as CSSProperties;

export function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const sidebarOpen = useRuntimeStore((s) => s.sidebarOpen);
  const toggleSidebar = useRuntimeStore((s) => s.toggleSidebar);

  // Status (from the old footer).
  const interfaceMode = useRuntimeStore((s) => s.interfaceMode);
  const connectionState = useRuntimeStore((s) => s.connectionState);
  const runState = useRuntimeStore((s) => s.runState);
  const studyFolder = useRuntimeStore((s) => s.studyFolder);
  const activeRun = useRuntimeStore((s) => s.activeRun);
  const lastRunFolder = useRuntimeStore((s) => s.lastRunFolder);
  const linkImaging = useRuntimeStore((s) => s.linkImaging);
  const openStudy = useRuntimeStore((s) => s.openStudy);

  // Subscribe to the native menu events. The Electron menu is still
  // registered (so accelerators continue to fire) but the menu *bar* is not
  // visible — the custom title bar below renders the dropdowns instead.
  useEffect(() => {
    const offSettings = window.flowChamber.onOpenSettings(() =>
      setSettingsOpen((open) => !open),
    );
    const offLink = window.flowChamber.onLinkImage(() => void linkImaging());
    const offOpenLast = window.flowChamber.onOpenLastRun(() => {
      const target = activeRun?.runFolder ?? lastRunFolder;
      if (target) void window.flowChamber.runs.openFolder(target);
    });
    const offSidebar = window.flowChamber.onToggleSidebar(() => toggleSidebar());
    const offConsole = window.flowChamber.onToggleConsole(() =>
      setConsoleOpen((open) => !open),
    );
    const offMax = window.flowChamber.onMaxStateChange(setIsMaximized);
    void window.flowChamber.windowIsMaximized().then(setIsMaximized);
    return () => {
      offSettings();
      offLink();
      offOpenLast();
      offSidebar();
      offConsole();
      offMax();
    };
  }, [linkImaging, toggleSidebar, activeRun, lastRunFolder]);

  // Picker helpers used by the custom File menu.
  const handleOpenStudyPicker = async () => {
    const folder = await window.flowChamber.studies.pickFolder();
    if (folder) await openStudy(folder);
  };
  const handleOpenLastRun = () => {
    const target = activeRun?.runFolder ?? lastRunFolder;
    if (target) void window.flowChamber.runs.openFolder(target);
  };

  return (
    <div className="flex h-screen flex-col bg-surface text-foreground">
      {/* Custom title bar. Single-line: logo / menus / protocol / status /
          window controls all share one row. The sidebar disclosure caret has
          been demoted to its own thin strip below the bar (see below). Same
          surface as the panel, no border. Drag region across the strip;
          menu buttons and window controls opt out via NO_DRAG. */}
      <header
        className="flex shrink-0 items-center gap-3 bg-surface px-3 py-1.5"
        style={DRAG}
      >
        <div
          className="shrink-0 px-2 py-0.5 font-mono text-[13px] text-foreground"
          style={NO_DRAG}
        >
          Flow Chamber
        </div>

        {/* Menus. Each opens a Radix dropdown wired to the same IPC actions
            the native menu uses. */}
        <nav className="flex shrink-0 items-center gap-1" style={NO_DRAG}>
          <MenuButton label="File">
            <MenuItem
              shortcut="Ctrl+D"
              onSelect={() => void window.flowChamber.openDemoStudy()}
            >
              Open Demo Study
            </MenuItem>
            <MenuItem
              shortcut="Ctrl+O"
              onSelect={() => void handleOpenStudyPicker()}
            >
              Open Study Folder…
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => void linkImaging()}>Link Image…</MenuItem>
            <MenuItem
              onSelect={handleOpenLastRun}
              disabled={!activeRun && !lastRunFolder}
            >
              Open Last Run
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              shortcut="Ctrl+,"
              onSelect={() => setSettingsOpen(true)}
            >
              Settings…
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onSelect={() => void window.flowChamber.windowClose()}
            >
              Quit
            </MenuItem>
          </MenuButton>

          <MenuButton label="Edit">
            <MenuItem
              shortcut="Ctrl+Z"
              onSelect={() => void window.flowChamber.editUndo()}
            >
              Undo
            </MenuItem>
            <MenuItem
              shortcut="Ctrl+Y"
              onSelect={() => void window.flowChamber.editRedo()}
            >
              Redo
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              shortcut="Ctrl+X"
              onSelect={() => void window.flowChamber.editCut()}
            >
              Cut
            </MenuItem>
            <MenuItem
              shortcut="Ctrl+C"
              onSelect={() => void window.flowChamber.editCopy()}
            >
              Copy
            </MenuItem>
            <MenuItem
              shortcut="Ctrl+V"
              onSelect={() => void window.flowChamber.editPaste()}
            >
              Paste
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              shortcut="Ctrl+A"
              onSelect={() => void window.flowChamber.editSelectAll()}
            >
              Select All
            </MenuItem>
          </MenuButton>

          <MenuButton label="View">
            <MenuItem
              shortcut="Ctrl+B"
              onSelect={() => toggleSidebar()}
            >
              Sidebar
            </MenuItem>
            <MenuItem
              shortcut="Ctrl+`"
              onSelect={() => setConsoleOpen((open) => !open)}
            >
              Console
            </MenuItem>
          </MenuButton>
        </nav>

        {/* Middle: empty draggable spacer. */}
        <div className="min-w-0 flex-1" aria-hidden="true" />

        {/* Right cluster: status pulled from the old footer, then the
            window-control trio. */}
        <div
          className="flex shrink-0 items-center gap-3 font-mono text-[13px] text-muted"
          style={NO_DRAG}
        >
          <ConnectionDot state={connectionState} />
          <span className="uppercase tracking-wider">{interfaceMode}</span>
          <span className="uppercase tracking-wider">{connectionState}</span>
          {studyFolder && (
            <span className="max-w-[200px] truncate text-muted/60" title={studyFolder}>
              {studyFolder.split(/[/\\]/).pop()}
            </span>
          )}
          <span className="uppercase tracking-wider">{runState}</span>
        </div>

        <div className="flex shrink-0 items-center" style={NO_DRAG}>
          <WindowButton
            aria-label="Minimize"
            onClick={() => void window.flowChamber.windowMinimize()}
          >
            {/* Em-dash sits a touch low; nudge optical center */}
            <span style={{ display: "inline-block", transform: "translateY(-3px)" }}>
              –
            </span>
          </WindowButton>
          <WindowButton
            aria-label={isMaximized ? "Restore" : "Maximize"}
            onClick={() => void window.flowChamber.windowMaxToggle()}
          >
            {isMaximized ? "❐" : "▢"}
          </WindowButton>
          <WindowButton
            aria-label="Close"
            danger
            onClick={() => void window.flowChamber.windowClose()}
          >
            ✕
          </WindowButton>
        </div>
      </header>

      {/* Sidebar disclosure caret strip. Caret on the far left; RUN label
          starts right next to it as the column header for the run-control
          stack below (CHANNEL + RUN knobs + TRANSPORT). */}
      <div className="flex shrink-0 items-center gap-3 px-3 pb-1">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Hide library" : "Show library"}
          title={sidebarOpen ? "Hide library" : "Show library"}
          className="
            -ml-1 font-mono text-3xl leading-none text-muted
            transition-colors hover:text-accent focus:outline-none
          "
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
        <span className="font-mono text-[13px] uppercase tracking-[0.25em] text-muted/60">
          Run
        </span>
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="flex min-h-0 w-64 shrink-0 flex-col border-r border-border bg-surface-raised">
            <Sidebar />
          </aside>
        )}
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <ControlPanel />
        </div>
      </main>
      <FirmwareConsole open={consoleOpen} />

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function ConnectionDot({ state }: { state: string }) {
  const color =
    state === "connected"
      ? "bg-status-ok"
      : state === "connecting"
        ? "bg-accent"
        : state === "error"
          ? "bg-status-fault"
          : "bg-muted/40";
  return <div className={`h-2 w-2 rounded-full ${color}`} />;
}

// -------------------------------------------------------------------------
// Menu primitives
// -------------------------------------------------------------------------

function MenuButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="
            rounded-sm px-2 py-0.5
            font-mono text-[13px] text-foreground
            hover:bg-surface-overlay
            data-[state=open]:bg-surface-overlay
            focus:outline-none
          "
        >
          {label}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={2}
          align="start"
          className="
            z-50 min-w-[12rem] rounded-sm border border-border bg-surface-raised p-1
            font-mono text-[13px] text-foreground shadow-lg
          "
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  children,
  onSelect,
  shortcut,
  disabled,
  danger,
  hidden,
}: {
  children?: ReactNode;
  onSelect: () => void;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={`
        flex cursor-default select-none items-center justify-between gap-4
        rounded-sm px-2 py-1.5 outline-none
        data-[highlighted]:bg-surface-overlay
        data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40
        ${danger ? "text-status-fault" : "text-foreground"}
      `}
    >
      <span>{children}</span>
      {shortcut && <span className="text-muted/60">{shortcut}</span>}
    </DropdownMenu.Item>
  );
}

function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-border" />;
}

function WindowButton({
  children,
  onClick,
  danger,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={`
        inline-flex h-7 w-9 items-center justify-center
        font-mono text-[14px] text-muted
        transition-colors focus:outline-none
        ${danger ? "hover:bg-status-fault hover:text-foreground" : "hover:bg-surface-overlay"}
      `}
    >
      {children}
    </button>
  );
}
