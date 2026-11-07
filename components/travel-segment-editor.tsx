"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDemoTrips } from "@/components/use-demo-trips";
import { useDemoSegments } from "@/components/use-demo-segments";
import { useDraftGuard } from "@/components/use-draft-guard";
import { outsideTrip } from "@/lib/demo-trips";
import { localInstants, segmentInputError, type TravelSegment } from "@/lib/travel-segments";

type TripStore = ReturnType<typeof useDemoTrips>;
type SegmentStore = ReturnType<typeof useDemoSegments>;

export function TravelSegmentEditor({ tripId, segmentId }: { tripId: string; segmentId?: string }) {
  const tripStore = useDemoTrips();
  const segmentStore = useDemoSegments();
  if (!segmentStore.ready || (!tripStore.trips && !tripStore.error)) return <section className="trips-workspace" aria-busy="true"><h1>이동편</h1><p role="status">가상 여행과 이동편을 불러오는 중…</p></section>;
  return <SegmentForm key={`${tripId}/${segmentId ?? "new"}`} tripId={tripId} segmentId={segmentId} tripStore={tripStore} segmentStore={segmentStore} />;
}

function SegmentForm({ tripId, segmentId, tripStore, segmentStore }: { tripId: string; segmentId?: string; tripStore: TripStore; segmentStore: SegmentStore }) {
  const router = useRouter();
  const [originalTrip] = useState(() => tripStore.trips?.find((trip) => trip.id === tripId));
  const [original] = useState(() => segmentStore.segments ?? []);
  const [existing] = useState(() => original.find((segment) => segment.id === segmentId && segment.tripId === tripId));
  const [initial] = useState<TravelSegment>(() => existing ?? { id: "", tripId, mode: "항공", operator: "", service: "", departure: "", arrival: "", departureLocal: `${originalTrip?.startsOn ?? ""}T09:00`, arrivalLocal: `${originalTrip?.startsOn ?? ""}T10:00`, departureZone: "Asia/Seoul", arrivalZone: "Asia/Seoul", departureUtc: "", arrivalUtc: "" });
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLSelectElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useDraftGuard(dirty);
  useEffect(() => { first.current?.focus(); }, []);
  const trip = tripStore.trips?.find((item) => item.id === tripId);
  const storeError = tripStore.error || segmentStore.error || (!trip ? "이 여행이 삭제되어 저장할 수 없어요. 입력 내용을 복사해 보관해 주세요." : null);
  const outside = trip && (outsideTrip(trip, draft.departureLocal.slice(0, 10)) || outsideTrip(trip, draft.arrivalLocal.slice(0, 10)));
  const zones = [...new Set(["Asia/Seoul", "Asia/Tokyo", "UTC", initial.departureZone, initial.arrivalZone, ...Intl.supportedValuesOf("timeZone")])];

  if (!originalTrip || (segmentId && !existing)) return <section className="trips-workspace"><h1>{tripStore.error || segmentStore.error ? "이동편을 불러올 수 없어요" : "이동편 또는 여행을 찾을 수 없어요"}</h1><p role="alert">{tripStore.error || segmentStore.error || "삭제되었거나 이 브라우저에 없는 가상 기록입니다."}</p>{(tripStore.error || segmentStore.error) && <button type="button" className="trip-button" onClick={() => window.location.reload()}>다시 불러오기</button>}<Link className="trip-back" href="/trips">여행 목록으로</Link></section>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (storeError) { setError(storeError); return; }
    const normalized = { ...draft, id: existing?.id ?? crypto.randomUUID(), operator: draft.operator.trim(), service: draft.service.trim(), departure: draft.departure.trim(), arrival: draft.arrival.trim() };
    for (const end of ["departure", "arrival"] as const) {
      const choices = localInstants(normalized[`${end}Local`], normalized[`${end}Zone`]);
      if (choices.length === 1) normalized[`${end}Utc`] = choices[0];
    }
    const invalid = segmentInputError(normalized);
    if (invalid) { setError(invalid); return; }
    const next = existing ? original.map((segment) => segment.id === existing.id ? normalized : segment) : [...original, normalized];
    const failure = segmentStore.save(next, original);
    setError(failure);
    if (!failure) router.push(`/trips/${tripId}#trip-transport-title`);
  }

  return <section className="trips-workspace segment-editor">
    <Link className="trip-back" href={`/trips/${tripId}#trip-transport-title`}>← {originalTrip.title}로</Link>
    <h1>이동편 {existing ? "수정" : "추가"}</h1>
    <p className="trip-demo-notice">가상 기록 · 직접 입력 · 이 브라우저에만 저장됩니다. 서버 저장·기기 간 동기화·운행정보 조회는 아직 지원하지 않습니다.</p>
    {storeError && <p role="alert" className="trip-error">{storeError} 입력 내용은 유지했습니다.</p>}
    <form className="trip-form" onSubmit={submit}>
      <div className="trip-form-dates"><label>교통수단<select ref={first} value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as TravelSegment["mode"] })}><option>항공</option><option>철도</option></select></label><label>편명 / 열차번호 · 선택<input maxLength={100} value={draft.service} onChange={(event) => setDraft({ ...draft, service: event.target.value })} /></label></div>
      <label>운영사 · 선택<input maxLength={100} value={draft.operator} onChange={(event) => setDraft({ ...draft, operator: event.target.value })} /></label>
      {(["departure", "arrival"] as const).map((end) => {
        const choices = localInstants(draft[`${end}Local`], draft[`${end}Zone`]);
        const label = end === "departure" ? "출발" : "도착";
        return <fieldset className="segment-endpoint" key={end}><legend>{label}</legend>
          <label>{label} 공항 / 역<input required maxLength={200} value={draft[end]} onChange={(event) => setDraft({ ...draft, [end]: event.target.value })} /></label>
          <div className="trip-form-dates">
            <label>{label} 현지 날짜<input type="date" required min="0001-01-01" max="9999-12-31" value={draft[`${end}Local`].split("T")[0]} onChange={(event) => setDraft({ ...draft, [`${end}Local`]: `${event.target.value}T${draft[`${end}Local`].split("T")[1] ?? ""}`, [`${end}Utc`]: "" })} /></label>
            <label>{label} 현지 시각<input type="time" required value={draft[`${end}Local`].split("T")[1] ?? ""} onChange={(event) => setDraft({ ...draft, [`${end}Local`]: `${draft[`${end}Local`].split("T")[0]}T${event.target.value}`, [`${end}Utc`]: "" })} /></label>
          </div>
          <label>{label} 시간대<select value={draft[`${end}Zone`]} onChange={(event) => setDraft({ ...draft, [`${end}Zone`]: event.target.value, [`${end}Utc`]: "" })}>{zones.map((zone) => <option key={zone} value={zone}>{zone === "Asia/Seoul" ? "서울 · " : zone === "Asia/Tokyo" ? "도쿄 · " : ""}{zone}</option>)}</select></label>
          {choices.length > 1 && <label>{label} 중복 시각 · 선택 필수<select required value={draft[`${end}Utc`]} onChange={(event) => setDraft({ ...draft, [`${end}Utc`]: event.target.value })}><option value="">서머타임으로 겹치는 실제 시각 선택</option>{choices.map((instant, index) => <option key={instant} value={instant}>{index + 1}번째 · UTC {instant.slice(0, 16).replace("T", " ")}</option>)}</select></label>}
          {!choices.length && <p className="trip-warning">{label} 날짜·시간대를 확인해 주세요. 서머타임으로 존재하지 않는 현지 시각일 수 있습니다.</p>}
        </fieldset>;
      })}
      <p className="trip-meta">출발·도착은 각 장소의 현지 날짜와 시간대입니다. 날짜가 달라도 실제 시각을 기준으로 순서를 확인합니다.</p>
      {outside && <p className="trip-warning">여행 기간 밖의 이동편입니다. 여행 기간과 기존 기록은 바꾸지 않고 이 여행에 연결해 저장합니다.</p>}
      {error && <p className="trip-error" role="alert">{error}</p>}
      <div className="trip-actions"><button className="trip-button" disabled={Boolean(storeError)} type="submit">이동편 저장</button><Link className="trip-text-button" href={`/trips/${tripId}#trip-transport-title`}>취소</Link></div>
    </form>
  </section>;
}
