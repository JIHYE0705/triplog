import { isDate } from "./calendar.ts";

export type TravelSegment = {
  id: string; tripId: string; mode: "항공" | "철도"; operator: string; service: string;
  departure: string; arrival: string; departureLocal: string; arrivalLocal: string;
  departureZone: string; arrivalZone: string; departureUtc: string; arrivalUtc: string;
};

// 현지 시각을 다시 포맷해 일치하는 실제 시각만 허용한다. DST 중복 시각은 두 후보를 반환한다.
export function localInstants(local: string, zone: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(local) || !isDate(local.slice(0, 10)) || local.startsWith("0000")) return [];
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: zone, era: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    const wallTime = (instant: number) => {
      const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));
      const date = new Date(0);
      date.setUTCFullYear(parts.era === "BC" ? 1 - Number(parts.year) : Number(parts.year), Number(parts.month) - 1, Number(parts.day));
      date.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), 0);
      return date.getTime();
    };
    const wall = Date.parse(`${local}:00Z`);
    const offsets = new Set<number>();
    for (let hour = -36; hour <= 36; hour += 6) {
      const sample = wall + hour * 3600000;
      offsets.add(wallTime(sample) - sample);
    }
    return [...offsets].map((offset) => wall - offset).filter((instant) => wallTime(instant) === wall).sort((a, b) => a - b).map((instant) => new Date(instant).toISOString());
  } catch { return []; }
}

export function segmentInputError(segment: TravelSegment): string | null {
  if (!["항공", "철도"].includes(segment.mode)) return "교통수단을 선택해 주세요.";
  if (![segment.operator, segment.service].every((value) => typeof value === "string" && value.length <= 100)) return "운영사와 편명·열차번호는 각각 100자 이내로 입력해 주세요.";
  if (![segment.departure, segment.arrival].every((value) => typeof value === "string" && value.trim() && value.length <= 200)) return "출발·도착 공항 또는 역을 1~200자로 입력해 주세요.";
  for (const end of ["departure", "arrival"] as const) {
    const candidates = localInstants(segment[`${end}Local`], segment[`${end}Zone`]);
    if (!candidates.length) return `${end === "departure" ? "출발" : "도착"} 날짜·시간대를 확인해 주세요. 서머타임으로 존재하지 않는 시각은 저장할 수 없습니다.`;
    if (!candidates.includes(segment[`${end}Utc`])) return "서머타임으로 겹치는 시각은 UTC 기준 시각을 선택해 주세요.";
  }
  if (Date.parse(segment.arrivalUtc) < Date.parse(segment.departureUtc)) return "실제 도착 시각은 출발 시각보다 빠를 수 없어요. 각 장소의 현지 날짜와 시간대를 확인해 주세요.";
  return null;
}

export function parseTravelSegments(raw: string): TravelSegment[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Invalid segments");
  const ids = new Set<string>();
  for (const segment of data) {
    if (!segment || typeof segment !== "object" || typeof segment.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(segment.id) || ids.has(segment.id)
      || typeof segment.tripId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(segment.tripId)
      || !["mode", "operator", "service", "departure", "arrival", "departureLocal", "arrivalLocal", "departureZone", "arrivalZone", "departureUtc", "arrivalUtc"].every((key) => typeof segment[key] === "string")
      || segmentInputError(segment)) throw new Error("Invalid segment");
    ids.add(segment.id);
  }
  return data;
}

export function reorderSegment(segments: TravelSegment[], id: string, direction: -1 | 1): TravelSegment[] {
  const index = segments.findIndex((segment) => segment.id === id);
  if (index < 0) return segments;
  let target = index + direction;
  while (target >= 0 && target < segments.length && segments[target].tripId !== segments[index].tripId) target += direction;
  if (target < 0 || target >= segments.length) return segments;
  const next = [...segments];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
