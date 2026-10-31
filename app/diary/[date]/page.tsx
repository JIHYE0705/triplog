import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, isDate, weekDates } from "@/lib/calendar";
import { demoEntries } from "@/lib/demo-diary";

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isDate(date)) notFound();
  const entry = demoEntries[date];
  const start = weekDates(date)[0];

  return (
    <section className="daily-diary">
      <Link href={`/?week=${start}`} className="back-to-week">← 이 날짜의 주간으로</Link>
      <p className="page-label">DAILY · 가상 기록</p>
      <h1>{formatDate(date, { month: "long", day: "numeric", weekday: "long" })}</h1>
      <p className="demo-notice">예시 사진은 실제 방문 장소의 사진이 아닙니다. 기록을 저장하거나 수정할 수 없어요.</p>
      <section className="daily-visits" aria-labelledby="visits-title">
        <h2 id="visits-title">다녀온 장소 <span>{entry?.visits.length ?? 0}</span></h2>
        {entry?.visits.length ? <ol>{entry.visits.map((visit, index) => <li key={index}>
          <div className="daily-visit-title"><h3>{visit.place}</h3>{visit.time && <time>{visit.time}</time>}</div>
          {visit.photo && <Image src={visit.photo} width={640} height={420} alt="여행 분위기를 보여주는 예시 사진" className="daily-photo" />}
          <p>{visit.note}</p>
        </li>)}</ol> : <p>이 날짜에는 방문 기록이 없어요.</p>}
      </section>
      <section className="daily-entry" aria-labelledby="entry-title"><h2 id="entry-title">하루 일기</h2><p>{entry?.diary ?? "이 날짜에는 하루 일기가 없어요."}</p></section>
    </section>
  );
}
