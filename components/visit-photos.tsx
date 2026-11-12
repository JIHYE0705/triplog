"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useDraftGuard } from "@/components/use-draft-guard";
import { demoTripPhotos } from "@/lib/demo-trips";
import { putVisit, visitPhotos, withVisitPhotos, type DiaryEntries, type Visit } from "@/lib/diary";

function photoLabel(src: string) {
  return demoTripPhotos.find((photo) => photo.src === src)?.label ?? "예시 사진";
}

export function VisitPhotos({ visit, disabled, edit }: { visit: Visit; disabled: boolean; edit: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const photos = visitPhotos(visit);
  const [selected, setSelected] = useState<string | null>(null);
  const visible = selected && photos.includes(selected) ? selected : visit.photo;
  return <section className="visit-photos" aria-label={`${visit.place} 사진`}>
    <div className="photo-heading"><span>{photos.length ? `사진 ${photos.length}장` : "아직 사진이 없어요."}</span>
      <button type="button" id={`photo-trigger-${visit.id}`} className="trip-text-button" disabled={disabled} aria-label={`${visit.place} 사진 ${photos.length ? "편집" : "추가"}`} aria-expanded={false} aria-controls={`photo-editor-${visit.id}`} onClick={edit}>{photos.length ? "사진 편집" : "＋ 사진 추가"}</button>
    </div>
    {visible && <Image className="photo-preview" src={visible} width={640} height={480} sizes="(max-width: 767px) 100vw, 640px" alt={`${visit.place} · ${photoLabel(visible)}`} />}
    {photos.length > 0 && <div className="photo-thumbnails">{photos.map((src, index) => <div key={src}>
      <button type="button" aria-pressed={visible === src} aria-label={`${photoLabel(src)} 보기${src === visit.photo ? ", 대표 사진" : ""}`} onClick={() => setSelected(src)}><Image src={src} width={160} height={120} sizes="80px" alt="" /></button>
      <span>{src === visit.photo ? "대표 · " : ""}{index + 1}</span>
    </div>)}</div>}
  </section>;
}

export function VisitPhotoEditor({ date, visit, entries, save, done }: {
  date: string; visit: Visit; entries: DiaryEntries;
  save: (next: DiaryEntries, original: DiaryEntries) => string | null;
  done: (saved?: boolean) => void;
}) {
  const [draft, setDraft] = useState(visit);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const photos = visitPhotos(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(visit);
  const available = demoTripPhotos.filter((photo) => !photos.includes(photo.src));
  useDraftGuard(dirty || selected.length > 0);
  useEffect(() => { heading.current?.focus(); }, []);

  function reorder(index: number, direction: -1 | 1) {
    const next = [...photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(withVisitPhotos(draft, next));
    setMessage(`${photoLabel(photos[index])}을 ${target + 1}번째로 옮겼어요.`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const failure = save(putVisit(entries, date, date, draft), entries);
    setError(failure);
    if (!failure) done(true);
  }

  return <form className="photo-editor" id={`photo-editor-${visit.id}`} onSubmit={submit} aria-label={`${visit.place} 사진 편집`}>
    <h4 ref={heading} tabIndex={-1}>사진 {photos.length}장 · 편집 중</h4>
    <p className="trip-meta">예시 사진만 선택할 수 있어요. 실제 파일 업로드·서버 저장은 지원하지 않습니다.</p>
    {draft.photo && <Image className="photo-preview" src={draft.photo} width={640} height={480} sizes="(max-width: 767px) 100vw, 640px" alt={`현재 대표 · ${photoLabel(draft.photo)}`} />}
    {photos.length ? <ol className="photo-edit-list">{photos.map((src, index) => <li key={src}>
      <div className="photo-edit-row"><Image src={src} width={176} height={132} sizes="88px" alt={photoLabel(src)} /><div>{String(index + 1).padStart(2, "0")} · {src.split("/").at(-1)}{src === draft.photo && <p className="photo-cover-label">현재 대표 사진</p>}</div></div>
      <div className="photo-edit-actions">
        {src !== draft.photo && <button type="button" className="photo-button" aria-label={`${photoLabel(src)} 대표 지정`} onClick={() => { setDraft(withVisitPhotos(draft, photos, src)); setMessage(`${photoLabel(src)}을 대표 사진으로 지정했어요.`); requestAnimationFrame(() => heading.current?.focus()); }}>대표 지정</button>}
        <button type="button" className="photo-button" disabled={index === 0} aria-label={`${photoLabel(src)} 위로 이동`} onClick={() => reorder(index, -1)}>↑ 위로</button>
        <button type="button" className="photo-button" disabled={index === photos.length - 1} aria-label={`${photoLabel(src)} 아래로 이동`} onClick={() => reorder(index, 1)}>아래로 ↓</button>
        <button type="button" className="trip-text-button daily-delete" aria-label={`${photoLabel(src)} 제거`} onClick={() => {
          if (!window.confirm(`${photoLabel(src)}을 이 방문에서 제거할까요? 사진 저장 전에는 취소할 수 있습니다.`)) return;
          setDraft(withVisitPhotos(draft, photos.filter((photo) => photo !== src)));
          setMessage(`${photoLabel(src)}을 제거했어요.${src === draft.photo && photos.length > 1 ? " 남은 첫 사진을 대표로 지정했어요." : ""}`);
          requestAnimationFrame(() => heading.current?.focus());
        }}>제거</button>
      </div>
    </li>)}</ol> : <p className="daily-empty">아직 사진이 없어요. 아래에서 예시 사진을 선택해 주세요.</p>}
    <fieldset className="photo-picker"><legend>예시 사진 추가 · 여러 장 선택</legend>
      {available.length ? <><div className="photo-choices">{available.map(({ src, label }) => <label key={src}>
        <input type="checkbox" checked={selected.includes(src)} onChange={(event) => setSelected(event.target.checked ? [...selected, src] : selected.filter((value) => value !== src))} />
        <Image src={src} width={128} height={96} sizes="64px" alt="" /><span>{label}</span>
      </label>)}</div><button type="button" className="photo-button" disabled={!selected.length} onClick={() => {
        setDraft(withVisitPhotos(draft, [...photos, ...selected])); setSelected([]); setMessage(`${selected.length}장을 추가했어요. 사진 저장을 눌러 반영해 주세요.`);
        requestAnimationFrame(() => heading.current?.focus());
      }}>선택한 {selected.length}장 추가</button></> : <p className="trip-meta">선택할 수 있는 예시 사진 2장을 모두 추가했어요.</p>}
    </fieldset>
    <p className="trip-meta">대표 사진과 표시 순서는 따로 정할 수 있어요. 대표를 제거하면 남은 첫 사진이 대표가 됩니다.</p>
    <p role="status" className="photo-status">{message}</p>
    {error && <p className="trip-error" role="alert">{error}</p>}
    <div className="photo-save"><button type="button" className="trip-text-button" onClick={() => {
      if ((!dirty && !selected.length) || window.confirm("사진 변경 내용을 저장하지 않고 취소할까요?")) done();
    }}>취소</button><button type="submit" className="trip-button" disabled={selected.length > 0}>사진 저장</button></div>
    {selected.length > 0 && <p className="trip-meta">선택한 사진을 먼저 추가하거나 선택을 해제해 주세요.</p>}
    <p className="trip-meta">사진 변경만 이 브라우저에 저장합니다.</p>
  </form>;
}
