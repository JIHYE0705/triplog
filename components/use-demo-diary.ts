"use client";

import { useMemo, useSyncExternalStore } from "react";
import { demoEntries } from "@/lib/demo-diary";
import { parseDiaryEntries, type DiaryEntries } from "@/lib/diary";

// shortcut: 인증 전 가상 기록만 로컬 저장, 인증·소유권 검증 후 서버 저장으로 교체.
export const demoDiaryStorageKey = "triplog.demo-diary.v1";
const initial = JSON.stringify(demoEntries);
const eventName = "triplog-demo-diary-changed";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(eventName, notify); };
}

function getSnapshot() {
  try { return window.localStorage.getItem(demoDiaryStorageKey) ?? initial; }
  catch { return ""; }
}

export function useDemoDiary() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const result = useMemo(() => {
    try { return { entries: parseDiaryEntries(raw ?? initial), error: null }; }
    catch { return { entries: null, error: "브라우저의 가상 기록을 불러오지 못했어요. 기존 내용을 덮어쓰지 않았습니다. 저장 설정을 확인해 주세요." }; }
  }, [raw]);

  function save(next: DiaryEntries, original: DiaryEntries) {
    try {
      if (raw === null || getSnapshot() !== raw || JSON.stringify(original) !== JSON.stringify(result.entries)) return "다른 탭에서 기록이 변경됐어요. 입력 내용은 유지했습니다. 취소한 뒤 최신 기록을 확인하고 다시 수정해 주세요.";
      const serialized = JSON.stringify(next);
      parseDiaryEntries(serialized);
      window.localStorage.setItem(demoDiaryStorageKey, serialized);
      window.dispatchEvent(new Event(eventName));
      return null;
    } catch { return "브라우저에 저장하지 못했어요. 입력 내용은 그대로 있습니다. 저장 공간과 브라우저 설정을 확인한 뒤 다시 시도해 주세요."; }
  }

  return { ...result, ready: raw !== null, save };
}
