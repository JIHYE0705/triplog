"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { formatDate, shiftDate, weekDates } from "@/lib/calendar";
import { putVisit, reorderVisit, visitInputError, type DemoEntry, type DiaryEntries, type Visit } from "@/lib/diary";
import { outsideTrip, type DemoTrip } from "@/lib/demo-trips";
import { useDemoDiary } from "@/components/use-demo-diary";
import { useDemoTrips } from "@/components/use-demo-trips";

type Save = (next: DiaryEntries, original: DiaryEntries) => string | null;
type Editor = "diary" | "new" | { visitId: string };
const emptyEntry: DemoEntry = { visits: [], tripIds: [] };

function timeZoneLabel(zone: string) {
  return zone === "Asia/Seoul" ? "서울" : zone === "Asia/Tokyo" ? "도쿄" : zone === "UTC" ? "UTC" : zone.split("/").slice(1).join(" / ").replaceAll("_", " ");
}

function useDraftGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: globalThis.MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && link.getAttribute("href")?.startsWith("#") !== true && !window.confirm("저장하지 않은 입력 내용이 있어요. 저장하지 않고 이동할까요?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
}

function CancelButton({ dirty, cancel }: { dirty: boolean; cancel: () => void }) {
  return <button type="button" className="trip-text-button" onClick={() => {
    if (!dirty || window.confirm("수정한 내용을 저장하지 않고 취소할까요?")) cancel();
  }}>취소</button>;
}

export function DailyDiary({ date }: { date: string }) {
  const { entries, error, ready, save } = useDemoDiary();
  const { trips, error: tripsError } = useDemoTrips();
  const [editing, setEditing] = useState<Editor | null>(null);
  const [editingEntries, setEditingEntries] = useState<DiaryEntries | null>(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const visitsHeading = useRef<HTMLHeadingElement>(null);
  const previous = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const entry = (editingEntries ?? entries)?.[date] ?? emptyEntry;
  const disabled = !ready || editing !== null;

  function start(editor: Editor, event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setEditingEntries(entries);
    setMessage(""); setActionError(null); setEditing(editor);
  }
  function finish(saved = false) {
    setEditing(null);
    setEditingEntries(null);
    if (saved) setMessage("이 브라우저에 저장했어요.");
    requestAnimationFrame(() => trigger.current?.focus());
  }
  function changeVisits(visits: Visit[], success: string) {
    if (!entries) return;
    const failure = save({ ...entries, [date]: { ...entry, visits } }, entries);
    setActionError(failure);
    if (!failure) { setMessage(success); visitsHeading.current?.focus(); }
  }

  return <section className="daily-diary" aria-busy={!ready}>
    <Link href={`/?week=${weekDates(date)[0]}`} className="back-to-week">← 이 날짜의 주간으로</Link>
    <p className="page-label">DAILY · 가상 기록</p>
    <h1><time dateTime={date}>{formatDate(date, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</time></h1>
    <nav className="daily-date-nav" aria-label="날짜 이동">
      {previous ? <Link className="trip-text-button" href={`/diary/${previous}`}>← 이전 날</Link> : <span />}
      {next && <Link className="trip-text-button" href={`/diary/${next}`}>다음 날 →</Link>}
    </nav>
    <p className="trip-demo-notice">가상 기록 · 이 브라우저에만 저장됩니다. 실제 개인 기록은 입력하지 마세요. 서버 저장·기기 간 동기화는 지원하지 않습니다. 사진은 실제 방문 장소와 다른 예시입니다.</p>
    <p role="status" className="daily-status">{message || (!ready ? "브라우저의 가상 기록을 불러오는 중…" : "")}</p>
    {error && !editing ? <div role="alert"><p>{error}</p><button className="trip-button" onClick={() => window.location.reload()}>다시 불러오기</button></div> : <>
      {error && <p className="trip-error" role="alert">{error} 수정 중인 내용은 유지했습니다.</p>}
      {actionError && <p className="trip-error" role="alert">{actionError}</p>}
      <section className="daily-entry" aria-labelledby="entry-title">
        <div className="daily-section-heading"><h2 id="entry-title">하루 일기</h2><button type="button" className="trip-text-button" aria-expanded={editing === "diary"} aria-controls="diary-editor" disabled={disabled} onClick={(event) => start("diary", event)}>{entry.diary ? "수정" : "작성"}<span className="sr-only"> · 하루 일기</span></button></div>
        {editing === "diary" && editingEntries ? <DiaryForm date={date} entries={editingEntries} trips={trips} save={save} done={finish} /> : <>
          <p className="daily-prose">{entry.diary || "아직 하루 일기가 없어요. 장소 없이 일기만 작성할 수 있습니다."}</p>
          {entry.tripIds.length > 0 && <p className="trip-meta daily-linked-trips">연결된 여행 · {entry.tripIds.map((id) => trips?.find((trip) => trip.id === id)?.title ?? "여행 불러오는 중").join(" · ")}</p>}
        </>}
      </section>
      <section className="daily-visits" aria-labelledby="visits-title">
        <div className="daily-section-heading"><h2 id="visits-title" tabIndex={-1} ref={visitsHeading}>다녀온 장소 <span>{entry.visits.length}</span></h2><button type="button" className="trip-text-button" disabled={disabled} aria-expanded={editing === "new"} aria-controls="new-visit-editor" onClick={(event) => start("new", event)}>＋ 방문 추가</button></div>
        {tripsError && <p className="trip-warning" role="status">여행 연결을 불러오지 못했어요. 기존 연결은 유지하며 여행 선택은 잠시 사용할 수 없습니다.</p>}
        {editing === "new" && editingEntries && <VisitForm date={date} entries={editingEntries} trips={trips} save={save} done={finish} />}
        {entry.visits.length ? <ol>{entry.visits.map((visit, index) => {
          const active = typeof editing === "object" && editing?.visitId === visit.id;
          const trip = trips?.find((item) => item.id === visit.tripId);
          return <li key={visit.id}>
            <div className="daily-visit-title">
              {visit.photo && <Image src={visit.photo} width={176} height={132} sizes="88px" alt="" className="daily-visit-thumb" />}
              <div className="daily-visit-copy"><h3>{visit.place}</h3>{visit.time && <p className="trip-meta"><time>{visit.time}</time> · {visit.timeZone && timeZoneLabel(visit.timeZone)}</p>}</div>
              <button type="button" className="trip-text-button" aria-expanded={active} aria-controls={`visit-editor-${visit.id}`} aria-label={`${visit.place} 수정`} disabled={disabled} onClick={(event) => start({ visitId: visit.id }, event)}>수정</button>
            </div>
            {active && editingEntries ? <VisitForm key={visit.id} date={date} visit={visit} entries={editingEntries} trips={trips} save={save} done={finish} /> : <>
              {visit.photo && <details className="daily-photo-view"><summary>사진 크게 보기</summary><Image src={visit.photo} width={640} height={420} sizes="(max-width: 767px) 100vw, 640px" alt="여행 분위기를 보여주는 예시 사진" className="daily-photo" /></details>}
              <p className="daily-prose">{visit.note || "아직 장소별 소감이 없어요."}</p>
              {trip && <p className="trip-meta daily-linked-trips">{trip.title}</p>}
              {trip && outsideTrip(trip, date) && <p className="trip-warning">여행 기간 밖 · 기록과 연결은 유지됩니다.</p>}
              <p className="trip-meta">위치 미지정 · 지도에는 표시되지 않아요.</p>
              <div className="daily-visit-actions">
                <button type="button" className="trip-text-button" disabled={disabled || index === 0} aria-label={`${visit.place} 위로 이동`} onClick={() => changeVisits(reorderVisit(entry, visit.id, -1).visits, "방문 순서를 바꿨어요.")}>↑ 위로</button>
                <button type="button" className="trip-text-button" disabled={disabled || index === entry.visits.length - 1} aria-label={`${visit.place} 아래로 이동`} onClick={() => changeVisits(reorderVisit(entry, visit.id, 1).visits, "방문 순서를 바꿨어요.")}>아래로 ↓</button>
                <button type="button" className="trip-text-button daily-delete" disabled={disabled} aria-label={`${visit.place} 삭제`} onClick={() => {
                  if (window.confirm(`‘${visit.place}’ 가상 방문을 삭제할까요? 소감과 예시 사진 연결도 삭제되며 되돌릴 수 없습니다. 하루 일기는 유지됩니다.`)) changeVisits(entry.visits.filter((item) => item.id !== visit.id), "가상 방문을 삭제했어요. 하루 일기는 유지했습니다.");
                }}>삭제</button>
              </div>
            </>}
          </li>;
        })}</ol> : <p className="daily-empty">이 날짜에는 방문 기록이 없어요. 방문 추가에서 장소를 직접 입력할 수 있습니다.</p>}
      </section>
    </>}
  </section>;
}

function DiaryForm({ date, entries, trips, save, done }: { date: string; entries: DiaryEntries; trips: DemoTrip[] | null; save: Save; done: (saved?: boolean) => void }) {
  const [original] = useState(entries);
  const entry = original[date] ?? emptyEntry;
  const [diary, setDiary] = useState(entry.diary ?? "");
  const [tripIds, setTripIds] = useState(entry.tripIds);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const dirty = diary !== (entry.diary ?? "") || JSON.stringify(tripIds) !== JSON.stringify(entry.tripIds);
  useDraftGuard(dirty);
  useEffect(() => { field.current?.focus(); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const failure = save({ ...original, [date]: { ...entry, diary, tripIds } }, original);
    setError(failure);
    if (!failure) done(true);
  }
  return <form id="diary-editor" className="daily-form" onSubmit={submit}>
    <label>하루 일기<textarea ref={field} rows={6} value={diary} onChange={(event) => setDiary(event.target.value)} /></label>
    <p className="trip-meta">장소 없이 하루 일기만 작성할 수 있어요.</p>
    <fieldset><legend>연결할 여행 · 선택</legend>
      {trips ? trips.length ? trips.map((trip) => {
        const used = entry.visits.some((visit) => visit.tripId === trip.id);
        return <label className="daily-trip-check" key={trip.id}><input type="checkbox" checked={tripIds.includes(trip.id)} disabled={used} onChange={(event) => setTripIds(event.target.checked ? [...tripIds, trip.id] : tripIds.filter((id) => id !== trip.id))} /><span>{trip.title}{used && <span className="trip-meta"> · 방문에 연결됨</span>}{outsideTrip(trip, date) && <span className="trip-warning"> · 여행 기간 밖</span>}</span></label>;
      }) : <p className="trip-meta">등록한 여행이 없어요. 여행 없이 저장할 수 있습니다.</p> : <p className="trip-meta">여행을 불러올 수 없어 기존 연결을 유지합니다.</p>}
      <p className="trip-meta">방문에 사용 중인 여행은 먼저 해당 방문의 연결을 바꿔 주세요.</p>
    </fieldset>
    {error && <p className="trip-error" role="alert">{error}</p>}
    <div className="daily-form-actions"><CancelButton dirty={dirty} cancel={() => done()} /><button type="submit" className="trip-button">일기 저장</button></div>
  </form>;
}

function VisitForm({ date, visit, entries, trips, save, done }: { date: string; visit?: Visit; entries: DiaryEntries; trips: DemoTrip[] | null; save: Save; done: (saved?: boolean) => void }) {
  const router = useRouter();
  const [original] = useState(entries);
  const [draft, setDraft] = useState<Visit>(() => visit ?? { id: "", place: "", note: "" });
  const [targetDate, setTargetDate] = useState(date);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const dirty = targetDate !== date || JSON.stringify(draft) !== JSON.stringify(visit ?? { id: "", place: "", note: "" });
  const zones = [...new Set(["Asia/Seoul", "Asia/Tokyo", "UTC", ...(draft.timeZone ? [draft.timeZone] : []), ...Intl.supportedValuesOf("timeZone")])];
  const selectedTrip = trips?.find((trip) => trip.id === draft.tripId);
  useDraftGuard(dirty);
  useEffect(() => { field.current?.focus(); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = { ...draft, id: draft.id || crypto.randomUUID(), place: draft.place.trim() };
    const invalid = visitInputError(targetDate, value);
    if (invalid) { setError(invalid); return; }
    const failure = save(putVisit(original, visit ? date : null, targetDate, value), original);
    setError(failure);
    if (!failure) { done(true); if (targetDate !== date) router.push(`/diary/${targetDate}`); }
  }
  return <form id={visit ? `visit-editor-${visit.id}` : "new-visit-editor"} className="daily-form" onSubmit={submit}>
    {!visit && <h3>방문 추가</h3>}
    <label>장소명 · 필수<input ref={field} required maxLength={200} value={draft.place} onChange={(event) => setDraft({ ...draft, place: event.target.value })} /></label>
    <label>방문 날짜 · 현지 기준 · 필수<input type="date" required min="0001-01-01" max="9999-12-31" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
    <div className="trip-form-dates">
      <label>시간 · 선택<input type="time" value={draft.time ?? ""} onChange={(event) => setDraft({ ...draft, time: event.target.value || undefined, timeZone: event.target.value ? draft.timeZone : undefined })} /></label>
      <label>여행지 시간대<select required={Boolean(draft.time)} disabled={!draft.time} value={draft.timeZone ?? ""} onChange={(event) => setDraft({ ...draft, timeZone: event.target.value || undefined })}><option value="">시간대 선택</option>{zones.map((zone) => <option key={zone} value={zone}>{timeZoneLabel(zone)}</option>)}</select></label>
    </div>
    <p className="trip-meta">시간이 없어도 방문 순서를 정할 수 있어요. 날짜는 귀국 후에도 여행지 기준으로 유지됩니다.</p>
    <label>연결할 여행 · 선택<select disabled={!trips} value={draft.tripId ?? ""} onChange={(event) => setDraft({ ...draft, tripId: event.target.value || undefined })}><option value="">여행 없이 기록</option>{trips?.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}{draft.tripId && !trips?.some((trip) => trip.id === draft.tripId) && <option value={draft.tripId}>기존 여행 연결 유지</option>}</select></label>
    {selectedTrip && outsideTrip(selectedTrip, targetDate) && <p className="trip-warning">여행 기간 밖의 기록입니다. 선택한 여행 연결과 기록을 유지합니다.</p>}
    <p className="trip-meta">위치 미지정 · 지도에는 표시되지 않아요. 장소 검색과 위치 지정은 후속 작업입니다.</p>
    <label>이 장소의 소감<textarea rows={4} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
    {visit?.photo && <p className="trip-meta">기존 예시 사진을 유지합니다. 사진 업로드는 아직 지원하지 않아요.</p>}
    {error && <p className="trip-error" role="alert">{error}</p>}
    <div className="daily-form-actions"><CancelButton dirty={dirty} cancel={() => done()} /><button type="submit" className="trip-button">방문 저장</button></div>
  </form>;
}
