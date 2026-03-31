# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 개발 서버 실행 (port 5173)
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과물 미리보기
```

테스트 프레임워크 없음. 타입 체크는 `npx tsc --noEmit`.

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

각 디렉토리에 상세 규칙이 담긴 `CLAUDE.md`가 있다. 새 파일 추가 시 해당 디렉토리의 CLAUDE.md를 참고할 것.

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
