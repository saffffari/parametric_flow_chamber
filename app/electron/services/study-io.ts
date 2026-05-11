/**
 * Study / run / protocol filesystem I/O (main process).
 *
 * Wraps fs-extra to provide the persistence layer the renderer needs via IPC.
 * Wire format is identical to the Python v0.1 controller — see
 * `app/src/domain/storage/` for the schema definitions.
 *
 * On-disk layout:
 *   <study>/
 *     study.json
 *     protocols/<name>.json
 *     runs/<timestamp_label>/
 *       metadata.json
 *       system.json
 *       protocol.json
 *       telemetry.csv
 *       events.csv
 *       notes.md
 *     _trash/
 */

import path from "node:path";
import fsExtra from "fs-extra";

import type {
  GroupJson,
  ImagingLinkJson,
  ProtocolJson,
  RunMetadataJson,
  StudyJson,
  StudyMetaJson,
  SystemSnapshotJson,
  TelemetrySample,
} from "../shared/types";

const TELEMETRY_HEADER =
  "timestamp_us,run_time_s,state," +
  "commanded_shear_pa,commanded_flow_ml_min,commanded_step_rate_hz," +
  "temp_reservoir_c,trigger_count,fault_code\n";

const EVENTS_HEADER = "timestamp_us,event_type,detail\n";

export class StudyIo {
  // ----------------------------------------------------------------------
  // Studies
  // ----------------------------------------------------------------------

  async openStudy(folder: string): Promise<StudyJson | null> {
    const studyPath = path.join(folder, "study.json");
    if (!(await fsExtra.pathExists(studyPath))) return null;
    return (await fsExtra.readJson(studyPath)) as StudyJson;
  }

  async createStudy(folder: string, title: string): Promise<StudyJson> {
    if (await fsExtra.pathExists(folder)) {
      const existing = await fsExtra.readdir(folder);
      if (existing.length > 0) {
        throw new Error(`Folder is not empty: ${folder}`);
      }
    }
    await fsExtra.ensureDir(folder);
    await fsExtra.ensureDir(path.join(folder, "runs"));
    await fsExtra.ensureDir(path.join(folder, "protocols"));

    const now = new Date().toISOString();
    const meta: StudyMetaJson = {
      schema: "flowchamber-study/v1",
      id: `std_${randomHex(6)}`,
      title,
      authors: "",
      affiliation: "",
      target_journal: "",
      hypothesis: "",
      status: "draft",
      doi: "",
      created_at: now,
      last_modified_at: now,
    };
    const groups: GroupJson[] = [
      { id: `grp_${randomHex(8)}`, name: "Controls", color: "#638BFF", purpose: "control" },
      { id: `grp_${randomHex(8)}`, name: "Experimental", color: "#FF395D", purpose: "experimental" },
    ];

    const study: StudyJson = {
      schema: "flowchamber-study/v1",
      meta,
      groups,
    };
    await fsExtra.writeJson(path.join(folder, "study.json"), study, { spaces: 2 });
    return study;
  }

  async saveStudy(folder: string, study: StudyJson): Promise<void> {
    study.meta.last_modified_at = new Date().toISOString();
    await fsExtra.writeJson(path.join(folder, "study.json"), study, { spaces: 2 });
  }

  /**
   * Patch the meta fields of an existing study (title, authors, etc.) and
   * persist. The `id` and timestamps are protected from clobber.
   */
  async updateStudyMeta(
    folder: string,
    patch: Partial<Omit<StudyMetaJson, "id" | "created_at" | "last_modified_at">>,
  ): Promise<StudyJson | null> {
    const study = await this.openStudy(folder);
    if (!study) return null;
    Object.assign(study.meta, patch);
    await this.saveStudy(folder, study);
    return study;
  }

  // ----------------------------------------------------------------------
  // Groups (live in study.json)
  // ----------------------------------------------------------------------

  async createGroup(
    folder: string,
    init: { name: string; color?: string; purpose?: string },
  ): Promise<GroupJson> {
    const study = await this.openStudy(folder);
    if (!study) throw new Error(`No study at ${folder}`);
    const group: GroupJson = {
      id: `grp_${randomHex(8)}`,
      name: init.name,
      color: init.color ?? "#A0A0A0",
      purpose: init.purpose ?? "",
    };
    study.groups.push(group);
    await this.saveStudy(folder, study);
    return group;
  }

  async updateGroup(
    folder: string,
    groupId: string,
    patch: Partial<Omit<GroupJson, "id">>,
  ): Promise<GroupJson | null> {
    const study = await this.openStudy(folder);
    if (!study) throw new Error(`No study at ${folder}`);
    const group = study.groups.find((g) => g.id === groupId);
    if (!group) return null;
    if (patch.name !== undefined) group.name = patch.name;
    if (patch.color !== undefined) group.color = patch.color;
    if (patch.purpose !== undefined) group.purpose = patch.purpose;
    await this.saveStudy(folder, study);
    return group;
  }

  /**
   * Remove a group from the study. Any run whose `metadata.group_id ===
   * groupId` gets reassigned to `null` (becomes "Ungrouped" in the UI). No
   * run data is destroyed.
   */
  async deleteGroup(folder: string, groupId: string): Promise<void> {
    const study = await this.openStudy(folder);
    if (!study) throw new Error(`No study at ${folder}`);
    const before = study.groups.length;
    study.groups = study.groups.filter((g) => g.id !== groupId);
    if (study.groups.length === before) return; // no-op if not found

    // Reassign orphaned runs
    const runs = await this.listRuns(folder);
    for (const r of runs) {
      if (r.metadata.group_id === groupId) {
        r.metadata.group_id = null;
        await fsExtra.writeJson(path.join(r.folder, "metadata.json"), r.metadata, {
          spaces: 2,
        });
      }
    }
    await this.saveStudy(folder, study);
  }

  /**
   * Destructively delete a run folder (and everything inside it). The caller
   * is expected to confirm with the operator before invoking — there is no
   * second prompt here.
   */
  async deleteRun(runFolder: string): Promise<void> {
    if (!runFolder) return;
    if (!(await fsExtra.pathExists(runFolder))) return;
    await fsExtra.remove(runFolder);
  }

  async listProtocols(folder: string): Promise<ProtocolJson[]> {
    const dir = path.join(folder, "protocols");
    if (!(await fsExtra.pathExists(dir))) return [];
    const entries = await fsExtra.readdir(dir);
    const protocols: ProtocolJson[] = [];
    for (const entry of entries.sort()) {
      if (!entry.endsWith(".json")) continue;
      try {
        protocols.push(await fsExtra.readJson(path.join(dir, entry)));
      } catch {
        // skip unreadable
      }
    }
    return protocols;
  }

  async saveProtocol(folder: string, protocol: ProtocolJson): Promise<void> {
    const dir = path.join(folder, "protocols");
    await fsExtra.ensureDir(dir);
    const filename = `${sanitizeFilename(protocol.name)}.json`;
    await fsExtra.writeJson(path.join(dir, filename), protocol, { spaces: 2 });
  }

  // ----------------------------------------------------------------------
  // Runs
  // ----------------------------------------------------------------------

  async listRuns(folder: string): Promise<
    { folder: string; metadata: RunMetadataJson }[]
  > {
    const runsDir = path.join(folder, "runs");
    if (!(await fsExtra.pathExists(runsDir))) return [];
    const entries = await fsExtra.readdir(runsDir);
    const runs: { folder: string; metadata: RunMetadataJson }[] = [];
    for (const entry of entries.sort()) {
      const runFolder = path.join(runsDir, entry);
      const metadataPath = path.join(runFolder, "metadata.json");
      if (!(await fsExtra.pathExists(metadataPath))) continue;
      try {
        const metadata = (await fsExtra.readJson(metadataPath)) as RunMetadataJson;
        runs.push({ folder: runFolder, metadata });
      } catch {
        // skip unreadable
      }
    }
    return runs;
  }

  async createRun(
    studyFolder: string,
    metadata: RunMetadataJson,
    system: SystemSnapshotJson,
    protocol: ProtocolJson,
  ): Promise<{ folder: string }> {
    const runsDir = path.join(studyFolder, "runs");
    await fsExtra.ensureDir(runsDir);

    const folderName = makeRunFolderName(metadata.started_at, metadata.label);
    const runFolder = path.join(runsDir, folderName);
    if (await fsExtra.pathExists(runFolder)) {
      throw new Error(`Run folder already exists: ${runFolder}`);
    }
    await fsExtra.ensureDir(runFolder);

    await fsExtra.writeJson(path.join(runFolder, "metadata.json"), metadata, { spaces: 2 });
    await fsExtra.writeJson(path.join(runFolder, "system.json"), system, { spaces: 2 });
    await fsExtra.writeJson(path.join(runFolder, "protocol.json"), protocol, { spaces: 2 });
    await fsExtra.writeFile(path.join(runFolder, "telemetry.csv"), TELEMETRY_HEADER, "utf8");
    await fsExtra.writeFile(path.join(runFolder, "events.csv"), EVENTS_HEADER, "utf8");
    await fsExtra.writeFile(path.join(runFolder, "notes.md"), "", "utf8");
    return { folder: runFolder };
  }

  async appendTelemetryBatch(
    runFolder: string,
    samples: TelemetrySample[],
  ): Promise<void> {
    if (samples.length === 0) return;
    const lines = samples
      .map((s) =>
        [
          s.timestampUs,
          s.runTimeS.toFixed(3),
          s.state,
          s.commandedShearPa.toFixed(3),
          s.commandedFlowMlMin.toFixed(3),
          s.commandedStepRateHz.toFixed(0),
          s.tempReservoirC.toFixed(2),
          s.triggerCount,
          s.faultCode,
        ].join(","),
      )
      .join("\n");
    await fsExtra.appendFile(path.join(runFolder, "telemetry.csv"), lines + "\n", "utf8");
  }

  async appendEvent(runFolder: string, eventType: string, detail: string): Promise<void> {
    const ts = Date.now() * 1000;
    const safe = detail.replaceAll("\n", " ").replaceAll(",", ";");
    await fsExtra.appendFile(
      path.join(runFolder, "events.csv"),
      `${ts},${eventType},${safe}\n`,
      "utf8",
    );
  }

  /**
   * Patch a run's `metadata.json`. Used for active toggle, group reassignment
   * ("move to group"), and label rename. Unknown keys are ignored — only the
   * three whitelisted fields below are writable.
   */
  async updateRun(
    runFolder: string,
    patch: { active?: boolean; group_id?: string | null; label?: string },
  ): Promise<RunMetadataJson | null> {
    const metadataPath = path.join(runFolder, "metadata.json");
    if (!(await fsExtra.pathExists(metadataPath))) return null;
    const metadata = (await fsExtra.readJson(metadataPath)) as RunMetadataJson;
    if (patch.active !== undefined) metadata.active = patch.active;
    if (patch.group_id !== undefined) metadata.group_id = patch.group_id;
    if (patch.label !== undefined) metadata.label = patch.label;
    await fsExtra.writeJson(metadataPath, metadata, { spaces: 2 });
    return metadata;
  }

  async finalizeRun(
    runFolder: string,
    stoppedAt: string,
    durationS: number,
    stopReason: string,
  ): Promise<void> {
    const metadataPath = path.join(runFolder, "metadata.json");
    if (!(await fsExtra.pathExists(metadataPath))) return;
    const metadata = (await fsExtra.readJson(metadataPath)) as RunMetadataJson;
    metadata.stopped_at = stoppedAt;
    metadata.duration_s = durationS;
    metadata.stop_reason = stopReason;
    await fsExtra.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Attach an external imaging file (typically a Zeiss .czi from the LSM 880)
   * to a run. Writes `imaging_link.json` next to metadata.json.
   *
   * If the file exists at link-time, fills size_bytes and acquired_at from
   * fs.stat. If not, both are zero/empty — operator can pre-link a path
   * before Zen finishes writing it. Format is derived from the file
   * extension (.czi → "czi"). sha256 is left empty; computing it on a
   * multi-GB CZI is slow and not load-bearing for the link itself.
   */
  async linkRunImaging(
    runFolder: string,
    externalPath: string,
  ): Promise<ImagingLinkJson> {
    if (!(await fsExtra.pathExists(runFolder))) {
      throw new Error(`Run folder does not exist: ${runFolder}`);
    }

    let sizeBytes = 0;
    let acquiredAt = "";
    try {
      const stat = await fsExtra.stat(externalPath);
      if (stat.isFile()) {
        sizeBytes = stat.size;
        acquiredAt = stat.mtime.toISOString();
      }
    } catch {
      // File doesn't exist yet — link the intended path anyway.
    }

    const ext = path.extname(externalPath).slice(1).toLowerCase();
    const link: ImagingLinkJson = {
      schema: "flowchamber-imaging-link/v1",
      external_path: externalPath,
      sha256: "",
      size_bytes: sizeBytes,
      format: ext || "unknown",
      acquired_at: acquiredAt,
      trigger_offset_us: 0,
    };

    await fsExtra.writeJson(path.join(runFolder, "imaging_link.json"), link, {
      spaces: 2,
    });
    return link;
  }
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function makeRunFolderName(startedAtIso: string, label: string): string {
  let stamp: string;
  try {
    const dt = new Date(startedAtIso);
    if (isNaN(dt.getTime())) throw new Error("invalid date");
    stamp = formatStamp(dt);
  } catch {
    stamp = formatStamp(new Date());
  }
  const safe = label
    .split("")
    .map((c) => (/[A-Za-z0-9_-]/.test(c) ? c : "_"))
    .join("")
    .slice(0, 64);
  return `${stamp}_${safe}`;
}

function formatStamp(d: Date): string {
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

function sanitizeFilename(name: string): string {
  return name
    .split("")
    .map((c) => (/[A-Za-z0-9_.-]/.test(c) ? c : "_"))
    .join("")
    .slice(0, 80);
}

function randomHex(byteLen: number): string {
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
