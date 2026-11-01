import { isDate } from "./calendar.ts";

export type DemoTrip = {
  id: string;
  title: string;
  startsOn: string;
  endsOn: string;
  coverPhoto: string | null;
  companions: string[];
};

export const demoTripPhotos = [
  { src: "/demo/kyoto.jpg", label: "교토 거리 예시" },
  { src: "/demo/coffee.jpg", label: "커피 예시" },
];

export const demoTrips: DemoTrip[] = [
  { id: "kyoto-autumn", title: "교토의 가을", startsOn: "2026-10-26", endsOn: "2026-11-01", coverPhoto: "/demo/kyoto.jpg", companions: ["지수", "민지"] },
  { id: "busan-weekend", title: "부산에서 보낸 주말", startsOn: "2026-09-12", endsOn: "2026-09-13", coverPhoto: null, companions: [] },
];

// 가상 연결도 날짜로 추론하지 않는다. 실제 연결 테이블은 daily_entry_trips다.
export const demoTripDates: Record<string, string[]> = {
  "kyoto-autumn": ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-31", "2026-11-01"],
};

export const demoTravelSegments = [
  { tripId: "kyoto-autumn", mode: "항공", service: "예시 항공편", departure: "인천", arrival: "간사이", departureLocal: "2026-10-26T08:00", arrivalLocal: "2026-10-26T10:00", departureZone: "Asia/Seoul", arrivalZone: "Asia/Tokyo", position: 0 },
  { tripId: "kyoto-autumn", mode: "철도", service: "예시 열차", departure: "교토역", arrival: "간사이공항역", departureLocal: "2026-11-01T12:00", arrivalLocal: "2026-11-01T13:20", departureZone: "Asia/Tokyo", arrivalZone: "Asia/Tokyo", position: 1 },
];

export function tripInputError(trip: Omit<DemoTrip, "id">): string | null {
  if (!trip.title.trim() || trip.title.length > 200) return "여행 제목을 1~200자로 입력해 주세요.";
  if (!isDate(trip.startsOn) || !isDate(trip.endsOn)) return "시작일과 종료일을 올바르게 입력해 주세요.";
  if (trip.endsOn < trip.startsOn) return "종료일은 시작일보다 빠를 수 없어요.";
  if (trip.coverPhoto !== null && !demoTripPhotos.some((photo) => photo.src === trip.coverPhoto)) return "대표 사진을 예시 사진에서 선택해 주세요.";
  if (trip.companions.length > 30 || trip.companions.some((name) => !name.trim() || name.length > 100)) return "동행자는 이름당 1~100자로 최대 30명까지 입력해 주세요.";
  return null;
}

export function parseDemoTrips(raw: string): DemoTrip[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Invalid demo trips");
  const ids = new Set<string>();
  for (const trip of data) {
    if (!trip || typeof trip !== "object" || typeof trip.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(trip.id) || ids.has(trip.id)
      || typeof trip.title !== "string" || typeof trip.startsOn !== "string" || typeof trip.endsOn !== "string"
      || (trip.coverPhoto !== null && typeof trip.coverPhoto !== "string") || !Array.isArray(trip.companions)
      || !trip.companions.every((name: unknown) => typeof name === "string") || tripInputError(trip)) throw new Error("Invalid demo trip");
    ids.add(trip.id);
  }
  return data;
}

export function overlapsPeriod(startsOn: string, endsOn: string, from: string, to: string): boolean {
  return (!from || endsOn >= from) && (!to || startsOn <= to);
}

export function filterDemoTrips(trips: DemoTrip[], query: string, from: string, to: string, companion: string): DemoTrip[] {
  const keyword = query.trim().toLocaleLowerCase("ko");
  return trips.filter((trip) => trip.title.toLocaleLowerCase("ko").includes(keyword)
    && overlapsPeriod(trip.startsOn, trip.endsOn, from, to)
    && (!companion || trip.companions.includes(companion)))
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn) || a.title.localeCompare(b.title, "ko"));
}

export function outsideTrip(trip: Pick<DemoTrip, "startsOn" | "endsOn">, date: string): boolean {
  return date < trip.startsOn || date > trip.endsOn;
}

export function outsideTripCount(trip: DemoTrip): number {
  const days = (demoTripDates[trip.id] ?? []).filter((date) => outsideTrip(trip, date)).length;
  const segments = demoTravelSegments.filter((segment) => segment.tripId === trip.id &&
    (outsideTrip(trip, segment.departureLocal.slice(0, 10)) || outsideTrip(trip, segment.arrivalLocal.slice(0, 10)))).length;
  return days + segments;
}

export function canDeleteDemoTrip(id: string): boolean {
  return !(demoTripDates[id]?.length || demoTravelSegments.some((segment) => segment.tripId === id));
}
