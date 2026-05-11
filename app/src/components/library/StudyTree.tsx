/**
 * Library tree — study → groups → runs.
 *
 * Hand-rolled three-level recursive tree (no library; the depth is fixed and
 * the data is small). Right-click on any row opens a context menu via a
 * mouse-anchored Radix DropdownMenu. State lives in the runtime store
 * (study, runs, expandedNodes, selectedNode); mutations dispatch through
 * the store actions which then call refreshLibrary.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useRuntimeStore, type RunListEntry } from "@/state/runtime";
import type { GroupJson } from "@/domain/storage/group";

const UNGROUPED_ID = "__ungrouped__";

interface MenuPos {
  x: number;
  y: number;
}

function studyNodeId(studyId: string): string {
  return `study:${studyId}`;
}
function groupNodeId(groupId: string): string {
  return `group:${groupId}`;
}

// -------------------------------------------------------------------------
// Tree host
// -------------------------------------------------------------------------

export function StudyTree() {
  const study = useRuntimeStore((s) => s.study);
  const runs = useRuntimeStore((s) => s.runs);
  const expandedNodes = useRuntimeStore((s) => s.expandedNodes);
  const selectedNode = useRuntimeStore((s) => s.selectedNode);
  const toggle = useRuntimeStore((s) => s.toggleNodeExpansion);
  const select = useRuntimeStore((s) => s.selectNode);
  const createGroup = useRuntimeStore((s) => s.createGroup);
  const renameStudy = useRuntimeStore((s) => s.renameStudy);

  if (!study) {
    return (
      <div className="px-4 py-6 font-mono text-[14px] text-muted/60">
        No study open. Use File → Open Study Folder…
      </div>
    );
  }

  const studyId = studyNodeId(study.meta.id);
  const studyExpanded = expandedNodes.has(studyId);

  const ungroupedRuns = runs.filter((r) => !r.metadata.group_id);
  const groupsWithRuns = study.groups.map((g) => ({
    group: g,
    runs: runs.filter((r) => r.metadata.group_id === g.id),
  }));

  // Flat list of currently-visible run ids in display order. Range select
  // (shift-click) walks this array between anchor and target indices.
  // Groups that aren't expanded contribute no run ids — the anchor going
  // out-of-view falls back to single-select inside the store action.
  const flatRunIds: string[] = [];
  for (const { group, runs: gRuns } of groupsWithRuns) {
    if (expandedNodes.has(groupNodeId(group.id))) {
      for (const r of gRuns) flatRunIds.push(r.metadata.id);
    }
  }
  if (expandedNodes.has(groupNodeId(UNGROUPED_ID))) {
    for (const r of ungroupedRuns) flatRunIds.push(r.metadata.id);
  }

  return (
    <div role="tree" className="flex flex-col py-2 font-mono text-[12px]">
      <Row
        depth={0}
        chevron={studyExpanded ? "▾" : "▸"}
        onChevronClick={() => toggle(studyId)}
        onSelect={() => select({ kind: "study", id: study.meta.id })}
        onContext={() => undefined /* shown via menu wrapper */}
        onRename={(next) => void renameStudy(next)}
        selected={selectedNode?.kind === "study" && selectedNode.id === study.meta.id}
        labelMain={study.meta.title || "Untitled Study"}
        labelSecondary={`${runs.length} run${runs.length === 1 ? "" : "s"}`}
        contextMenu={
          <>
            <MenuItem
              onSelect={() => {
                const name = window.prompt("New group name:");
                if (name && name.trim()) void createGroup({ name: name.trim() });
              }}
            >
              New group…
            </MenuItem>
          </>
        }
      />
      {studyExpanded && (
        <>
          {groupsWithRuns.map(({ group, runs: gRuns }) => (
            <GroupBranch
              key={group.id}
              group={group}
              runs={gRuns}
              flatRunIds={flatRunIds}
            />
          ))}
          {ungroupedRuns.length > 0 && (
            <UngroupedBranch runs={ungroupedRuns} flatRunIds={flatRunIds} />
          )}
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// Group branches
// -------------------------------------------------------------------------

function GroupBranch({
  group,
  runs,
  flatRunIds,
}: {
  group: GroupJson;
  runs: RunListEntry[];
  flatRunIds: string[];
}) {
  const expanded = useRuntimeStore((s) => s.expandedNodes.has(groupNodeId(group.id)));
  const selected = useRuntimeStore(
    (s) => s.selectedNode?.kind === "group" && s.selectedNode.id === group.id,
  );
  const toggle = useRuntimeStore((s) => s.toggleNodeExpansion);
  const select = useRuntimeStore((s) => s.selectNode);
  const createGroup = useRuntimeStore((s) => s.createGroup);
  const updateGroup = useRuntimeStore((s) => s.updateGroup);
  const deleteGroup = useRuntimeStore((s) => s.deleteGroup);

  return (
    <>
      <Row
        depth={1}
        chevron={runs.length === 0 ? null : expanded ? "▾" : "▸"}
        onChevronClick={() => toggle(groupNodeId(group.id))}
        onSelect={() => select({ kind: "group", id: group.id })}
        onRename={(next) => void updateGroup(group.id, { name: next })}
        selected={selected}
        leadingSwatch={group.color}
        labelMain={group.name}
        labelSecondary={`${runs.length}`}
        contextMenu={
          <>
            <MenuItem
              onSelect={() => {
                const name = window.prompt("New group name:");
                if (name && name.trim()) void createGroup({ name: name.trim() });
              }}
            >
              New group…
            </MenuItem>
            <MenuItem
              onSelect={() => {
                const name = window.prompt("Rename group:", group.name);
                if (name && name.trim() && name !== group.name) {
                  void updateGroup(group.id, { name: name.trim() });
                }
              }}
            >
              Rename group…
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              danger
              onSelect={() => {
                const msg =
                  runs.length > 0
                    ? `Delete group "${group.name}"? Its ${runs.length} run${
                        runs.length === 1 ? "" : "s"
                      } will be reassigned to Ungrouped.`
                    : `Delete group "${group.name}"?`;
                if (window.confirm(msg)) void deleteGroup(group.id);
              }}
            >
              Delete group
            </MenuItem>
          </>
        }
      />
      {expanded && runs.map((r) => <RunRow key={r.folder} run={r} flatRunIds={flatRunIds} />)}
    </>
  );
}

function UngroupedBranch({
  runs,
  flatRunIds,
}: {
  runs: RunListEntry[];
  flatRunIds: string[];
}) {
  const expanded = useRuntimeStore((s) => s.expandedNodes.has(groupNodeId(UNGROUPED_ID)));
  const toggle = useRuntimeStore((s) => s.toggleNodeExpansion);
  return (
    <>
      <Row
        depth={1}
        chevron={runs.length === 0 ? null : expanded ? "▾" : "▸"}
        onChevronClick={() => toggle(groupNodeId(UNGROUPED_ID))}
        onSelect={() => undefined}
        selected={false}
        leadingSwatch="#888888"
        labelMain="Ungrouped"
        labelSecondary={`${runs.length}`}
      />
      {expanded && runs.map((r) => <RunRow key={r.folder} run={r} flatRunIds={flatRunIds} />)}
    </>
  );
}

// -------------------------------------------------------------------------
// Run row
// -------------------------------------------------------------------------

function RunRow({ run, flatRunIds }: { run: RunListEntry; flatRunIds: string[] }) {
  const study = useRuntimeStore((s) => s.study);
  const selected = useRuntimeStore((s) => s.selectedRunIds.has(run.metadata.id));
  const selectionCount = useRuntimeStore((s) => s.selectedRunIds.size);
  const selectRun = useRuntimeStore((s) => s.selectRun);
  const setRunActive = useRuntimeStore((s) => s.setRunActive);
  const moveRunToGroup = useRuntimeStore((s) => s.moveRunToGroup);
  const renameRun = useRuntimeStore((s) => s.renameRun);
  const deleteSelectedRuns = useRuntimeStore((s) => s.deleteSelectedRuns);

  const groups = study?.groups ?? [];
  const active = run.metadata.active !== false; // default true if unset

  // Multi-select count for context-menu copy. If the right-click target is
  // already in the selection, operate on the whole selection; otherwise the
  // operator probably wants the row they right-clicked, so we still show
  // "Delete run".
  const deleteScope = selected && selectionCount > 1 ? selectionCount : 1;
  const deleteLabel =
    deleteScope > 1 ? `Delete ${deleteScope} runs` : "Delete run";

  const handleSelect = (e?: React.MouseEvent) => {
    const mode: "single" | "toggle" | "range" =
      e?.shiftKey ? "range" : e?.ctrlKey || e?.metaKey ? "toggle" : "single";
    selectRun(run.metadata.id, mode, flatRunIds);
  };

  const handleDelete = () => {
    // If the right-clicked row isn't in the current selection, narrow the
    // selection to just this row before deleting — operators expect the
    // context-menu target to be the thing acted on.
    if (!selected) {
      selectRun(run.metadata.id, "single", flatRunIds);
    }
    const count = deleteScope;
    const msg =
      count > 1
        ? `Delete ${count} runs? This permanently removes their folders.`
        : `Delete "${run.metadata.label || run.metadata.id}"? This permanently removes the run folder.`;
    if (window.confirm(msg)) void deleteSelectedRuns();
  };

  return (
    <Row
      depth={2}
      chevron={null}
      onSelect={handleSelect}
      onRename={(next) => void renameRun(run.folder, next)}
      selected={selected}
      labelMain={run.metadata.label || run.metadata.id}
      dim={!active}
      contextMenu={
        <>
          <MenuItem onSelect={() => void setRunActive(run.folder, !active)}>
            {active ? "Mark inactive" : "Mark active"}
          </MenuItem>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger
              className="
                cursor-default select-none rounded-sm px-2 py-1.5 outline-none
                data-[highlighted]:bg-surface-overlay
                flex items-center justify-between text-foreground
              "
            >
              <span>Move to</span>
              <span className="text-muted/60">›</span>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={2}
                className="
                  min-w-[10rem] rounded-sm border border-border bg-surface-raised p-1
                  font-mono text-[14px] text-foreground shadow-lg
                "
              >
                {groups.map((g) => (
                  <MenuItem
                    key={g.id}
                    onSelect={() => void moveRunToGroup(run.folder, g.id)}
                  >
                    {g.name}
                  </MenuItem>
                ))}
                {groups.length > 0 && <MenuSeparator />}
                <MenuItem onSelect={() => void moveRunToGroup(run.folder, null)}>
                  Ungrouped
                </MenuItem>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          <MenuSeparator />
          <MenuItem
            onSelect={() => {
              void window.flowChamber.runs.openFolder(run.folder);
            }}
          >
            Open folder
          </MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={handleDelete}>
            {deleteLabel}
          </MenuItem>
        </>
      }
    />
  );
}

// -------------------------------------------------------------------------
// Generic row + context-menu wrapper
// -------------------------------------------------------------------------

interface RowProps {
  depth: number;
  chevron: string | null;
  onChevronClick?: () => void;
  /** Receives the click event so handlers can inspect shift/ctrl/meta. */
  onSelect: (e?: React.MouseEvent) => void;
  onContext?: () => void;
  selected: boolean;
  leadingSwatch?: string;
  labelMain: string;
  labelSecondary?: string;
  dim?: boolean;
  contextMenu?: ReactNode;
  /**
   * When provided, double-clicking the row replaces the label with an inline
   * input pre-filled with `labelMain`. Enter / blur commit by calling this
   * with the new string; Escape cancels. Empty / whitespace strings are
   * dropped.
   */
  onRename?: (next: string) => void;
}

function Row(props: RowProps) {
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(props.labelMain);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleContext = (e: React.MouseEvent) => {
    if (!props.contextMenu) return;
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    props.onContext?.();
  };

  const handleDoubleClick = () => {
    if (!props.onRename) return;
    setEditText(props.labelMain);
    setEditing(true);
  };

  const commitEdit = () => {
    if (!editing) return;
    const next = editText.trim();
    setEditing(false);
    if (next && next !== props.labelMain) props.onRename?.(next);
  };
  const cancelEdit = () => setEditing(false);

  const padding = 8 + props.depth * 12;

  const row = (
    <div
      role="treeitem"
      aria-selected={props.selected}
      onClick={(e) => {
        if (editing) return;
        props.onSelect(e);
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContext}
      className={`
        flex cursor-default select-none items-center gap-2
        py-1 pr-2
        ${props.selected ? "bg-surface-overlay" : "hover:bg-surface-overlay/60"}
      `}
      style={{ paddingLeft: padding }}
    >
      <span
        role={props.chevron ? "button" : undefined}
        onClick={
          props.chevron && props.onChevronClick
            ? (e) => {
                e.stopPropagation();
                props.onChevronClick?.();
              }
            : undefined
        }
        className="inline-flex w-3 justify-center text-[13px] text-muted/70"
      >
        {props.chevron ?? ""}
      </span>
      {props.leadingSwatch && (
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: props.leadingSwatch }}
        />
      )}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          onBlur={commitEdit}
          onClick={(e) => e.stopPropagation()}
          className="
            min-w-0 flex-1 rounded-sm border border-accent bg-surface-overlay
            px-1 py-0 font-mono text-[12px] text-foreground focus:outline-none
          "
        />
      ) : (
        <span
          className={`
            flex-1 truncate
            ${props.dim ? "text-muted italic" : "text-foreground"}
          `}
        >
          {props.labelMain}
        </span>
      )}
      {props.labelSecondary !== undefined && (
        <span className="text-[13px] text-muted/60">{props.labelSecondary}</span>
      )}
    </div>
  );

  if (!props.contextMenu) return row;

  return (
    <>
      {row}
      <DropdownMenu.Root
        open={menuPos !== null}
        onOpenChange={(open) => {
          if (!open) setMenuPos(null);
        }}
      >
        <DropdownMenu.Trigger asChild>
          <span
            aria-hidden
            style={{
              position: "fixed",
              left: menuPos?.x ?? 0,
              top: menuPos?.y ?? 0,
              width: 1,
              height: 1,
              pointerEvents: "none",
            }}
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={2}
            align="start"
            className="
              z-50 min-w-[12rem] rounded-sm border border-border bg-surface-raised p-1
              font-mono text-[14px] text-foreground shadow-lg
            "
          >
            {props.contextMenu}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
}

function MenuItem({
  onSelect,
  children,
  danger,
}: {
  onSelect: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`
        cursor-default select-none rounded-sm px-2 py-1.5 outline-none
        data-[highlighted]:bg-surface-overlay
        ${danger ? "text-status-fault" : "text-foreground"}
      `}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-border" />;
}
