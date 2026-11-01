"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/", label: "다이어리", mark: "01" },
  { href: "/trips", label: "여행", mark: "02" },
  { href: "/map", label: "지도", mark: "03" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴" className="navigation">
      {destinations.map(({ href, label, mark }) => (
        <Link key={href} href={href} aria-current={pathname === href || (href === "/" ? pathname.startsWith("/diary/") : pathname.startsWith(`${href}/`)) ? "page" : undefined}>
          <span aria-hidden="true" className="nav-mark">{mark}</span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
