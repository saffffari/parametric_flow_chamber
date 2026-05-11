/**
 * Group — a colored label organizing runs within a study.
 *
 * Flat (no nesting). Runs belong to exactly one group (or none at study root).
 * Multi-group membership and nested groups are deferred to future versions.
 */

export type GroupPurpose = "control" | "experimental" | "quality" | "" | string;

export interface Group {
  id: string;
  name: string;
  /** Hex color matching theme palette. */
  color: string;
  purpose: GroupPurpose;
}

export interface GroupJson {
  id: string;
  name: string;
  color: string;
  purpose: string;
}

export function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: overrides.id ?? `grp_${cryptoRandomHex(8)}`,
    name: overrides.name ?? "Untitled",
    color: overrides.color ?? "#638BFF",
    purpose: overrides.purpose ?? "",
  };
}

export function groupToJson(g: Group): GroupJson {
  return { id: g.id, name: g.name, color: g.color, purpose: g.purpose };
}

export function groupFromJson(j: GroupJson): Group {
  return {
    id: j.id ?? `grp_${cryptoRandomHex(8)}`,
    name: j.name ?? "Untitled",
    color: j.color ?? "#638BFF",
    purpose: j.purpose ?? "",
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
