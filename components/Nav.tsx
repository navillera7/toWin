"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Tab({ href, label }: { href: string; label: string }) {
  const p = usePathname();
  const active = p === href;
  return (
    <Link
      className={"btn" + (active ? " btnPrimary" : "")}
      href={href}
      style={{ borderColor: active ? "#111827" : "#e8e8e8" }}
    >
      {label}
    </Link>
  );
}

export default function Nav() {
  return (
    <div className="row" style={{ marginBottom: 14 }}>
      <Tab href="/governor" label="1) 시·도지사" />
      <Tab href="/sigungu" label="2) 시·군·구" />
    </div>
  );
}
