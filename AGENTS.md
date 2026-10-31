# triplog 프로젝트 지침

## 프로젝트 정체성

triplog는 날짜·장소·사진·일기·동행자·이동편을 연결하는 개인 비공개 여행 아카이브다. 예약·추천·소셜 서비스로 확장하지 않는다. 브랜드는 소문자 `triplog`, Quiet Travel Archive — Mont Blanc Edition을 따른다. 기존의 얄쌍한 로고와 개발자 터미널 앞을 지나는 비행기 심벌·에셋을 보존한다.

## 개발 및 디자인 원칙

- 기능 범위는 [PRD](docs/PRD.md), [인수인계](docs/CODEX_HANDOFF.md), 관련 GitHub Issue 및 진행표 #12를 먼저 확인한다. 기존 기획·운영 정책은 [개발 결정](docs/DECISIONS.md)을 따른다.
- UI 작업 전에 [디자인 시스템](docs/design/DESIGN_SYSTEM.md)과 [승인된 디자인 결정](docs/design/DECISIONS.md)을 읽는다. 최신 승인 결정을 우선하고 미결정 정책을 임의 확정하지 않는다. 상세 토큰은 디자인 시스템에서만 관리한다.
- 흰 배경·몽블랑 크림 포인트·SUIT·얇은 구분선·사진과 글 중심의 위계를 유지한다. 카드·배지·그림자·장식·마케팅 문구를 기본값으로 반복하지 않는다.
- 기존 컴포넌트·스타일을 재사용한다. 모바일 우선, 주간 7일 전체 보기와 +N개 접근, 월간의 세로선 없는 기간 띠를 보존한다. 메뉴는 다이어리·여행·지도다.
- 신규 화면·대규모 UI 변경은 `.agents/skills/triplog-ui-design/SKILL.md`를 따라 맥락 분석 → 실질적으로 다른 최대 3개 방향 비교 → 사용자 선택·승인 → 구현 → 시각 검토 → 개선 순으로 진행한다. 기존 승인은 다시 묻지 않는다. 작은 변경은 절차를 간소화한다.
- UI 리뷰는 `.agents/skills/triplog-ui-review/SKILL.md`를 따른다. 리뷰 전용 요청에서는 파일을 수정하지 않는다. 중요한 디자인 변경은 디자인 결정 문서에 이유·대안·영향을 기록한다.
- 현재 기술 스택과 실제 파일을 확인한다. 기능·디자인 변경을 분리하고 기존 Git 변경·인증·소유권 검증·API/데이터 계약·현지 날짜·기록을 보존한다. 디자인 작업으로 DB·외부 연동을 변경하지 않는다. 새 라이브러리는 이유·대안을 제시하고 승인 후 설치한다.

## 필수 검증

- 코드 변경에 맞는 테스트, `npm run lint`, `npm run typecheck`, 빌드를 수행한다. 현재 `npm test`는 빌드와 Node 테스트를 함께 실행한다. 문서·스킬만 변경하면 링크·형식·기존 지침 보존을 확인하고 앱 검사 실행 여부를 보고한다.
- UI 변경은 320/360/390px 및 데스크톱, 낮은 높이·가로 화면·글자 확대·safe area, 긴 한글·사진 유무·다량/빈 기록을 확인한다. 실제 브라우저 스크린샷, 키보드·터치·포커스·명도 대비와 Loading/Empty/Error를 검토한다.
- Critical(기능·접근성) → Major(사용성·배치·가독성) → Minor(간격·정렬) 순으로 수정·재검토한다. 가상 데이터·자동 검사·반응형 에뮬레이션과 실제 연동·iPhone Safari 실기기 결과를 구분하고 미검증을 명시한다.

## GitHub 작업 규칙

- 최신 main에서 작업 브랜치를 만들고 PR로 변경한다. 머지는 사용자가 진행한다.
- PR·이슈 제목에는 작업 성격에 맞는 개발용 이모지를 붙인다 (`✨ feat:`, `🐛 fix:`, `📝 docs:`, `🔧 chore:`).
- PR 생성 전 기존 라벨을 확인해 맞는 라벨을 붙이고 생성 후 적용 여부를 확인한다. 적절한 라벨이 없으면 임의 생성하지 않고 사용자에게 알린다.
- 완료 조건을 충족한 이슈는 머지·반영 상태를 확인한 뒤 닫고 진행표 #12를 갱신한다. 부분 구현·미검증 항목은 완료 처리하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
