"use client";

import { useMemo, useSyncExternalStore } from "react";
import { demoTrips, parseDemoTrips, type DemoTrip } from "@/lib/demo-trips";

// shortcut: 인증 전 가상 여행만 로컬 저장, 인증·소유권 검증 후 서버 저장으로 교체.
export const demoTripsStorageKey = "triplog.demo-trips.v1";
const initial = JSON.stringify(demoTrips);
const eventName = "triplog-demo-trips-changed";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(eventName, notify);
  };
}

function getSnapshot() {
  try { return window.localStorage.getItem(demoTripsStorageKey) ?? initial; }
  catch { return ""; }
}

export function useDemoTrips() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const result = useMemo(() => {
    if (raw === null) return { trips: null, error: null };
    try { return { trips: parseDemoTrips(raw), error: null }; }
    catch { return { trips: null, error: "브라우저의 가상 기록을 불러오지 못했어요. 기존 내용을 덮어쓰지 않았습니다. 브라우저 저장 설정을 확인해 주세요." }; }
  }, [raw]);

  function save(trips: DemoTrip[]) {
    try {
      if (raw === null || getSnapshot() !== raw) return "다른 탭에서 여행이 변경됐어요. 목록에서 최신 내용을 확인한 뒤 다시 시도해 주세요.";
      const next = JSON.stringify(trips);
      parseDemoTrips(next);
      window.localStorage.setItem(demoTripsStorageKey, next);
      window.dispatchEvent(new Event(eventName));
      return null;
    } catch { return "브라우저에 저장하지 못했어요. 입력 내용은 그대로 있습니다. 저장 공간과 브라우저 설정을 확인한 뒤 다시 시도해 주세요."; }
  }

  return { ...result, save };
}
