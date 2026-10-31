import type { Metadata } from "next";

export const metadata: Metadata = { title: "나의 지도" };

export default function MapPage() {
  return (
    <>
      <p className="page-label">MY MAP</p>
      <h1>나의 지도</h1>
      <p className="page-intro">다녀온 장소를 사진과 함께 다시 찾아볼 공간입니다.</p>
      <section className="notebook" aria-label="지도 기능 안내">
        <article className="md:col-span-3"><h2>방문 지도를 준비하고 있어요</h2><p>장소 검색과 실제 지도는 아직 연결하지 않았습니다. 기록 저장 기능을 만든 뒤 방문한 장소와 연결합니다.</p></article>
      </section>
    </>
  );
}
