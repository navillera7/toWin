"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { PARTY_COLOR, MapAssignment, PartyKey } from "../lib/mapState";

type Hover = { id: string; name: string } | null;

type GeoFeature = {
  type: "Feature";
  properties: { id: string; name: string };
  geometry: any;
};

type GeoJSON = {
  type: "FeatureCollection";
  features: GeoFeature[];
  bbox?: number[];
};

function partyFor(id: string, assignment: MapAssignment): PartyKey {
  return (assignment[id] ?? "TOSSUP") as PartyKey;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function GeoMap({
  geoUrl,
  assignment,
  onClickRegion,
  onHoverRegion,
  title,
  enableZoom = false,
}: {
  geoUrl: string;
  assignment: MapAssignment;
  onClickRegion: (id: string) => void;
  onHoverRegion: (h: Hover) => void;
  title: string;
  enableZoom?: boolean;
}) {
  const [geo, setGeo] = useState<GeoJSON | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 900, h: 600 });

  // zoom/pan state (world coords)
  const [k, setK] = useState(1); // scale
  const [t, setT] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // translation in world coords (pre-scale)

  useEffect(() => {
    fetch(geoUrl).then((r) => r.json()).then(setGeo);
  }, [geoUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const h = Math.max(520, Math.min(760, rect.width * 0.72));
      setSize({ w: Math.max(420, rect.width), h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset zoom whenever geo changes (or when switching pages)
  useEffect(() => {
    setK(1);
    setT({ x: 0, y: 0 });
  }, [geoUrl]);

  const path = useMemo(() => {
    if (!geo) return null;
    const projection = geoMercator();
    projection.fitExtent([[16, 70], [size.w - 16, size.h - 16]], geo as any);
    return geoPath(projection);
  }, [geo, size.w, size.h]);

  function svgPointFromEvent(evt: { clientX: number; clientY: number }) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    if (!enableZoom) return;
    e.preventDefault();

    const delta = -e.deltaY; // wheel up -> zoom in
    const factor = delta > 0 ? 1.12 : 0.89;

    const p = svgPointFromEvent(e);
    const k0 = k;
    const k1 = clamp(k0 * factor, 1, 16);

    // Keep cursor point stable: t1 = t0 + p*(1/k1 - 1/k0)
    const t1 = {
      x: t.x + p.x * (1 / k1 - 1 / k0),
      y: t.y + p.y * (1 / k1 - 1 / k0),
    };

    setK(k1);
    setT(t1);
  };

  // Pan with pointer drag (threshold-based so clicks on regions still work)
const dragRef = useRef<{
  pointerId: number | null;
  potential: boolean; // pointer down but not yet dragging
  active: boolean; // dragging started
  startClient: { x: number; y: number };
  t0: { x: number; y: number };
  lastClient: { x: number; y: number };
}>({
  pointerId: null,
  potential: false,
  active: false,
  startClient: { x: 0, y: 0 },
  t0: { x: 0, y: 0 },
  lastClient: { x: 0, y: 0 },
});

// Used to ignore the click that happens right after a drag
const ignoreClickRef = useRef(false);

const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
  if (!enableZoom) return;
  if (e.button !== 0) return;

  // Do NOT capture pointer here (it breaks <path onClick/> in some browsers).
  dragRef.current.pointerId = e.pointerId;
  dragRef.current.potential = true;
  dragRef.current.active = false;
  dragRef.current.startClient = { x: e.clientX, y: e.clientY };
  dragRef.current.lastClient = { x: e.clientX, y: e.clientY };
  dragRef.current.t0 = { ...t };
  ignoreClickRef.current = false;
};

const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
  if (!enableZoom) return;
  if (!dragRef.current.potential) return;
  if (dragRef.current.pointerId !== e.pointerId) return;

  const dxClient = e.clientX - dragRef.current.startClient.x;
  const dyClient = e.clientY - dragRef.current.startClient.y;
  const dist2 = dxClient * dxClient + dyClient * dyClient;

  // Start dragging only after moving a little (so normal clicks still click regions)
  const THRESH2 = 16; // 4px squared
  if (!dragRef.current.active && dist2 >= THRESH2) {
    dragRef.current.active = true;
    ignoreClickRef.current = true;
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  }

  if (!dragRef.current.active) return;

  // Convert screen delta to world delta: world = screen / k
  const dx = e.clientX - dragRef.current.lastClient.x;
  const dy = e.clientY - dragRef.current.lastClient.y;

  dragRef.current.lastClient = { x: e.clientX, y: e.clientY };

  setT((prev) => ({
    x: prev.x + dx / k,
    y: prev.y + dy / k,
  }));
};

const onPointerUp: React.PointerEventHandler<SVGSVGElement> = (e) => {
  if (!enableZoom) return;
  if (dragRef.current.pointerId !== e.pointerId) return;

  dragRef.current.pointerId = null;
  dragRef.current.potential = false;
  dragRef.current.active = false;

  try {
    (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
  } catch {
    // ignore
  }
};

  const resetView = () => {
    setK(1);
    setT({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    const k1 = clamp(k * 1.25, 1, 16);
    setK(k1);
  };

  const zoomOut = () => {
    const k1 = clamp(k / 1.25, 1, 16);
    setK(k1);
    // keep translation reasonable when zooming out a lot
    if (k1 === 1) setT({ x: 0, y: 0 });
  };

  if (!geo || !path) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: 600, display: "grid", placeItems: "center" }} className="card">
        <div className="muted">지도 로딩 중…</div>
      </div>
    );
  }

  const cursor = enableZoom ? (dragRef.current.active ? "grabbing" : "grab") : "pointer";
  const transform = `translate(${t.x} ${t.y}) scale(${k})`;

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {enableZoom && (
        <div style={{ position: "absolute", right: 14, top: 14, display: "grid", gap: 8, zIndex: 10 }}>
          <button className="btn" onClick={zoomIn} title="확대">＋</button>
          <button className="btn" onClick={zoomOut} title="축소">－</button>
          <button className="btn" onClick={resetView} title="리셋">Reset</button>
          <div className="pill" style={{ justifyContent: "center" }}>
            <span className="muted">x{Math.round(k * 10) / 10}</span>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        role="img"
        aria-label={title}
        style={{ touchAction: enableZoom ? "none" : "auto" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect x="0" y="0" width={size.w} height={size.h} fill="#ffffff" rx="16" />
        <g transform={transform}>
          {geo.features.map((f) => {
            const id = f.properties.id;
            const name = f.properties.name;
            const party = partyFor(id, assignment);
            const d = path(f as any) ?? "";
            return (
              <path
                key={id}
                d={d}
                fill={PARTY_COLOR[party]}
                stroke="#111827"
                strokeOpacity={0.22}
                strokeWidth={0.8}
                style={{ cursor }}
                onMouseEnter={() => onHoverRegion({ id, name })}
                onMouseLeave={() => onHoverRegion(null)}
                onClick={() => { if (enableZoom && ignoreClickRef.current) return; onClickRegion(id); }}
              />
            );
          })}
        </g>

        <text x={18} y={30} fontSize={14} fill="#111" fontWeight={900}>
          {title}
        </text>
        <text x={18} y={50} fontSize={12} fill="#6b7280">
          {enableZoom ? "휠: 확대/축소 · 드래그: 이동" : " "}
        </text>
      </svg>
    </div>
  );
}
