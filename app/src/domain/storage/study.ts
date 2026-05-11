/**
 * Study — top-level research project archive.
 *
 * One folder containing all runs, groups, protocols, and notes for a single
 * research project (typically one paper). The folder is the unit of share /
 * backup / version-control.
 *
 * Filesystem layout:
 *   <study>/
 *     study.json             meta + groups
 *     protocols/             reusable protocol presets (.json each)
 *     runs/                  run subfolders
 *     _trash/                soft-deleted runs (recoverable until manual cleanup)
 *
 * In v2.0, filesystem I/O is delegated to the main process via IPC (`fs-extra`
 * is unavailable in the renderer due to electron sandboxing). This module
 * defines the in-memory model and JSON shape; see `app/src/lib/study-io.ts`
 * (renderer-side bridge) and `app/electron/study-io.ts` (main-process I/O)
 * for the bridge.
 */

import type { Group, GroupJson } from "./group";

export interface StudyMeta {
  id: string;
  title: string;
  authors: string;
  affiliation: string;
  targetJournal: string;
  hypothesis: string;
  status: "draft" | "submitted" | "published";
  doi: string;
  createdAt: string;
  lastModifiedAt: string;
}

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

/** On-disk study.json shape: meta + groups. */
export interface StudyJson {
  schema: "flowchamber-study/v1";
  meta: StudyMetaJson;
  groups: GroupJson[];
}

export interface Study {
  folder: string;
  meta: StudyMeta;
  groups: Group[];
}

export function makeStudyMeta(overrides: Partial<StudyMeta> = {}): StudyMeta {
  const now = new Date().toISOString();
  return {
    id: `std_${cryptoRandomHex(6)}`,
    title: "Untitled Study",
    authors: "",
    affiliation: "",
    targetJournal: "",
    hypothesis: "",
    status: "draft",
    doi: "",
    createdAt: now,
    lastModifiedAt: now,
    ...overrides,
  };
}

export function metaToJson(m: StudyMeta): StudyMetaJson {
  return {
    schema: "flowchamber-study/v1",
    id: m.id,
    title: m.title,
    authors: m.authors,
    affiliation: m.affiliation,
    target_journal: m.targetJournal,
    hypothesis: m.hypothesis,
    status: m.status,
    doi: m.doi,
    created_at: m.createdAt,
    last_modified_at: m.lastModifiedAt,
  };
}

export function metaFromJson(j: StudyMetaJson): StudyMeta {
  const status = (j.status ?? "draft") as StudyMeta["status"];
  return {
    id: j.id ?? `std_${cryptoRandomHex(6)}`,
    title: j.title ?? "Untitled Study",
    authors: j.authors ?? "",
    affiliation: j.affiliation ?? "",
    targetJournal: j.target_journal ?? "",
    hypothesis: j.hypothesis ?? "",
    status: status === "draft" || status === "submitted" || status === "published" ? status : "draft",
    doi: j.doi ?? "",
    createdAt: j.created_at ?? new Date().toISOString(),
    lastModifiedAt: j.last_modified_at ?? new Date().toISOString(),
  };
}

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
