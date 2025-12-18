"use client";

import { useEffect, useMemo, useState } from "react";
import GeoMap from "./GeoMap";
import Nav from "./Nav";
import {
  CYCLE,
  decodeAssignment,
  encodeAssignment,
  MapAssignment,
  PartyKey,
  PARTY_COLOR,
  PARTY_LABEL,
} from "../lib/mapState";
import { CsvRow, downloadTextFile, parseCSV, toCSV } from "../lib/csv";

type Region = { id: string; name: string; [k: string]: any };
type Hover = { id: string; name: string } | null;

function emptyAssignment(regions: Region[]): MapAssignment {
  const a: MapAssignment = {};
  for (const r of regions) a[r.id] = "TOSSUP";
  return a;
}

function nextParty(cur: PartyKey): PartyKey {
  const idx = CYCLE.indexOf(cur);
  return CYCLE[(idx + 1) % CYCLE.length];
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function TwoPaneMapPage({
  title,
  level,
  geoUrl,
  regionsUrl,
  pastResultsCsvUrl,
  candidatesCsvUrl,
  urlKey,
}: {
  title: string;
  level: "governor" | "sigungu";
  geoUrl: string;
  regionsUrl: string;
  pastResultsCsvUrl: string;
  candidatesCsvUrl: string;
  urlKey: string; // query param key for share state
}) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [assignment, setAssignment] = useState<MapAssignment>({});
  const [hover, setHover] = useState<Hover>(null);

  const [pastRows, setPastRows] = useState<CsvRow[]>([]);
  const [candidateRows, setCandidateRows] = useState<CsvRow[]>([]);

  // Load regions + CSVs
  useEffect(() => {
    (async () => {
      const reg = await fetch(regionsUrl).then((x) => x.json());
      setRegions(reg);
      const pastText = await fetch(pastResultsCsvUrl).then((x) => x.text());
      setPastRows(parseCSV(pastText));
      const candText = await fetch(candidatesCsvUrl).then((x) => x.text());
      setCandidateRows(parseCSV(candText));
    })();
  }, [regionsUrl, pastResultsCsvUrl, candidatesCsvUrl]);

  // Initialize from URL
  useEffect(() => {
    if (regions.length === 0) return;
    const url = new URL(window.location.href);
    const m = url.searchParams.get(urlKey);
    const decoded = decodeAssignment(m);
    if (decoded) setAssignment({ ...emptyAssignment(regions), ...decoded });
    else setAssignment(emptyAssignment(regions));
  }, [regions.length, urlKey]);

  // Sync URL
  useEffect(() => {
    if (regions.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set(urlKey, encodeAssignment(assignment));
    window.history.replaceState({}, "", url.toString());
  }, [assignment, regions.length, urlKey]);

  const counts = useMemo(() => {
    const c: Record<PartyKey, number> = {DPK: 0, PPP: 0, JP: 0, GAE:0, CHO: 0, OTHER: 0, TOSSUP: 0 };
    for (const id of Object.keys(assignment)) c[assignment[id]]++;
    return c;
  }, [assignment]);

  const hoverPast = useMemo(() => {
    if (!hover) return [];
    const rows = pastRows
      .filter((r) => (r["level"] ?? "").toLowerCase() === level && (r["region_id"] ?? "") === hover.id)
      .sort((a, b) => Number(b["year"] ?? 0) - Number(a["year"] ?? 0));
    return rows.slice(0, 8);
  }, [hover, pastRows, level]);

  const hoverCandidates = useMemo(() => {
    if (!hover) return [];
    const rows = candidateRows
      .filter((r) => (r["level"] ?? "").toLowerCase() === level && (r["region_id"] ?? "") === hover.id)
      .sort((a, b) => Number(b["year"] ?? 0) - Number(a["year"] ?? 0));
    return rows.slice(0, 12);
  }, [hover, candidateRows, level]);

  const downloadSelection = () => {
    const rows: CsvRow[] = regions.map((r) => ({
      level,
      region_id: r.id,
      region_name: r.name,
      selected_party: assignment[r.id] ?? "TOSSUP",
      selected_party_label: PARTY_LABEL[(assignment[r.id] ?? "TOSSUP") as PartyKey],
    }));
    const csv = toCSV(rows, ["level", "region_id", "region_name", "selected_party", "selected_party_label"]);
    downloadTextFile(`selection_${level}_${nowStamp()}.csv`, csv);
  };
  const DISABLED_SIGUNGU = new Set([
    "50110", // 제주시 (네 JSON id로 교체)
    "50130", // 서귀포시 (네 JSON id로 교체)
  ]);

  return (
    <main className="container">
      <Nav />

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
            <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
               
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setAssignment(emptyAssignment(regions))}>
              초기화
            </button>
            <button className="btn btnPrimary" onClick={downloadSelection}>
              선택 결과 CSV 다운로드
            </button>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          {([ "DPK", "PPP", "CHO", "JP", "GAE",  "OTHER", "TOSSUP"] as PartyKey[]).map((k) => (
            <span key={k} className="pill">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: PARTY_COLOR[k],
                  display: "inline-block",
                  border: "1px solid #ddd",
                }}
              />
              <b>{PARTY_LABEL[k]}</b>
              <span className="muted">{counts[k]}</span>
            </span>
          ))}
          <span className="pill">
            <span className="muted">클릭 순서:</span> 의석순
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 0.85fr", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <GeoMap
            title={title}
            geoUrl={geoUrl}
            assignment={assignment}
            enableZoom={level === "sigungu"}
            onHoverRegion={(h) => {
              if (level === "sigungu" && h && DISABLED_SIGUNGU.has(h.id)) {
                setHover(null); // ✅ 패널/표시 전부 숨김
                return;
              }
              setHover(h);
            }}
            
            onClickRegion={(id) => {
              if (level === "sigungu" && DISABLED_SIGUNGU.has(id)) return; // ✅ 클릭 무시
              setAssignment((prev) => ({ ...prev, [id]: nextParty((prev[id] ?? "TOSSUP") as PartyKey) }));
            }}
          />
        </div>

        <aside className="card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>지역 상세</h2>

          {hover ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{hover.name}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                 
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="kpi card" style={{ borderRadius: 14 }}>
                  <h3>예측</h3>
                  <div>{PARTY_LABEL[(assignment[hover.id] ?? "TOSSUP") as PartyKey]}</div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>과거 선거 결과</div>
                {hoverPast.length === 0 ? (
                  <div className="muted" style={{ lineHeight: 1.6 }}>
                    추가예정
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>연도</th>
                        <th>당선</th>
                        <th>정당</th>
                        <th>득표율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoverPast.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r["year"]}</td>
                          <td>{r["winner_name"]}</td>
                          <td>{r["winner_party"]}</td>
                          <td>{r["vote_share"]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>후보자</div>
                {hoverCandidates.length === 0 ? (
                  <div className="muted" style={{ lineHeight: 1.6 }}>
                    추가예정
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>연도</th>
                        <th>후보</th>
                        <th>정당</th>
                        <th>현직</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoverCandidates.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r["year"]}</td>
                          <td>{r["candidate_name"]}</td>
                          <td>{r["party"]}</td>
                          <td>{r["incumbent"]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="muted"> </div>
          )}

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        </aside>
      </div>
    </main>
  );
}
