export default function DiaryPage() {
  return (
    <>
      <p className="page-label">DIARY</p>
      <h1>나의 다이어리</h1>
      <p className="page-intro">다녀온 장소와 사진, 하루의 이야기를 한곳에.<br />같은 기록을 월간·주간·일간으로 모아볼 공간입니다.</p>
      <section className="notebook" aria-label="다이어리 보기 안내">
        <article><h2>월간</h2><p>달력 위에 여행의 시작과 끝을 잇는 옅은 밤크림색 띠를 표시합니다.</p></article>
        <article><h2>주간</h2><p>펼친 수첩처럼 일주일 전체의 장소와 작은 사진을 한눈에 봅니다.</p></article>
        <article><h2>일간</h2><p>하루에 다녀온 여러 장소의 소감과 하루 전체의 일기를 나누어 남깁니다.</p></article>
      </section>
    </>
  );
}
