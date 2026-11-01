import Link from "next/link";
import { WeeklyDiary } from "@/components/weekly-diary";
import { demoDate, formatDate, shiftDate, weekDates } from "@/lib/calendar";

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ week?: string | string[] }> }) {
  const { week } = await searchParams;
  const dates = weekDates(typeof week === "string" ? week : demoDate);
  const start = dates[0];
  const previous = shiftDate(start, -7);
  const next = shiftDate(start, 7);

  return (
    <section className="weekly-diary" aria-labelledby="diary-title">
      <div className="week-heading"><h1 id="diary-title">다이어리 <span>주간</span></h1><Link href="/">샘플 주로</Link></div>
      <nav className="week-toolbar" aria-label="주 이동">
        {previous ? <Link href={`/?week=${previous}`} aria-label="이전 주">←</Link> : <span />}
        <h2>{formatDate(start, { year: "numeric", month: "numeric", day: "numeric" })} — {formatDate(dates[6], { month: "numeric", day: "numeric" })}</h2>
        {next ? <Link href={`/?week=${next}`} aria-label="다음 주">→</Link> : <span />}
      </nav>
      <p className="demo-notice">가상 기록 · 예시 사진 · 일간에서 수정 · 이 브라우저에만 저장</p>
      <WeeklyDiary dates={dates} />
    </section>
  );
}
