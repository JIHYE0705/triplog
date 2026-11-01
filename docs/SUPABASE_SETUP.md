# Supabase 연결

## 현재 범위

- 프로젝트: `triplog-dev` / 서울 `ap-northeast-2`
- 프로젝트 ref: `htnaiayvvovgkcnsipzh`
- 차곡과 별도 DB·Auth·Storage를 사용한다.
- 생성 당시 Free 플랜·월 $0 견적을 확인했다. 유료 옵션은 켜지 않으며 향후 한도·비용은 별도로 확인한다.
- 서버 클라이언트·읽기 전용 Data API 연결 검사와 [기록 데이터 모델](DATA_MODEL.md)을 구성한다. Google 로그인·허용 계정·계정 관리는 사용자 결정으로 보류했다. 기록 테이블은 앱 역할의 읽기·쓰기를 차단한다.

## 실행과 연결 검사

샘플 화면은 환경변수와 로그인 없이 `npm run dev`로 실행한다. 실제 DB 기록을 조회하거나 저장하지 않는다.

연결을 검사하려면 `.env.example`을 `.env.local`로 복사하고 프로젝트 URL·publishable key를 입력한다. 기존 `.env.local`이 있으면 덮어쓰지 않는다.

```sh
npm ci
npm run check:supabase
```

`SUPABASE_URL`·`SUPABASE_PUBLISHABLE_KEY`는 서버에서만 읽는다. secret/service_role 키·Google Secret은 필요하지 않으며 실제 환경 파일은 커밋하지 않는다. 기존 인증 작업에서 쓰던 `APP_URL`은 이번 연결에는 필요 없다.

`lib/supabase/server.ts`는 세션 저장·자동 갱신·OAuth URL 감지를 끈 클라이언트를 만든다. 연결 검사는 이 클라이언트로 `_triplog_connection_probe`를 0행 조회한다. 이 검사용 테이블은 의도적으로 만들지 않아 PostgREST의 테이블 없음(`PGRST205`) 응답도 연결 성공으로 판단하며 데이터를 쓰지 않는다. 그 외 오류는 실패한다. 스키마 설명 조회는 현재 프로젝트에서 secret key를 요구하므로 사용하지 않는다. 클라이언트 설정은 [공식 문서](https://supabase.com/docs/reference/javascript/initializing)를 따른다.

연결 성공은 URL·키로 Data API에 도달했다는 뜻이며 로그인·실제 기록 저장·소유권 검증 성공을 뜻하지 않는다. CI에서는 실제 프로젝트 키 없이 클라이언트 설정과 기존 샘플 화면만 검사한다.

## 보류한 인증 작업

로그인·허용 계정·계정 관리는 다른 기능 개발 이후 마지막 단계로 옮겼다. 인증 부분 때문에 여행·일기·사진·지도·복구 기능의 개발을 중단하지 않으며 가상 데이터·전용 개발 DB 테스트로 검증한다. 실제 개인 기록·사진의 앱 연결과 공개 운영은 마지막 인증·권한 검증을 마친 뒤 진행한다.

기존 `feat/2-supabase-auth`의 미커밋 변경분은 Git stash `deferred: Triplog Google auth before connection-only scope 2026-11-01`에 보존했다. 이 stash는 로컬 복구용이며 원격 저장소에는 올라가지 않는다. 재개할 때 최신 main과 비교해 필요한 변경만 복원한다.

이전 인증 작업의 로컬 파일은 `20261031073934_app_access.sql`이지만 실제 원격 적용 버전은 `20261031074132_app_access.sql`이다. 기록 모델 작업에서 원격 이력을 fetch해 후자를 저장소에 복원했다. `private.allowed_accounts`와 `public.has_app_access()`는 앱에서 사용하지 않으며 삭제하거나 접근 권한을 넓히지 않는다. 신규 환경에서는 저장소의 마이그레이션 순서를 따른다. 원래 권한 테스트는 위 stash에 남겨 두며 인증 재개 시 별도로 검토한다.

개인 기록 테이블·사진 메타데이터 관계는 구성했지만 사진 버킷·작성 API는 아직 없다. `npm run test:db`로 전용 개발 DB의 제약·앱 역할 차단을 검증하고 가상 데이터를 롤백한다. 실제 데이터를 앱에 연결할 때 인증·소유권 RLS·비공개 사진 권한 검증도 함께 구현하며 #2는 열린 상태로 유지한다.
