"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatDate, isDate } from "@/lib/calendar";
import type { DiaryEntries } from "@/lib/diary";
import { canDeleteDemoTrip, demoTravelSegments, linkedTripDates, demoTripPhotos, filterDemoTrips, outsideTrip, outsideTripCount, overlapsPeriod, tripInputError, type DemoTrip } from "@/lib/demo-trips";
import { useDemoTrips } from "@/components/use-demo-trips";
import { useDemoDiary } from "@/components/use-demo-diary";

type View = "list" | "detail" | "new" | "edit";
const fullDate = (date: string) => formatDate(date, { year: "numeric", month: "2-digit", day: "2-digit" });

function TripPeriod({ trip }: { trip: DemoTrip }) {
  return <p className="trip-meta"><time dateTime={trip.startsOn}>{fullDate(trip.startsOn)}</time> – <time dateTime={trip.endsOn}>{fullDate(trip.endsOn)}</time></p>;
}

function PeriodFilter({ from, to, setFrom, setTo, companions, companion = "", setCompanion }: { from: string; to: string; setFrom: (value: string) => void; setTo: (value: string) => void; companions?: string[]; companion?: string; setCompanion?: (value: string) => void }) {
  const count = Number(Boolean(from || to)) + Number(Boolean(companion));
  return <details className="trip-period-panel"><summary>{companions ? "상세 조건 · 기간·동행자" : "기간으로 조회"}{count > 0 && ` (${count}개 적용)`}</summary><fieldset className="trip-period-filter">
    <legend className="sr-only">조회 기간</legend>
    <label>시작일<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
    <label>종료일<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
    {companions && <label className="trip-companion-filter">동행자<select value={companion} onChange={(event) => setCompanion?.(event.target.value)}><option value="">전체 동행자</option>{companions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
    {count > 0 && <button type="button" className="trip-text-button" onClick={() => { setFrom(""); setTo(""); setCompanion?.(""); }}>조건 초기화</button>}
  </fieldset></details>;
}

export function TripsWorkspace({ view, id }: { view: View; id?: string }) {
  const { trips, error, save } = useDemoTrips();
  const { entries, error: diaryError } = useDemoDiary();
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [companion, setCompanion] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const trip = trips?.find((item) => item.id === id);
  const periodError = (from && !isDate(from)) || (to && !isDate(to)) || (from && to && to < from);

  if (error || diaryError) return <section className="trips-workspace"><h1>여행</h1><p role="alert">{error || diaryError}</p><button className="trip-button" onClick={() => window.location.reload()}>다시 불러오기</button></section>;
  if (!trips) return <section className="trips-workspace" aria-busy="true"><h1>여행</h1><p role="status">가상 여행을 불러오는 중…</p><noscript>여행 시안을 보려면 JavaScript를 켜 주세요.</noscript></section>;
  if (view !== "list" && view !== "new" && !trip) return <section className="trips-workspace"><h1>여행을 찾을 수 없어요</h1><p>삭제되었거나 이 브라우저에 없는 가상 여행입니다.</p><Link className="trip-button" href="/trips">여행 목록으로</Link></section>;

  function removeTrip() {
    if (!trip || !entries || !canDeleteDemoTrip(trip.id, entries)) return;
    if (!window.confirm(`‘${trip.title}’ 가상 여행을 이 브라우저에서 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const failure = save(trips!.filter((item) => item.id !== trip.id));
    if (failure) setActionError(failure);
    else router.push("/trips");
  }

  const days = trip ? linkedTripDates(trip.id, entries ?? {}) : [];
  const segments = trip ? demoTravelSegments.filter((segment) => segment.tripId === trip.id).sort((a, b) => a.position - b.position) : [];
  const visibleDays = days.filter((date) => overlapsPeriod(date, date, from, to));
  const visibleTrips = filterDemoTrips(trips, query, from, to, companion);
  const companions = [...new Set(trips.flatMap((item) => item.companions))].sort((a, b) => a.localeCompare(b, "ko"));
  const visibleSegments = segments.filter((segment) => {
    const dates = [segment.departureLocal.slice(0, 10), segment.arrivalLocal.slice(0, 10)].sort();
    return overlapsPeriod(dates[0], dates[1], from, to);
  });

  return <section className="trips-workspace">
    {view !== "list" && <Link href={view === "edit" ? `/trips/${id}` : "/trips"} className="trip-back">← {view === "edit" ? "여행 상세로" : "여행 목록으로"}</Link>}
    <div className="trip-heading"><h1>{view === "list" ? "여행" : view === "new" ? "여행 추가" : view === "edit" ? "여행 수정" : trip!.title}</h1>
      {view === "list" && <Link className="trip-button" href="/trips/new">여행 추가</Link>}
    </div>
    <p className="trip-demo-notice">가상 기록 · 예시 사진 · 이 브라우저에만 저장됩니다. 실제 개인 기록은 입력하지 마세요. 서버 저장·기기 간 동기화는 아직 지원하지 않습니다.</p>

    {(view === "new" || view === "edit") ? <TripForm key={trip?.id ?? "new"} trip={trip} trips={trips} entries={entries ?? {}} save={save} /> : <>
      {view === "detail" && <>
        {trip!.coverPhoto && <Image className="trip-detail-photo" src={trip!.coverPhoto} width={800} height={450} sizes="(max-width: 767px) 100vw, 720px" loading="eager" alt="여행 분위기를 보여주는 예시 사진" />}
        <TripPeriod trip={trip!} />
        <p className="trip-companions">동행자{trip!.companions.length ? ` · ${trip!.companions.join(" · ")}` : " 없음"}</p>
        <div className="trip-actions"><Link className="trip-button" href={`/trips/${id}/edit`}>여행 수정</Link><Link className="trip-text-button" href={`/map?trip=${id}`}>이 여행 지도</Link></div>
        {outsideTripCount(trip!, entries ?? {}) > 0 && <p className="trip-warning" role="status">여행 기간 밖의 기록·이동편 {outsideTripCount(trip!, entries ?? {})}건을 보존하고 있어요. 아래에서 ‘여행 기간 밖’ 표시를 확인할 수 있습니다. 일간의 수정에서 여행 연결을 바꿀 수 있습니다.</p>}
      </>}
      <div role="search" aria-label={view === "list" ? "여행 조회" : "여행 기록 조회"}>
        {view === "list" && <label className="trip-search-field"><span className="sr-only">여행 제목 검색</span><input type="search" placeholder="여행 제목 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
        <PeriodFilter from={from} to={to} setFrom={setFrom} setTo={setTo} companions={view === "list" ? companions : undefined} companion={companion} setCompanion={setCompanion} />
      </div>
      {periodError ? <p className="trip-error" role="alert">조회 기간을 확인해 주세요. 종료일은 시작일보다 빠를 수 없어요.</p> : view === "list" ? <>
        <p className="trip-meta" role="status">{query.trim() || from || to || companion ? "조회된 여행" : "전체 여행"} {visibleTrips.length}개</p>
        {visibleTrips.length ? <ul className="trip-list">{visibleTrips.map((item) => <li key={item.id}>
          <Link href={`/trips/${item.id}`} className="trip-row">
            {item.coverPhoto && <Image className="trip-thumbnail" src={item.coverPhoto} width={256} height={192} sizes="(max-width: 359px) 104px, 128px" alt="" />}
            <div className="trip-row-copy"><h2>{item.title}</h2><TripPeriod trip={item} />{item.companions.length > 0 && <p className="trip-companions">{item.companions.join(" · ")}</p>}</div>
          </Link>
        </li>)}</ul> : <p className="trip-empty">{trips.length ? "조건에 맞는 여행이 없어요. 검색어나 상세 조건을 바꿔 보세요." : "아직 여행이 없어요. 여행 추가에서 지난 여행도 남길 수 있습니다."}</p>}
      </> : <>
        <section className="trip-records" aria-labelledby="trip-records-title"><h2 id="trip-records-title">날짜별 기록</h2>
          {visibleDays.length ? <ol>{visibleDays.map((date) => {
            const entry = entries?.[date];
            return <li key={date}><Link className="trip-day-link" href={`/diary/${date}`}><h3><time dateTime={date}>{fullDate(date)}</time> <span>일간 보기 →</span></h3></Link>
              {outsideTrip(trip!, date) && <p className="trip-warning">여행 기간 밖 · 기록은 유지됩니다</p>}
              {entry && entry.visits.filter((visit) => visit.tripId === trip!.id).length > 0 && <p>{entry.visits.filter((visit) => visit.tripId === trip!.id).map((visit) => visit.place).join(" · ")}</p>}
              {entry?.diary && <p className="trip-meta">{entry.diary}</p>}
            </li>;
          })}</ol> : <p className="trip-empty">{days.length ? "조회 기간에 연결된 기록이 없어요." : "이 여행에 연결된 기록이 없어요. 날짜가 겹치는 일기를 자동으로 연결하지 않습니다."}</p>}
        </section>
        <section className="trip-records" aria-labelledby="trip-transport-title"><h2 id="trip-transport-title">이동편</h2>
          <p className="trip-meta">이동편 입력·수정·삭제는 아직 준비 중입니다. 아래 시각은 각 장소의 현지 시각입니다.</p>
          {visibleSegments.length ? <ol>{visibleSegments.map((segment) => <li key={segment.position}>
            <h3>{segment.mode} · {segment.service}</h3><p>{segment.departure} → {segment.arrival}</p>
            <p className="trip-meta">출발 <time dateTime={segment.departureLocal}>{segment.departureLocal.replace("T", " ")}</time> ({segment.departureZone})<br />도착 <time dateTime={segment.arrivalLocal}>{segment.arrivalLocal.replace("T", " ")}</time> ({segment.arrivalZone})</p>
            {(outsideTrip(trip!, segment.departureLocal.slice(0, 10)) || outsideTrip(trip!, segment.arrivalLocal.slice(0, 10))) && <p className="trip-warning">여행 기간 밖 · 이동편은 유지됩니다</p>}
          </li>)}</ol> : <p className="trip-empty">{segments.length ? "조회 기간에 해당하는 이동편이 없어요." : "연결된 이동편이 없어요."}</p>}
        </section>
      </>}
      {view === "detail" && <section className="trip-delete"><h2>여행 삭제</h2>
        {canDeleteDemoTrip(id!, entries ?? {}) ? <><p className="trip-meta">이 브라우저의 가상 여행만 삭제합니다. 되돌릴 수 없습니다.</p><button className="trip-text-button" onClick={removeTrip}>가상 여행 삭제</button></> : <p className="trip-meta">기록과 이동편을 보존하기 위해 연결된 여행은 아직 삭제할 수 없어요.</p>}
        {actionError && <p className="trip-error" role="alert">{actionError}</p>}
      </section>}
    </>}
  </section>;
}

function TripForm({ trip, trips, entries, save }: { trip?: DemoTrip; trips: DemoTrip[]; entries: DiaryEntries; save: (items: DemoTrip[]) => string | null }) {
  const router = useRouter();
  const [original] = useState(() => JSON.stringify(trip));
  const [draft, setDraft] = useState<DemoTrip>(() => trip ?? { id: "", title: "", startsOn: "", endsOn: "", companions: [], coverPhoto: null });
  const [error, setError] = useState<string | null>(null);
  const [confirmedOutside, setConfirmedOutside] = useState(false);
  const [saving, setSaving] = useState(false);
  const outside = isDate(draft.startsOn) && isDate(draft.endsOn) && draft.endsOn >= draft.startsOn ? outsideTripCount(draft, entries) : 0;

  function update(values: Partial<DemoTrip>) {
    setDraft({ ...draft, ...values });
    setError(null);
    setConfirmedOutside(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = { ...draft, title: draft.title.trim(), companions: draft.companions.map((name) => name.trim()).filter(Boolean) };
    const inputError = tripInputError(normalized);
    if (inputError) { setError(inputError); return; }
    if (trip && JSON.stringify(trips.find((item) => item.id === trip.id)) !== original) { setError("다른 탭에서 여행이 변경됐어요. 입력 내용은 유지됩니다. 최신 여행 상세를 확인한 뒤 다시 수정해 주세요."); return; }
    if (outside > 0 && !confirmedOutside) { setError("기간 밖 기록을 보존하는 안내를 확인해 주세요."); return; }
    setSaving(true);
    try {
      const next = { ...normalized, id: trip?.id ?? crypto.randomUUID() };
      const failure = save(trip ? trips.map((item) => item.id === trip.id ? next : item) : [...trips, next]);
      if (failure) { setError(failure); setSaving(false); return; }
      router.push(`/trips/${next.id}`);
    } catch { setError("가상 여행을 저장하지 못했어요. 입력 내용을 유지했습니다. 다시 시도해 주세요."); setSaving(false); }
  }

  return <form className="trip-form" onSubmit={submit} aria-busy={saving}>
    <label htmlFor="trip-title">여행 제목<input id="trip-title" name="title" required maxLength={200} value={draft.title} onChange={(event) => update({ title: event.target.value })} autoComplete="off" /></label>
    <div className="trip-form-dates"><label htmlFor="trip-start">시작일<input id="trip-start" name="startsOn" type="date" required value={draft.startsOn} onChange={(event) => update({ startsOn: event.target.value })} /></label><label htmlFor="trip-end">종료일<input id="trip-end" name="endsOn" type="date" required value={draft.endsOn} onChange={(event) => update({ endsOn: event.target.value })} /></label></div>
    <fieldset><legend>동행자 이름 <span className="trip-meta">선택</span></legend><p className="trip-meta">계정 연결 없이 이름만 남깁니다. 입력하지 않아도 저장할 수 있어요.</p>
      {draft.companions.map((name, index) => <div className="trip-companion-field" key={index}><label htmlFor={`companion-${index}`}>동행자 {index + 1}<input id={`companion-${index}`} maxLength={100} value={name} onChange={(event) => update({ companions: draft.companions.map((value, position) => position === index ? event.target.value : value) })} /></label><button type="button" className="trip-text-button" aria-label={`동행자 ${index + 1} 삭제`} onClick={() => update({ companions: draft.companions.filter((_, position) => position !== index) })}>삭제</button></div>)}
      <button className="trip-text-button" type="button" disabled={draft.companions.length >= 30} onClick={() => {
        update({ companions: [...draft.companions, ""] });
        requestAnimationFrame(() => document.getElementById(`companion-${draft.companions.length}`)?.focus());
      }}>동행자 추가</button>
    </fieldset>
    <fieldset><legend>대표 사진 <span className="trip-meta">선택</span></legend><p className="trip-meta">예시 사진을 고를 수 있습니다. 실제 사진 업로드는 아직 지원하지 않습니다.</p>
      <div className="trip-photo-choices"><label><input type="radio" name="cover" checked={draft.coverPhoto === null} onChange={() => update({ coverPhoto: null })} />사진 없음</label>
        {demoTripPhotos.map((photo) => <label key={photo.src}><input type="radio" name="cover" checked={draft.coverPhoto === photo.src} onChange={() => update({ coverPhoto: photo.src })} /><Image src={photo.src} width={128} height={96} alt="" />{photo.label}</label>)}
      </div>
    </fieldset>
    {outside > 0 && <div className="trip-warning"><p>이 기간 밖에 연결 기록·이동편 {outside}건이 있습니다. 일기·방문·사진·이동편과 여행 연결을 자동 삭제하지 않습니다.</p><label className="trip-check"><input type="checkbox" checked={confirmedOutside} onChange={(event) => setConfirmedOutside(event.target.checked)} />기간 밖 기록을 그대로 보존하고 저장합니다.</label></div>}
    {error && <p className="trip-error" role="alert">{error}</p>}
    <div className="trip-actions"><button className="trip-button" type="submit" disabled={saving}>{saving ? "브라우저에 저장 중…" : "가상 여행 저장"}</button><Link className="trip-text-button" href={trip ? `/trips/${trip.id}` : "/trips"}>취소</Link></div>
    <p className="trip-meta">저장 버튼을 눌러야 반영됩니다. 취소하거나 화면을 떠나면 저장하지 않은 입력은 사라집니다.</p>
  </form>;
}
