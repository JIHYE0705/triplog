# triplog 디자인 의사결정

중요한 시각·상호작용 결정만 기록한다. 기능·운영 정책은 [기존 개발 결정](../DECISIONS.md)에 보존한다. 현재 토큰의 단일 기준은 [디자인 시스템](DESIGN_SYSTEM.md)이며 과거 초안과 다르면 최신 승인 기록을 따른다. 사소한 간격 수정은 기록하지 않아도 된다.

## Decision: Mont Blanc Cream

- Date: 2026-10-31
- Status: Approved
- Decision: Quiet Travel Archive — Mont Blanc Edition을 적용하고 기본 포인트를 Mont Blanc Cream으로 지정한다. 흰색을 기본 배경으로, 크림·아이보리는 필요한 강조 면으로 사용한다. Core Palette는 디자인 시스템의 승인된 다섯 토큰을 따른다.
- Rationale: 여행을 소비하는 서비스보다 개인의 사진과 기억을 보관하는 따뜻하고 정갈한 아카이브에 맞춘다.
- Rejected Alternatives: Blue-centered accent system, 이전 몽블랑 팔레트 초안의 HEX를 계속 현재값으로 사용하는 방식, 화면 전체를 베이지 카드로 구성하는 방식.
- Affected Areas: Theme, navigation, calendar selection, buttons, focus and active states, browser/PWA background. 기존 에셋은 보존한다.
- Constraints: 대비 검증, 사진·지도 본래 색과 의미 유지. 크림 위 흰 글자 금지. 작은 텍스트에 text-muted, 크림 위 accent-strong을 그대로 쓰지 않고 디자인 시스템의 허용 조합을 따른다. Supporting/상태 토큰은 초기 제안이며 Core 승인과 구분한다.
- Compatibility: 기존 밤크림 방향을 구체화하며 `docs/DECISIONS.md`의 이전 HEX 초안을 대체한다. SUIT·얄쌍한 로고·개발자 터미널/비행기 콘셉트·월간 세로선 없는 기간 띠·주간 7일 목적은 유지한다.
- Implementation: 문서 승인. 이 PR에서는 CSS·PWA·로고·화면을 변경하지 않는다. 실제 적용에는 승인된 UI 범위와 브라우저 검증이 필요하다.

## Decision: SUIT와 로고 보존

- Date: 2026-10-31
- Status: Approved (기존 선택 재확인)
- Decision: SUIT 자체 호스팅을 유지한다. 본문 400, 제목·선택 500, 필요한 강조 600을 기준으로 얄쌍하고 읽기 쉬운 위계를 만든다. 구체적인 크기·행간은 디자인 시스템의 반응형 기본 제안이다.
- Rationale: 한글·영문의 일관성과 정갈한 개인 여행 수첩의 인상을 유지한다.
- Rejected Alternatives: 장식 폰트·다른 본문 패밀리 혼용, 볼드 남발, 가독성을 희생한 작은 글자, 로고 임의 재제작.
- Affected Areas: 제목·본문·입력·날짜·캡션. 기존 로고 파일·아이콘·문서용 SVG의 원본 지위는 바꾸지 않는다.
- Constraints: 기존 에셋 보존, 본문 가독성·실제 폰트 로딩 검증. 과거 제목 300/400 비교 제안보다 새 기본 위계를 우선하되 기존 화면을 이번에 일괄 변경하지 않는다.

## Decision: UI 설계 승인과 리뷰 분리

- Date: 2026-10-31
- Status: Approved
- Decision: 신규/대규모 UI는 맥락 분석 → 최대 3가지 실질적 방향 비교 → 사용자 선택·승인 → 구현 → 시각 검토 → 중요도순 개선으로 진행한다. 설계와 리뷰 스킬을 저장소에서 관리한다. 작은 수정은 간소화하고 기존 승인을 반복 요청하지 않는다.
- Rationale: 일반적인 AI 화면 패턴을 반복하기보다 승인된 정보 구조와 경험을 축적한다.
- Rejected Alternatives: 색만 다른 시안, 사전 승인 없는 전체 리디자인, 리뷰 요청 중 임의 코드 수정.
- Affected Areas: AGENTS, 프로젝트 UI 설계·리뷰 스킬, 새 화면·대규모 변경 PR.
- Constraints: 리뷰 전용 실행은 읽기 전용. 실제 검증과 미검증을 구분한다. Critical/Major/Minor로 보고하며 기능 범위·DB/API 계약을 확대하지 않는다. #22 세로형 위클리와 #1 미결정 정책을 이번 승인에 포함하지 않는다.

## 향후 기록할 내용

중요한 변경에 Date, Status(Proposed/Approved/Superseded), Decision, Rationale, 검토·기각 대안, Affected Areas, Constraints 및 이전 결정과의 관계를 남긴다. 제안은 사용자 선택 전 Approved로 바꾸지 않는다.
