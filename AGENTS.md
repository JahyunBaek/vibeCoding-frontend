# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 개발 서버 실행 (port 5173)
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과물 미리보기
npm run lint       # ESLint 검사
npm run lint:fix   # ESLint 자동 수정
npm run format     # Prettier 포맷 적용
npm run format:check # Prettier 포맷 검사
npm run typecheck  # 타입 체크 (tsc --noEmit)
npm run check      # typecheck + lint + format:check (전체 품질 검사)
```

테스트 프레임워크 없음.

### 검증 스크립트

```bash
bash scripts/check.sh        # 전체 품질 검사 (typecheck + lint + prettier + build)
bash scripts/check-i18n.sh   # ko.json ↔ en.json 번역 키 동기화 검증
bash scripts/setup.sh        # 개발 환경 초기 설정
```

## 백엔드 프록시

Vite dev 서버가 `/api` 요청을 백엔드로 프록시한다. 기본 타겟은 `http://localhost:28080`.
변경하려면 `.env` 파일에 `VITE_API_PROXY_TARGET=http://...` 를 설정한다.

## 기술 스택

- React 18 + TypeScript + Vite
- TanStack Query v5 (서버 상태)
- Zustand (클라이언트 상태)
- React Router v6 (라우팅)
- shadcn/ui + Tailwind CSS (UI)
- i18next (다국어: ko/en)
- sonner (Toast 알림)
- lucide-react (아이콘)
- TipTap (리치 에디터)

## 아키텍처 개요

### 인증 흐름

- 앱 최초 진입 시 `App.tsx`가 `POST /api/auth/refresh` 를 호출해 accessToken을 복구한다.
- accessToken은 **메모리(Zustand)** 에만 보관. refresh token은 HttpOnly 쿠키.
- `src/lib/client.ts`의 axios 인스턴스가 모든 요청에 `Authorization: Bearer` 헤더를 자동 첨부한다.
- 401 응답 시 single-flight refresh → 성공하면 대기 큐의 요청을 일괄 재시도, 실패하면 전부 reject.
- 파일 다운로드는 `<a href>` 대신 `api.fileDownload()`로 반드시 axios를 통해 처리해야 토큰이 전송된다.

### 멀티테넌시 (SaaS)

- `SUPER_ADMIN`: 시스템 전체 관리자. `tenantId = null`. `/api/super-admin/**` 접근 가능.
- `ADMIN`: 특정 테넌트 관리자. JWT `tid` 클레임에 tenantId 포함.
- `USER`: 일반 사용자.
- 백엔드 `TenantContextHolder`가 현재 tenantId를 자동 추출, 모든 쿼리에 필터 적용.

### 화면-액션 권한 시스템

화면(Screen) → 액션(Action) → 역할(Role) 3단계 권한 모델.
- 로그인/앱 초기화 시 `GET /api/permissions/my` → Zustand `permissions`에 저장
- `useAction(screen, action)` 훅 또는 `<Can>` 컴포넌트로 UI 제어

### 서버 응답 형식

```ts
{ success: boolean; data: T; error?: { code: string; message: string } }
```

### 공통코드 (Common Codes)

드롭다운/콤보박스 선택 항목을 관리하는 시스템. `api.commonCodes("GROUP_KEY")`로 조회.

| Group Key | 용도 |
|-----------|------|
| `YN` | 범용 Y/N |
| `PATIENT_STATUS` | 환자 상태 |
| `DEPARTMENT` | 진료과 |
| `BLOOD_TYPE` | 혈액형 |
| `GENDER` | 성별 |
| `TRIAL_PHASE` | 임상시험 단계 |
| `TRIAL_STATUS` | 임상시험 상태 |

## 폴더 구조

각 디렉토리에 상세 규칙이 담긴 `AGENTS.md`가 있다. 새 파일 추가 시 해당 디렉토리의 AGENTS.md를 참고할 것.

```
src/
├── types/          # 공통 타입 정의
├── config/         # 상수·설정 (permissions 등)
├── lib/            # API 클라이언트 & 유틸리티
├── stores/         # Zustand 클라이언트 상태
├── hooks/          # 재사용 커스텀 훅
├── locales/        # 다국어 번역 JSON (ko, en)
├── components/     # 공통 컴포넌트 & shadcn/ui
├── pages/          # 페이지 컴포넌트
└── routes/         # 라우터 & 가드
```

## import 순서

1. 외부 라이브러리 (`react`, `react-router-dom`, `lucide-react` …)
2. 내부 — `@/lib/*`, `@/stores/*`, `@/hooks/*`
3. 내부 — `@/components/*`
4. 내부 — `@/types/*` (타입은 마지막, `import type` 사용)

## 브랜치 전략

- 큰 단위의 신규 기능 개발 시 `feature/xxxx` 브랜치(원격 포함)를 생성하여 개발 및 테스트한다.
- 문제없으면 `dev` 브랜치에 merge 한다.
- `main` 브랜치로의 merge는 **사용자가 직접** 진행한다. (Codex가 main에 merge하지 않는다.)

### 🔍 main/dev가 아닌 브랜치 작업 시 검증 절차 (필수)

`feature/xxx`, `common/xxx`, `hotfix/xxx` 등에서 작업할 때는 다음을 반드시 확인하라.

**작업 시작 전**:
```bash
git fetch origin
git branch --show-current                       # 현재 브랜치 확인
git log HEAD..origin/dev --oneline              # dev가 내 브랜치보다 앞선 커밋
git log origin/dev..HEAD --oneline              # 내 브랜치가 dev보다 앞선 커밋
```
- dev가 앞서 있으면 머지/리베이스로 동기화 후 작업
- 너무 오래 격리되면 머지 비용이 폭증한다 — 가급적 자주 dev를 끌어와라

**작업 중간**:
- i18n 키 추가/수정했다면: `bash scripts/check-i18n.sh` (ko/en 동기화)
- 컴포넌트 추가했다면 해당 디렉토리 `AGENTS.md` 규칙 준수
- `npx tsc --noEmit` 으로 타입 검증

**머지 직전**:
```bash
git fetch origin
npx tsc --noEmit                                 # 타입 검증
bash scripts/check-i18n.sh                       # i18n 동기화
bash scripts/check.sh                            # 전체 품질 검사
```

**백엔드 마이그레이션과의 연계**:
- 백엔드 마이그레이션이 추가됐다면 프론트 dev 머지보다 **백엔드 dev 머지를 먼저** 진행
- 프론트만 먼저 머지되면 새 API 호출은 실패한다
