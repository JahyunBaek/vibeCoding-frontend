# Common System Starter -- Frontend

## 개요

React + TypeScript + Vite 기반의 멀티테넌트 SaaS 관리 시스템 프론트엔드입니다.

**주요 기능:**

- JWT 기반 인증 (access token 메모리 보관 + HttpOnly refresh cookie)
- 역할 기반 접근 제어 (USER / ADMIN / SUPER_ADMIN)
- 화면-액션 권한 시스템 (Screen -> Action -> Role 3단계 모델)
- 멀티테넌트 지원 (테넌트별 브랜딩, 테마, 언어 설정)
- 게시판 (CRUD, 댓글, 파일 첨부, HTML 에디터)
- 조직도, 사용자, 역할, 메뉴, 공통코드 관리
- 감사 로그 조회 및 CSV 내보내기
- 다국어 지원 (한국어 / 영어)
- 다크모드
- 초대 링크를 통한 회원가입
- 실시간 알림

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| UI 프레임워크 | React | 19 |
| 언어 | TypeScript | 5.7 |
| 빌드 도구 | Vite (SWC) | 5.4 |
| 서버 상태 관리 | TanStack Query (React Query) | 5 |
| 클라이언트 상태 관리 | Zustand | 4.5 |
| 라우팅 | React Router | 6 |
| CSS | Tailwind CSS | 3.4 |
| UI 컴포넌트 | shadcn/ui (Radix UI) | - |
| HTTP 클라이언트 | Axios | 1.13 |
| 다국어 | i18next + react-i18next | 25 / 16 |
| HTML 에디터 | TipTap | 3 |
| 폼 관리 | React Hook Form + Zod | 7 / 4 |
| 차트 | Recharts | 3 |
| 토스트 | Sonner | 2 |
| 아이콘 | Lucide React | 0.468 |
| HTML Sanitizer | DOMPurify | 3 |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm
- 백엔드 서버 실행 중 (기본 `http://localhost:28080`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (port 5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

### 타입 체크

테스트 프레임워크는 별도로 설정되어 있지 않으며, 타입 체크는 아래 명령어로 수행합니다.

```bash
npx tsc --noEmit
```

### 백엔드 프록시

Vite 개발 서버가 `/api` 및 `/images` 요청을 백엔드로 프록시합니다.

- 기본 대상: `http://localhost:28080`
- 변경 방법: 프로젝트 루트에 `.env` 파일 생성 후 아래 설정 추가

```env
VITE_API_PROXY_TARGET=http://your-backend-host:port
```

---

## 프로젝트 구조

```
src/
├── components/          # 컴포넌트
│   ├── ui/              #   shadcn/ui 원본 (Button, Input, Card, Badge 등)
│   ├── layout/          #   AppLayout, Sidebar, Topbar
│   ├── Breadcrumb.tsx   #   경로 네비게이션
│   ├── Can.tsx          #   권한 기반 조건부 렌더링
│   ├── ConfirmDialog.tsx#   삭제 확인 다이얼로그
│   ├── ErrorBoundary.tsx#   에러 바운더리
│   ├── Pagination.tsx   #   공통 페이지네이션
│   ├── RichEditor.tsx   #   TipTap 기반 HTML 에디터
│   └── TenantSelector.tsx#  SUPER_ADMIN용 테넌트 필터
│
├── config/              # 상수 및 설정
│   └── permissions.ts   #   SCREENS, ACTIONS 상수 + 타입 정의
│
├── hooks/               # 커스텀 훅
│   ├── useAction.ts     #   권한 체크 훅
│   └── useTenantTheme.ts#   테넌트 테마/언어 자동 적용
│
├── lib/                 # 유틸리티 및 외부 클라이언트
│   ├── api.ts           #   Axios 인스턴스 + 모든 API 메서드
│   ├── i18n.ts          #   i18next 초기화
│   └── utils.ts         #   cn() 등 범용 헬퍼
│
├── locales/             # 번역 파일
│   ├── ko.json          #   한국어
│   └── en.json          #   영어
│
├── pages/               # 페이지 컴포넌트
│   ├── boards/          #   게시판 페이지
│   ├── admin/           #   관리자 페이지 (ADMIN 이상)
│   ├── super-admin/     #   슈퍼관리자 페이지 (SUPER_ADMIN만)
│   └── sample/          #   샘플 페이지
│
├── routes/              # 라우터 설정
│   ├── AppRoutes.tsx    #   React Router v6 라우트 정의
│   └── guards.tsx       #   RequireAuth, RequireAdmin, RequireSuperAdmin
│
├── stores/              # Zustand 상태
│   ├── auth.ts          #   accessToken, user, permissions
│   └── theme.ts         #   다크모드 (persist)
│
└── types/               # 공유 타입 정의
    ├── api.ts           #   ApiError, ApiResponse<T>
    ├── auth.ts          #   UserSummary
    ├── menu.ts          #   MenuNode, FlatMenu
    ├── org.ts           #   OrgNode, FlatOrg
    └── tenant.ts        #   Tenant 관련 타입
```

---

## 페이지 목록

### 공개 페이지 (인증 불필요)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/login` | `LoginPage` | 로그인 |
| `/reset-password` | `ResetPasswordPage` | 비밀번호 재설정 (토큰 기반) |
| `/signup` | `SignupPage` | 초대 링크 기반 회원가입 |

### 일반 사용자 페이지 (RequireAuth)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/dashboard` | `DashboardPage` | 대시보드 |
| `/boards/:boardId` | `BoardListPage` | 게시판 목록 |
| `/boards/:boardId/new` | `BoardWritePage` | 게시글 작성 |
| `/boards/:boardId/posts/:postId` | `BoardPostPage` | 게시글 상세 / 수정 |
| `/me` | `MyInfoPage` | 내 정보 수정 |
| `/sample/patients` | `SamplePatientsPage` | 샘플 - 환자 목록 |
| `/sample/trials` | `SampleTrialsPage` | 샘플 - 임상시험 목록 |

### 관리자 페이지 (RequireAdmin -- ADMIN, SUPER_ADMIN)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/admin/boards` | `AdminBoardsPage` | 게시판 관리 |
| `/admin/users` | `AdminUsersPage` | 사용자 관리 |
| `/admin/orgs` | `AdminOrgsPage` | 조직 관리 |
| `/admin/codes` | `AdminCodesPage` | 공통코드 관리 |
| `/admin/roles` | `AdminRolesPage` | 역할 관리 |
| `/admin/menus` | `AdminMenusPage` | 메뉴 관리 |
| `/admin/screens` | `AdminScreensPage` | 화면-액션 권한 관리 |
| `/admin/settings` | `AdminSettingsPage` | 테넌트 설정 |
| `/admin/audit` | `AdminAuditPage` | 감사 로그 |

### 슈퍼관리자 페이지 (RequireSuperAdmin -- SUPER_ADMIN만)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/super-admin/tenants` | `SuperAdminTenantsPage` | 테넌트 관리 |

---

## 인증 흐름

1. **앱 초기화**: `App.tsx`에서 `POST /api/auth/refresh`를 호출하여 기존 세션의 access token을 복구합니다.
2. **토큰 저장**: access token은 Zustand 스토어(메모리)에만 보관됩니다. Refresh token은 HttpOnly 쿠키로 관리됩니다.
3. **자동 첨부**: `src/lib/api.ts`의 Axios 인스턴스가 모든 요청에 `Authorization: Bearer` 헤더를 자동으로 첨부합니다.
4. **401 자동 갱신**: 401 응답 시 single-flight 방식으로 refresh를 시도하고, 성공하면 대기 큐의 요청을 일괄 재시도합니다. 실패하면 전부 reject하고 로그인 페이지로 이동합니다.

### 라우트 가드

| 가드 | 조건 | 동작 |
|------|------|------|
| `RequireAuth` | `initialized` 전까지 Spinner, access token 없으면 redirect | `/login`으로 리다이렉트 |
| `RequireAdmin` | `roleKey`가 `ADMIN` 또는 `SUPER_ADMIN` | 403 페이지 표시 |
| `RequireSuperAdmin` | `roleKey`가 `SUPER_ADMIN` | 403 페이지 표시 |

### 비밀번호 재설정

1. 관리자가 `/admin/users`에서 사용자 드롭다운 -> "비밀번호 재설정 링크" 클릭 -> Redis 토큰 생성 (30분 TTL)
2. 생성된 URL을 사용자에게 전달
3. `/reset-password?token=xxx` 페이지에서 새 비밀번호 설정 (토큰은 1회용)

### 초대 및 회원가입

1. 관리자가 `/admin/users`에서 이메일+역할로 초대 생성
2. 초대 받은 사용자가 `/signup?token=xxx`으로 접속하여 계정 생성

---

## 상태 관리

### 서버 상태 -- TanStack Query (React Query v5)

모든 백엔드 데이터는 `useQuery` + `useMutation` 패턴으로 관리합니다.

```tsx
// 조회
const { data, isLoading, refetch } = useQuery({
  queryKey: ["boards", boardId, "posts", page],
  queryFn: () => api.postsList(boardId, page),
});

// 생성/수정/삭제
const createMut = useMutation({
  mutationFn: () => api.postCreate(boardId, title, content, fileIds),
  onSuccess: () => { refetch(); toast.success("생성되었습니다."); },
  onError: (e: Error) => toast.error(e.message),
});
```

### 클라이언트 상태 -- Zustand

| 스토어 | 파일 | 관리 항목 |
|--------|------|-----------|
| `useAuthStore` | `src/stores/auth.ts` | accessToken, user (UserSummary), permissions, initialized |
| `useThemeStore` | `src/stores/theme.ts` | isDark (localStorage 자동 persist) |

---

## 다국어 (i18n)

`react-i18next` 기반으로 한국어/영어를 지원합니다.

### 설정

- 초기화: `src/lib/i18n.ts`
- fallback 언어: `ko` (한국어)
- 감지 순서: `localStorage("language")` -> `navigator`

### 번역 파일

| 파일 | 언어 |
|------|------|
| `src/locales/ko.json` | 한국어 |
| `src/locales/en.json` | 영어 |

### 번역 키 구조 (top-level namespaces)

| 키 | 설명 |
|----|------|
| `common` | 저장, 취소, 삭제 등 공통 텍스트 |
| `auth` | 로그인, 로그아웃 관련 |
| `nav` | 네비게이션 메뉴 |
| `sidebar` | 사이드바 |
| `breadcrumb` | 경로 네비게이션 |
| `board` | 게시판 |
| `comment` | 댓글 |
| `admin` | 관리자 페이지 |
| `tenant` | 테넌트 관련 |
| `myInfo` | 내 정보 |
| `notification` | 알림 |
| `error` | 에러 메시지 |
| `sample` | 샘플 페이지 |
| `editor` | HTML 에디터 |

### 테넌트 언어 자동 적용

`useTenantTheme` 훅이 테넌트 브랜딩 API에서 `locale` 값을 가져와 자동 적용합니다.
사용자가 수동으로 언어를 변경한 경우 (`localStorage`에 `language` 키가 있을 때) 자동 적용을 건너뜁니다.

### 수동 전환

Topbar의 Globe 버튼으로 한국어/영어를 수동 전환할 수 있습니다.

---

## 공통코드 연동

백엔드에서 관리하는 공통코드를 프론트엔드에서 조회하여 select/filter 등에 활용합니다.

### 사용 패턴

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// 공통코드 조회
const { data: statusCodes } = useQuery({
  queryKey: ["commonCodes", "PATIENT_STATUS"],
  queryFn: () => api.commonCodes("PATIENT_STATUS"),
  staleTime: 5 * 60 * 1000,
});

// select에서 사용
<select value={status} onChange={e => setStatus(e.target.value)}>
  <option value="">전체</option>
  {statusCodes?.map(c => (
    <option key={c.code} value={c.code}>{c.name}</option>
  ))}
</select>
```

### API

```ts
api.commonCodes(groupKey: string)
// 반환: { code: string; name: string; value: string }[]
```

공통코드 그룹은 `/admin/codes` 페이지에서 관리할 수 있습니다.

---

## 파일 업로드 / 다운로드

### 일반 첨부 파일

```ts
// 1. 파일 업로드 -> fileId 반환
const result = await api.fileUpload(file);
// result: { fileId: number; originalName: string; sizeBytes: number }

// 2. 게시글 생성 시 fileIds 전달
await api.postCreate(boardId, title, content, [result.fileId]);

// 진행률 포함 업로드
const result = await api.fileUploadWithProgress(file, (pct) => {
  console.log(`${pct}% 완료`);
});
```

### 인라인 이미지 (에디터 내 이미지)

```ts
// RichEditor에서 이미지 삽입 시 사용
const { url } = await api.fileUploadInlineImage(file);
// url을 에디터에 삽입
```

### 파일 다운로드

파일 다운로드는 반드시 `api.fileDownload()`를 사용해야 합니다. `<a href>`를 직접 사용하면 Bearer 토큰이 전송되지 않습니다.

```ts
await api.fileDownload(fileId, fileName);
```

---

## UI 컴포넌트

### shadcn/ui (src/components/ui/)

`Button`, `Input`, `Card`, `Badge`, `Separator`, `Avatar`, `DropdownMenu`, `AlertDialog`, `Dialog`, `Spinner`

> `src/components/ui/` 하위 파일은 shadcn/ui 원본이므로 직접 수정하지 않습니다.

### 공통 컴포넌트

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `Pagination` | `src/components/Pagination.tsx` | 테이블 하단 페이지네이션 |
| `ConfirmDialog` | `src/components/ConfirmDialog.tsx` | 삭제 확인 다이얼로그 (AlertDialog 래퍼) |
| `Breadcrumb` | `src/components/Breadcrumb.tsx` | 현재 경로 한국어 라벨 표시 |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | 앱 크래시 방지 + 에러 화면 |
| `Can` | `src/components/Can.tsx` | 권한 기반 조건부 렌더링 |
| `RichEditor` | `src/components/RichEditor.tsx` | TipTap 기반 HTML 에디터 (이미지 첨부 지원) |
| `TenantSelector` | `src/components/TenantSelector.tsx` | SUPER_ADMIN용 테넌트 필터 드롭다운 |

### 아이콘

`lucide-react` 라이브러리를 사용합니다.

```tsx
import { Plus, Trash2, MoreHorizontal } from "lucide-react";
```

### 토스트 알림

`sonner` 라이브러리를 사용합니다. `<Toaster />`는 `App.tsx`에 전역 설정되어 있습니다.

```ts
import { toast } from "sonner";
toast.success("성공 메시지");
toast.error("에러 메시지");
```

### 삭제 확인 다이얼로그

`window.confirm()` 대신 `ConfirmDialog` 컴포넌트를 사용합니다.

```tsx
const [deleteTarget, setDeleteTarget] = useState<any>(null);

<ConfirmDialog
  open={!!deleteTarget}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="삭제 확인"
  description={`"${deleteTarget?.name}"을 삭제하시겠습니까?`}
  onConfirm={() => deleteMut.mutate()}
/>
```

---

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_PROXY_TARGET` | `http://localhost:28080` | 개발 서버 백엔드 프록시 대상 |

`.env` 파일은 프로젝트 루트(frontend/)에 생성합니다.

---

## 테넌트 테마

`useTenantTheme` 훅 (`src/hooks/useTenantTheme.ts`)이 테넌트 브랜딩 API를 호출하여 CSS 변수와 언어를 자동 적용합니다.

### 적용되는 CSS 변수

| CSS 변수 | 용도 |
|----------|------|
| `--tenant-primary` | 주 색상 (버튼, 링크 등) |
| `--tenant-sidebar` | 사이드바 배경색 |
| `--tenant-accent` | 강조 색상 |

### 브랜딩 API 응답

```ts
api.tenantBranding()
// 반환: { companyName, logoUrl, locale, primaryColor, sidebarColor, accentColor }
```

### 동작 방식

1. 로그인 후 `useTenantTheme`이 `GET /api/tenant/branding` 호출
2. 응답의 색상 값을 `document.documentElement`의 CSS 변수로 설정
3. `locale` 값이 있고 사용자가 수동 언어 설정을 하지 않은 경우 자동으로 언어 전환
4. `Sidebar`에서 `companyName`과 `logoUrl`을 표시

---

## 화면-액션 권한 시스템

Screen -> Action -> Role 3단계 권한 모델입니다.

### 구성 요소

- **상수 정의**: `src/config/permissions.ts` -- `SCREENS`, `ACTIONS` as const + `ScreenKey`, `ActionKey` 타입
- **권한 저장**: `useAuthStore`의 `permissions: Record<string, string[]>` -- `{ "BOARD_POST": ["CREATE", "EDIT"], ... }`
- **권한 체크 Hook**: `useAction(screen, action): boolean`
- **조건부 렌더링**: `<Can screen={...} action={...}>` 컴포넌트

### 사용 예시

```tsx
import { useAction } from "@/hooks/useAction";
import { Can } from "@/components/Can";
import { SCREENS, ACTIONS } from "@/config/permissions";

// Hook 방식
const canEdit = useAction(SCREENS.BOARD_POST, ACTIONS.EDIT);

// 컴포넌트 방식
<Can screen={SCREENS.BOARD_POST} action={ACTIONS.CREATE}>
  <Button>글쓰기</Button>
</Can>
```

### 권한 로드 시점

- 로그인 시 (`LoginPage`)
- 앱 초기화 시 (`App.tsx`)
- `GET /api/permissions/my` 호출 -> `useAuthStore.setPermissions()`

### 관리

`/admin/screens` 페이지에서 화면/액션 목록을 관리하고, 역할별 권한을 체크박스로 토글합니다.
