# Supabase 연결

## 현재 범위

- 프로젝트: `triplog-dev` / 서울 `ap-northeast-2`
- 프로젝트 ref: `htnaiayvvovgkcnsipzh`
- 차곡과 별도 DB·Auth·Storage를 사용한다.
- 생성 당시 Free 플랜·월 $0 견적을 확인했다. 유료 옵션은 켜지 않으며 향후 한도·비용은 별도로 확인한다.
- 서버 클라이언트와 읽기 전용 Data API 연결 검사만 구성한다. Google 로그인·허용 계정·계정 관리는 사용자 결정으로 보류했다.

## 실행과 연결 검사

샘플 화면은 환경변수와 로그인 없이 `npm run dev`로 실행한다. 실제 DB 기록을 조회하거나 저장하지 않는다.

연결을 검사하려면 `.env.example`을 `.env.local`로 복사하고 프로젝트 URL·publishable key를 입력한다. 기존 `.env.local`이 있으면 덮어쓰지 않는다.

```sh
npm ci
npm run check:supabase
```

`SUPABASE_URL`·`SUPABASE_PUBLISHABLE_KEY`는 서버에서만 읽는다. secret/service_role 키·Google Secret은 필요하지 않으며 실제 환경 파일은 커밋하지 않는다. 기존 인증 작업에서 쓰던 `APP_URL`은 이번 연결에는 필요 없다.

`lib/supabase/server.ts`는 세션 저장·자동 갱신·OAuth URL 감지를 끈 클라이언트를 만든다. 연결 검사는 이 클라이언트로 `_triplog_connection_probe`를 0행 조회한다. 아직 앱 테이블이 없어 PostgREST의 테이블 없음(`PGRST205`) 응답도 연결 성공으로 판단하며, 이 테이블을 만들거나 데이터를 쓰지 않는다. 그 외 오류는 실패한다. 스키마 설명 조회는 현재 프로젝트에서 secret key를 요구하므로 사용하지 않는다. 클라이언트 설정은 [공식 문서](https://supabase.com/docs/reference/javascript/initializing)를 따른다.

연결 성공은 URL·키로 Data API에 도달했다는 뜻이며 로그인·실제 기록 저장·소유권 검증 성공을 뜻하지 않는다. CI에서는 실제 프로젝트 키 없이 클라이언트 설정과 기존 샘플 화면만 검사한다.

## 보류한 인증 작업

기존 `feat/2-supabase-auth`의 미커밋 변경분은 Git stash `deferred: Triplog Google auth before connection-only scope 2026-11-01`에 보존했다. 이 stash는 로컬 복구용이며 원격 저장소에는 올라가지 않는다. 재개할 때 최신 main과 비교해 필요한 변경만 복원한다.

이전 작업에서 전용 개발 DB에 `20261031073934_app_access.sql`이 이미 적용됐다. `private.allowed_accounts`와 `public.has_app_access()`는 이번 앱에서 사용하지 않으며 삭제하거나 접근 권한을 넓히지 않는다. 해당 마이그레이션과 권한 테스트 원본은 위 stash에 포함되어 있다. 인증을 재개할 때 원격 마이그레이션 이력과 대조해 복원한다. 새 DB에 이 인증 스키마를 적용할 필요는 없다.

개인 기록 테이블·사진 버킷·작성 API는 아직 구성하지 않았다. 실제 데이터를 연결할 때 인증·소유권 RLS·비공개 사진 권한 검증도 함께 구현하며 #2는 열린 상태로 유지한다.
