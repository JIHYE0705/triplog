"use client";

import Link from "next/link";
import { useDemoTrips } from "@/components/use-demo-trips";

export function TripMapNotice({ id }: { id: string }) {
  const { trips, error } = useDemoTrips();
  const trip = trips?.find((item) => item.id === id);
  return <section className="trip-map-notice">
    {error ? <p role="alert">{error}</p> : !trips ? <p role="status">가상 여행을 불러오는 중…</p> : trip ? <>
      <h2>{trip.title}</h2><p>이 여행의 지도를 선택했어요. 실제 지도·장소 좌표와 여행별 핀은 아직 연결하지 않았습니다.</p><Link className="back-to-week" href={`/trips/${trip.id}`}>← 여행 기록으로</Link>
    </> : <><p>이 브라우저에서 여행을 찾을 수 없어요.</p><Link className="back-to-week" href="/trips">여행 목록으로</Link></>}
  </section>;
}
