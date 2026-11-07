"use client";

import Image from "next/image";
import Link from "next/link";
import { useDemoDiary } from "@/components/use-demo-diary";
import { useDemoTrips } from "@/components/use-demo-trips";
import { demoDate, formatDate, monthWeeks, shiftMonth, weekDates } from "@/lib/calendar";
import { monthlyTripLanes } from "@/lib/monthly-trips";

export function MonthlyDiary({ date }: { date: string }) {
  const { entries, error, ready } = useDemoDiary();
  const { trips, error: tripsError } = useDemoTrips();
  const weeks = monthWeeks(date);
  const dates = weeks.flat().filter((day) => day !== null);
  const loaded = ready && trips !== null;
  const failure = error || tripsError;
  const lanes = monthlyTripLanes(trips ?? [], dates[0], dates[dates.length - 1]);
  const previous = shiftMonth(date, -1);
  const next = shiftMonth(date, 1);
  const entry = entries?.[date];
  const visits = entry?.visits ?? [];
  const photo = visits[0]?.photo;
  const periodTrips = trips?.filter((trip) => trip.startsOn <= date && trip.endsOn >= date) ?? [];
  const linkedTrips = trips?.filter((trip) => entry?.tripIds.includes(trip.id)) ?? [];

  return <section className="monthly-diary" aria-labelledby="diary-title" aria-busy={!loaded && !failure}>
    <div className="month-heading"><h1 id="diary-title">다이어리</h1><nav className="diary-view-nav" aria-label="다이어리 보기"><Link href={`/?view=month&date=${date}`} aria-current="page">월간</Link><Link href={`/?week=${weekDates(date)[0]}`}>주간</Link><Link href={`/diary/${date}`}>일간</Link></nav></div>
    <nav className="month-toolbar" aria-label="월 이동">
      {previous ? <Link href={`/?view=month&date=${previous}`} aria-label="이전 달">←</Link> : <span />}
      <h2>{formatDate(date, { year: "numeric", month: "long" })}</h2>
      {next ? <Link href={`/?view=month&date=${next}`} aria-label="다음 달">→</Link> : <span />}
    </nav>
    <p className="month-notice">가상 기록 · 이 브라우저에만 저장 · 사진은 예시</p>
    {failure ? <div className="trip-error" role="alert"><p>{failure}</p><button type="button" className="trip-button" onClick={() => window.location.reload()}>다시 불러오기</button></div> : <>
      {!loaded && <p role="status">가상 여행과 기록을 불러오는 중…</p>}
      <div className="month-calendar" aria-label={`${formatDate(date, { year: "numeric", month: "long" })} 날짜 선택`}>
        <div className="month-weekdays" aria-hidden="true">{["월", "화", "수", "목", "금", "토", "일"].map((day) => <span key={day}>{day}</span>)}</div>
        {weeks.map((days, week) => {
          const valid = days.filter((day) => day !== null);
          const segments = lanes.filter(({ trip }) => trip.startsOn <= valid[valid.length - 1] && trip.endsOn >= valid[0]);
          const hidden = segments.filter(({ lane }) => lane >= 2);
          return <div className="month-week" key={week}>
            <div className="month-dates">{days.map((day, index) => {
              if (!day) return <span key={index} />;
              const item = entries?.[day];
              const hasRecord = Boolean(item?.diary || item?.visits.length);
              return <Link key={day} href={`/?view=month&date=${day}`} scroll={false} className={`month-date${day.slice(0, 7) !== date.slice(0, 7) ? " month-adjacent" : ""}`} aria-current={day === date ? "date" : undefined} aria-label={`${formatDate(day, { month: "long", day: "numeric", weekday: "long" })}${loaded && hasRecord ? `, 방문 ${item?.visits.length ?? 0}개${item?.diary ? ", 하루 일기 있음" : ""}` : ""}, 기록 미리보기`}>
                <time dateTime={day}>{Number(day.slice(-2))}</time>{loaded && hasRecord && <span className="month-record-dot" aria-hidden="true" />}
              </Link>;
            })}</div>
            <div className="month-bands">{segments.filter(({ lane }) => lane < 2).map(({ trip, lane }) => {
              const start = days.findIndex((day) => day !== null && day >= trip.startsOn);
              const end = days.findLastIndex((day) => day !== null && day <= trip.endsOn);
              const continuesBefore = trip.startsOn < valid[0];
              const continuesAfter = trip.endsOn > valid[valid.length - 1];
              return <Link key={trip.id} href={`/trips/${trip.id}`} className="month-band" style={{ gridColumn: `${start + 1} / ${end + 2}`, gridRow: lane + 1 }} aria-label={`${trip.title}, ${trip.startsOn}부터 ${trip.endsOn}까지. 여행 상세`} title={`${trip.title} · ${trip.startsOn} — ${trip.endsOn}`}><span>{continuesBefore ? "← " : ""}{trip.title}{continuesAfter ? " →" : ""}</span></Link>;
            })}</div>
            {hidden.length > 0 && <details className="month-overflow"><summary>+{hidden.length}개 여행<span className="sr-only"> · {formatDate(valid[0], { month: "long", day: "numeric" })}부터의 주</span></summary><ul>{hidden.map(({ trip }) => <li key={trip.id}><Link href={`/trips/${trip.id}`}>{trip.title}<span>{trip.startsOn} — {trip.endsOn}</span></Link></li>)}</ul></details>}
          </div>;
        })}
      </div>
      {loaded && <section className="month-preview" aria-labelledby="month-preview-title">
        <h2 id="month-preview-title" aria-live="polite">{formatDate(date, { month: "long", day: "numeric", weekday: "long" })}</h2>
        <p className="trip-meta">방문 {visits.length}개{entry?.diary ? " · 하루 일기 있음" : ""}</p>
        {visits.length > 0 && <div className="month-visit-preview">{photo && <Image src={photo} width={112} height={88} sizes="56px" alt="방문 분위기를 보여주는 예시 사진" />}<div><p>{visits[0].place}</p><p className="trip-meta">{visits[0].time ? `${visits[0].time} · 여행지 현지 시각` : "시간 미지정"}{visits.length > 1 ? ` · 외 ${visits.length - 1}개 장소` : ""}</p></div></div>}
        {entry?.diary && <p className="month-diary-excerpt">{entry.diary}</p>}
        {!visits.length && !entry?.diary && <p className="month-empty">아직 기록이 없어요. 일간에서 일기나 방문을 작성할 수 있습니다.</p>}
        <Link className="trip-text-button month-daily-link" href={`/diary/${date}`}>일간 보기 →</Link>
        {periodTrips.length > 0 && <div className="month-preview-trips"><h3>이 날짜를 포함한 여행 기간</h3><ul>{periodTrips.map((trip) => <li key={trip.id}><Link href={`/trips/${trip.id}`}>{trip.title}<span>{trip.startsOn} — {trip.endsOn}</span></Link></li>)}</ul><p className="trip-meta">기간 표시는 일기·방문의 여행 연결을 뜻하지 않습니다.</p></div>}
        {linkedTrips.length > 0 && <p className="month-linked-trips">기록에 연결한 여행 · {linkedTrips.map((trip, index) => <span key={trip.id}>{index > 0 && " · "}<Link href={`/trips/${trip.id}`}>{trip.title}</Link></span>)}</p>}
      </section>}
      {loaded && lanes.length === 0 && <p className="trip-meta month-empty">이 달력에 표시할 여행 기간이 없어요. 여행 없이 남긴 기록도 날짜를 선택해 볼 수 있습니다.</p>}
    </>}
    <Link href={`/?view=month&date=${demoDate}`} className="trip-text-button">샘플 달로</Link>
  </section>;
}
