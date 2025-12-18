import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export type PartyKey = "DPK" | "PPP" |  "JP" | "GAE" | "CHO" | "OTHER" | "TOSSUP";

export const PARTY_LABEL: Record<PartyKey, string> = {
  PPP: "국민의힘",
  DPK: "더불어민주당",
  JP: "진보당",
  GAE: "개혁신당",
  CHO: "조국혁신당",
  OTHER: "무소속",
  TOSSUP: "미정",
};




export const PARTY_COLOR: Record<PartyKey, string> = {
  PPP: "#e11d48",
  DPK: "#2563eb",
  JP: "#782B90",
  GAE: "#FF7210",
  CHO: "#06275E",
  OTHER: "#6b7280",
  TOSSUP: "#e5e7eb",
};

export const CYCLE: PartyKey[] = ["TOSSUP", "DPK",  "PPP","CHO", "JP",  "GAE",  "OTHER"];

export type MapAssignment = Record<string, PartyKey>;

export function encodeAssignment(a: MapAssignment): string {
  return compressToEncodedURIComponent(JSON.stringify(a));
}

export function decodeAssignment(s: string | null): MapAssignment | null {
  if (!s) return null;
  try {
    const raw = decompressFromEncodedURIComponent(s);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as MapAssignment;
    return null;
  } catch {
    return null;
  }
}
