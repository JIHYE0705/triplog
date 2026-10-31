import type { Metadata } from "next";

export const metadata: Metadata = { title: "여행" };

export default function TripsPage() {
  return (
    <>
      <p className="page-label">TRIPS</p>
      <h1>여행</h1>
      <p className="page-intro">여행마다 날짜별 기록과 사진을 모아볼 공간입니다.</p>
      <section className="notebook" aria-label="여행 기능 안내">
        <article className="md:col-span-3"><h2>여행 기록을 준비하고 있어요</h2><p>여행 제목과 기간을 정하고 기록을 연결하는 기능은 다음 단계에서 추가합니다.</p></article>
      </section>
    </>
  );
}
