export type CsvRow = Record<string, string>;

export function parseCSV(text: string): CsvRow[] {
  // Simple CSV parser (handles commas + quotes).
  const rows: string[][] = [];
  let cur = "";
  let inQuotes = false;
  let row: string[] = [];

  const pushCell = () => { row.push(cur); cur = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") pushCell();
      else if (ch === "\n") { pushCell(); pushRow(); }
      else if (ch === "\r") { /* ignore */ }
      else cur += ch;
    }
  }
  // trailing
  if (cur.length > 0 || row.length > 0) { pushCell(); pushRow(); }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const out: CsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => (c ?? "").trim() === "")) continue;
    const obj: CsvRow = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = (r[j] ?? "").trim();
    out.push(obj);
  }
  return out;
}

export function toCSV(rows: CsvRow[], header?: string[]): string {
  const keys = header ?? (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v: string) => {
    const s = v ?? "";
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [
    keys.map(esc).join(","),
    ...rows.map((r) => keys.map((k) => esc(r[k] ?? "")).join(",")),
  ];
  return lines.join("\n") + "\n";
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
