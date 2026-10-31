"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDate, visibleVisitCount } from "@/lib/calendar";
import type { DemoEntry } from "@/lib/demo-diary";

export function WeeklyDiary({ dates, entries }: { dates: string[]; entries: Record<string, DemoEntry> }) {
  const board = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(0);

  useEffect(() => {
    const element = board.current;
    if (!element) return;
    const cell = element.querySelector<HTMLElement>(".week-day");
    const heading = cell?.querySelector("h2");
    const tail = cell?.querySelector(".day-tail");
    const list = cell?.querySelector("ul");
    if (!cell || !heading || !tail || !list) return;
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(cell);
      const reserved = heading.getBoundingClientRect().height + tail.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + 2;
      const rowHeight = parseFloat(getComputedStyle(list).fontSize) * 2.3;
      setCapacity(visibleVisitCount(cell.getBoundingClientRect().height, reserved, rowHeight));
    });
    observer.observe(element);
    observer.observe(heading);
    observer.observe(tail);
    return () => observer.disconnect();
  }, []);

  const total = dates.reduce((count, date) => count + (entries[date]?.visits.length ?? 0), 0);

  return (
    <div className="week-board" ref={board} aria-label="한 주 7일 전체 보기">
      {dates.map((date) => {
        const entry = entries[date];
        const visits = entry?.visits ?? [];
        const shown = visits.slice(0, capacity);
        const extra = visits.length - shown.length;
        return (
          <Link key={date} href={`/diary/${date}`} className="week-day" aria-label={`${formatDate(date, { month: "long", day: "numeric", weekday: "long" })}, 방문 ${visits.length}개${entry?.diary ? ", 하루 일기 있음" : ""}. 일간 보기`}>
            <h2><time dateTime={date}>{formatDate(date, { day: "numeric" })}</time><span>{formatDate(date, { weekday: "short" })}</span></h2>
            <ul className="visit-previews">
              {shown.map((visit, index) => (
                <li key={index}>
                  {visit.photo ? <Image src={visit.photo} width={26} height={26} alt="" className="visit-thumb" /> : <span className="no-photo" aria-hidden="true">·</span>}
                  <span className="visit-name">{visit.place}</span>
                  {visit.time && <time className="visit-time">{visit.time}</time>}
                </li>
              ))}
            </ul>
            <span className="day-tail">{extra > 0 ? `+${extra}개` : entry?.diary ? "하루 일기" : visits.length === 0 ? "기록 없음" : "일간 보기"}</span>
          </Link>
        );
      })}
      <aside className="week-summary"><span>WEEK NOTES</span><p>{total > 0 ? <><strong>{total}번</strong>의 방문</> : "비어 있는 한 주"}</p></aside>
    </div>
  );
}
