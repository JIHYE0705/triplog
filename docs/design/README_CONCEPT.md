# README 디자인 시안

작성일: 2026-11-01. 상태: **정적 제안 · 앱 미적용**.

![triplog 주간·일간 디자인 제안](../assets/triplog-design-study.png)

## 목적과 방향

[디자인 시스템](DESIGN_SYSTEM.md)의 Quiet Travel Archive — Mont Blanc Edition을 README에서 살펴볼 수 있게 만든 이미지다. 흰 바탕·절제된 크림 강조·얇은 구분선·사진 본래 색을 사용한다. 메뉴는 다이어리·여행·지도다. 기존 로고·아이콘·문서용 SVG를 수정하지 않으며 이미지의 소문자 이름은 설명용 텍스트다.

주간에서 날짜와 방문을 훑고 일간에서 사진과 글을 읽는 한 방향을 제안한다. 기존 두 열·네 행, 월요일 시작의 7일+주간 메모 구조를 유지한다. #22의 세로형 배치 선택이나 앱 전체 리디자인 승인을 뜻하지 않는다.

| 화면 | 구조와 목적 | 장점 | 후속 검토 |
| --- | --- | --- | --- |
| 주간 | 두 열에 7일 전체, 작은 사진·장소·시간·+N개 | 한 주의 흐름을 날짜별로 비교 | 모바일에서는 사진·노출 수를 줄여야 함. 소감 본문보다 장소·시간 우선 |
| 일간 | 큰 사진 → 장소별 소감 → 하루 일기 | 사진과 글의 읽기 순서가 명확 | 긴 글·여러 방문·사진 없는 기록의 위계 확인 |

현행 탐색을 보존하면서 사진·글의 크기 차이로 화면의 역할을 구별할 수 있어 이 방향을 제안한다. 여러 신규 배치를 비교하거나 실제 UI를 변경하는 작업은 포함하지 않았다.

## 생성 방법과 한계

내장 ImageGen으로 생성했다. 교토 여행 기록·사진·문구는 설명용 가상 콘텐츠이며 실제 방문 사실이나 사용자의 사진이 아니다. 별도 외부 사진 다운로드를 사용하지 않았다.

이미지의 글꼴과 자간, 작은 글씨, 시간·사진 정렬은 생성 결과다. 날짜의 일부 획은 세리프처럼 표현됐으며 **최종 구현에서는 SUIT 단일 패밀리로 맞춰야 한다.** 정확한 HEX·폰트 로딩·터치 영역·대비·스크린리더·320px 리플로우를 이미지로 검증했다고 보지 않는다. 현재 앱은 이전 팔레트의 조회용 샘플이며 이 이미지에 표시된 탭·이전/다음 날짜·콘텐츠 구성이 모두 구현돼 있다는 뜻이 아니다.

## UI 구현 전에 확인할 항목

- 320/360/390px·데스크톱, 낮은 높이·safe area·200% 글자 확대에서 마지막 날짜와 +N개 접근.
- 긴 한글·영문 장소명, 사진 없음, 기록 없음, 방문이 많은 날. 생성 시안은 기록이 있는 날 위주이므로 빈 상태 검증을 대신하지 않는다.
- 실제 SUIT 로딩, 본문 16px·400과 제목/선택 500, 색 대비·키보드·포커스·터치 영역.
- 일간의 장소별 소감과 하루 일기 구분, 긴 글과 이전/다음 날짜·주간 복귀.
- 실제 브라우저와 아이폰 Safari·홈 화면 실행의 결과를 별도로 기록.

기능 범위는 [PRD](../PRD.md), 구현 상태는 [README](../../README.md), 토큰은 [디자인 시스템](DESIGN_SYSTEM.md)을 따른다. 이 제안을 승인된 디자인 결정으로 기록하지 않는다.

<details>
<summary>이미지 생성에 사용한 최종 프롬프트</summary>

Use case: ui-mockup. Create a polished high fidelity UI design proposal board for Korean personal private travel diary web app triplog, Quiet Travel Archive — Mont Blanc Edition. Wide landscape editorial presentation, NOT a marketing landing page. Pure white #FFFFFF background, warm ink #302B27, sparse Mont Blanc Cream #E9DDC7 highlights, soft ivory #F8F3E9, chestnut #79634F active text, 1px #E8E3DB rules. Korean SUIT-like sans serif regular body and medium headings, airy restrained hierarchy, no bold heavy headings. No logos/icons redesign: just lowercase text triplog in small regular type, do not draw a new logo. Two beautifully legible interface panels: left a desktop weekly diary spread (two columns and four rows: Monday 26, Tuesday 27, Wednesday 28, Thursday 29 left; Friday 30, Saturday 31, Sunday 1, a quiet weekly note right), right a narrow mobile daily diary with a large authentic natural-color travel photo of Kyoto river and autumn trees, place description, diary. Seven full dates must remain visible in weekly board with small natural color photo thumbnails, short place names and times, a +2개 overflow link, and an empty day reading 기록 없음. Top navigation on both: 다이어리 여행 지도; tabs 월간 주간 일간 with 주간 active in left panel and 일간 active in right panel. Main weekly date 2026.10.26 — 11.01, daily 10월 30일 금요일. Sample places 교토역, 가모가와, 작은 서점, 철학의 길. Sample diary text: 강을 따라 천천히 걸었다. Include small caption beneath panels: 주간 · 한 주 전체를 한눈에 and 일간 · 사진과 글을 차분하게. Quiet 24/32px spaces, thin horizontal rules, no repeated rounded beige cards, no decorative shadows, no gradients, no stickers, no stats dashboard, no marketing headlines, no reservations or ratings, no beige photo filter. Designed as plausible screenshot-quality flat UI proposals on a white board with no device frames, no perspective. Small board heading triplog / DESIGN STUDY and small footer CONCEPT · SAMPLE DATA. This is a static fictional design proposal, not a real application screenshot.

</details>
