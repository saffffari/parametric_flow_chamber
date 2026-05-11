/**
 * Library sidebar — header + study tree.
 *
 * Header shows the section label (STUDY), the open study's title, and two
 * inline-action buttons: +group (create new) and +run (start a protocol run).
 * Opening / picking a study folder is now in the File menu — the explicit
 * "open" button used to live here but is redundant with the menu.
 *
 * Tree implementation lives in `library/StudyTree.tsx`. The tree handles
 * selection, multi-select, double-click rename, and per-row context menus.
 */

import { useRuntimeStore } from "@/state/runtime";
import { StudyTree } from "./library/StudyTree";

export function Sidebar() {
  const study = useRuntimeStore((s) => s.study);
  const studyFolder = useRuntimeStore((s) => s.studyFolder);
  const connectionState = useRuntimeStore((s) => s.connectionState);
  const runState = useRuntimeStore((s) => s.runState);
  const createGroup = useRuntimeStore((s) => s.createGroup);
  const startRun = useRuntimeStore((s) => s.startRun);

  const canStart =
    !!studyFolder &&
    connectionState === "connected" &&
    runState === "IDLE";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="font-mono text-[14px] uppercase tracking-[0.2em] text-muted/70">
          Study
        </div>
        <div className="mt-1 truncate font-mono text-sm text-foreground">
          {study?.meta.title ?? "No study open"}
        </div>
        {study && (
          <div className="mt-2 flex items-center gap-2">
            <SidebarChipButton
              onClick={() => void createGroup({ name: "New group" })}
              title="Create a new group. Double-click to rename."
            >
              +group
            </SidebarChipButton>
            <SidebarChipButton
              onClick={() => void startRun()}
              disabled={!canStart}
              title={
                canStart
                  ? "Start a new run with the current settings"
                  : "Connect to firmware and open a study to start a run"
              }
            >
              +run
            </SidebarChipButton>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto">
        <StudyTree />
      </div>
    </div>
  );
}

function SidebarChipButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="
        rounded-sm border border-border bg-surface-overlay px-2 py-0.5
        font-mono text-[13px] lowercase tracking-wider text-muted
        hover:border-accent hover:text-accent
        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted
      "
    >
      {children}
    </button>
  );
}
