import { useRuntimeStore } from "@/state/runtime";

export function StatusBar() {
  const interfaceMode = useRuntimeStore((s) => s.interfaceMode);
  const connectionState = useRuntimeStore((s) => s.connectionState);
  const runState = useRuntimeStore((s) => s.runState);
  const studyFolder = useRuntimeStore((s) => s.studyFolder);
  const activeRun = useRuntimeStore((s) => s.activeRun);
  const lastRunFolder = useRuntimeStore((s) => s.lastRunFolder);
  const lastRunLabel = useRuntimeStore((s) => s.lastRunLabel);
  const lastImagingLink = useRuntimeStore((s) => s.lastImagingLink);
  const linkImaging = useRuntimeStore((s) => s.linkImaging);

  const runFolderTarget = activeRun?.runFolder ?? lastRunFolder;
  const runFolderLabel = activeRun ? "open run folder" : "open last run";
  const linkLabel = lastImagingLink ? "image linked ✓" : "link image…";

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 font-mono text-[14px] text-muted">
      <div className="flex items-center gap-4">
        <ConnectionDot state={connectionState} />
        <span className="uppercase tracking-wider">{interfaceMode}</span>
        <span className="uppercase tracking-wider">
          {connectionState}
        </span>
        {studyFolder && (
          <span className="text-muted/50 truncate max-w-[280px]" title={studyFolder}>
            study: {studyFolder.split(/[/\\]/).pop()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="uppercase tracking-wider">
          {runState}
        </span>
        {!activeRun && lastRunLabel && (
          <span className="text-muted/50 truncate max-w-[200px]" title={lastRunLabel}>
            last: {lastRunLabel}
          </span>
        )}
        {runFolderTarget && (
          <>
            <button
              type="button"
              onClick={() => void linkImaging()}
              title={
                lastImagingLink
                  ? `Linked: ${lastImagingLink} — click to replace`
                  : "Attach a .czi (or .tif/.ome.tif) file to this run"
              }
              className={
                lastImagingLink
                  ? "text-status-ok underline-offset-2 hover:underline"
                  : "text-accent underline-offset-2 hover:underline"
              }
            >
              {linkLabel}
            </button>
            <button
              type="button"
              onClick={() => void window.flowChamber.runs.openFolder(runFolderTarget)}
              className="text-accent underline-offset-2 hover:underline"
            >
              {runFolderLabel}
            </button>
          </>
        )}
      </div>
    </footer>
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
