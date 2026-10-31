# GitHub 작업 규칙

- 최신 main에서 작업 브랜치를 만들고 PR로 변경한다. 머지는 사용자가 진행한다.
- PR·이슈 제목에는 작업 성격에 맞는 개발용 이모지를 붙인다 (`✨ feat:`, `🐛 fix:`, `📝 docs:`, `🔧 chore:`).
- PR 생성 전 기존 라벨을 확인해 맞는 라벨을 붙이고 생성 후 적용 여부를 확인한다. 적절한 라벨이 없으면 임의 생성하지 않고 사용자에게 알린다.
- 완료 조건을 충족한 이슈는 머지·반영 상태를 확인한 뒤 닫고 진행표 #12를 갱신한다. 부분 구현·미검증 항목은 완료 처리하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
