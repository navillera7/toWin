import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="card" style={{ padding: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>지방선거 인터랙티브 맵</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 16, lineHeight: 1.6 }}>
          1페이지: 광역자치단체장(시·도지사) / 2페이지: 기초자치단체장(시·군·구)
        </p>
        <div className="row">
          <Link className="btn btnPrimary" href="/governor">1) 시·도지사 맵</Link>
          <Link className="btn" href="/sigungu">2) 시·군·구 맵</Link>
        </div>
      </div>
    </main>
  );
}
