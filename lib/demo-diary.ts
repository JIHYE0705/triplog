import { demoTripDates } from "./demo-trips.ts";
import type { DiaryEntries, Visit } from "./diary.ts";
export type { DemoEntry, Visit } from "./diary.ts";

const samples: Record<string, { visits: Omit<Visit, "id">[]; diary?: string }> = {
  "2026-10-26": { visits: [
    { place: "작은 로스터리", time: "10:30", photo: "/demo/coffee.jpg", note: "창가에 앉아 여행 첫날의 계획을 정리했다." },
    { place: "강변 산책길", photo: "/demo/kyoto.jpg", note: "시간을 정하지 않고 천천히 걸었다." },
    { place: "골목 서점", time: "15:00", note: "얇은 여행 에세이 한 권을 골랐다." },
    { place: "동네 식당", time: "18:20", note: "따뜻한 저녁으로 하루를 마무리했다." },
    { place: "숙소 앞 작은 공원", note: "밤바람을 쐬며 잠깐 쉬었다." },
  ], diary: "새로운 동네에서 시작한 한 주. 바쁘게 다니기보다 마음에 드는 곳에 오래 머물렀다." },
  "2026-10-27": { visits: [
    { place: "오래된 산책길", time: "09:00", photo: "/demo/kyoto.jpg", note: "아침 햇살을 따라 걸었다." },
    { place: "작은 로스터리", photo: "/demo/coffee.jpg", note: "어제 마음에 들었던 카페에 다시 들렀다." },
  ] },
  "2026-10-28": { visits: [], diary: "오늘은 숙소에서 쉬었다. 장소를 남기지 않아도 하루를 기억할 수 있다." },
  "2026-10-29": { visits: [
    { place: "아주 긴 이름을 가진 골목 안의 작은 여행 기념품 가게", time: "13:10", photo: "/demo/kyoto.jpg", note: "긴 장소명도 일간에서는 빠짐없이 읽을 수 있다." },
    { place: "저녁 카페", time: "17:30", photo: "/demo/coffee.jpg", note: "따뜻한 커피와 함께 쉬었다." },
    { place: "동네 시장", note: "가벼운 간식을 샀다." },
  ] },
  "2026-10-31": { visits: [
    { place: "강변 산책길", time: "11:00", photo: "/demo/kyoto.jpg", note: "같은 장소를 다른 시간에 다시 걸었다." },
    { place: "작은 로스터리", photo: "/demo/coffee.jpg", note: "여행 중 가장 익숙해진 카페." },
    { place: "오후의 서점", time: "14:30", note: "돌아가기 전 책을 구경했다." },
    { place: "저녁 식당", time: "19:00", note: "천천히 저녁을 먹었다." },
  ], diary: "익숙해진 길과 장소들이 생겼다. 사진과 함께 이번 주를 오래 기억하고 싶다." },
  "2026-11-01": { visits: [
    { place: "마지막 아침 카페", time: "08:30", photo: "/demo/coffee.jpg", note: "달이 바뀌어도 여행은 이어진다." },
    { place: "역 앞 산책길", note: "돌아가는 길에 잠깐 걸었다." },
    { place: "기차역", time: "12:00", note: "다음 여행을 기다리며 집으로." },
  ] },
};

export const demoEntries: DiaryEntries = Object.fromEntries(Object.entries(samples).map(([date, entry]) => [date, {
  ...entry,
  tripIds: Object.entries(demoTripDates).filter(([, dates]) => dates.includes(date)).map(([id]) => id),
  visits: entry.visits.map((visit, index) => ({ ...visit, id: `sample-${date}-${index}`, tripId: "kyoto-autumn", ...(visit.time ? { timeZone: "Asia/Tokyo" } : {}) })),
}]));
