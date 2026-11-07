"use client";

import { useMemo, useSyncExternalStore } from "react";
import { demoTravelSegments } from "@/lib/demo-trips";
import { parseTravelSegments, type TravelSegment } from "@/lib/travel-segments";

// shortcut: 인증 전 가상 이동편만 로컬 저장, 인증·소유권 검증 후 서버 저장으로 교체.
export const demoSegmentsStorageKey = "triplog.demo-segments.v1";
const initial = JSON.stringify(demoTravelSegments);
const eventName = "triplog-demo-segments-changed";
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(eventName, notify); };
}
function getSnapshot() {
  try { return window.localStorage.getItem(demoSegmentsStorageKey) ?? initial; }
  catch { return ""; }
}
export function useDemoSegments() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const result = useMemo(() => {
    if (raw === null) return { segments: null, error: null };
    try { return { segments: parseTravelSegments(raw), error: null }; }
    catch { return { segments: null, error: "이동편을 불러오지 못했어요. 기존 내용을 덮어쓰지 않았습니다. 브라우저 저장 설정을 확인해 주세요." }; }
  }, [raw]);
  function save(next: TravelSegment[], original: TravelSegment[]) {
    try {
      if (raw === null || getSnapshot() !== raw || JSON.stringify(result.segments) !== JSON.stringify(original)) return "다른 탭에서 이동편이 변경됐어요. 입력 내용은 유지했습니다. 취소 후 최신 이동편을 확인하고 다시 수정해 주세요.";
      const serialized = JSON.stringify(next);
      parseTravelSegments(serialized);
      window.localStorage.setItem(demoSegmentsStorageKey, serialized);
      window.dispatchEvent(new Event(eventName));
      return null;
    } catch { return "이동편을 브라우저에 저장하지 못했어요. 입력 내용은 유지했습니다. 저장 공간과 설정을 확인해 주세요."; }
  }
  return { ...result, ready: raw !== null, save };
}
