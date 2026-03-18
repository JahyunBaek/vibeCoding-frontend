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

Vite dev 서버가 `/api` 요청을 백엔드로 프록시한다. 기본 타겟은 `http://localhost:8888`.
변경하려면 `.env` 파일에 `VITE_API_PROXY_TARGET=http://...` 를 설정한다.

## 아키텍처 개요

### 인증 흐름

- 앱 최초 진입 시 `App.tsx`가 `POST /api/auth/refresh` 를 호출해 accessToken을 복구한다.
- accessToken은 **메모리(Zustand)** 에만 보관 (`src/stores/auth.ts`). refresh token은 HttpOnly 쿠키.
- `src/lib/api.ts`의 axios 인스턴스(`client`)가 모든 요청에 `Authorization: Bearer` 헤더를 자동 첨부한다.
- 401 응답 시 single-flight refresh → 성공하면 대기 큐의 요청을 일괄 재시도, 실패하면 전부 reject.
- 파일 다운로드는 `<a href>` 대신 `api.fileDownload()`로 반드시 axios를 통해 처리해야 토큰이 전송된다.

### 라우팅 & 가드

- `src/routes/AppRoutes.tsx`: React Router v6, 중첩 라우트 구조.
- `RequireAuth`: `initialized` 전까지 로딩 표시, accessToken 없으면 `/login` 리다이렉트.
- `RequireAdmin`: `user.roleKey !== "ADMIN"` 이면 403 표시.
- 인증이 필요한 모든 페이지는 `AppLayout` 하위에 위치한다.

### 레이아웃

- `AppLayout` = `Sidebar` + `Topbar` + `<Outlet />`
- `Sidebar`는 `GET /api/menus/my` 로 서버에서 메뉴 트리를 받아 동적으로 렌더링한다. 게시판 생성/삭제 후에는 `queryKey: ["menus", "my"]` 를 invalidate해야 사이드바가 갱신된다.

### API 레이어 (`src/lib/api.ts`)

모든 백엔드 호출은 `api` 객체 또는 `apiRequest()` 함수를 통한다. 새 엔드포인트 추가 시 `api` 객체 말미에 메서드를 추가한다.
서버 응답 형식: `{ success: boolean; data: T; error?: { code, message } }`

### 상태 관리

- **서버 상태**: TanStack Query (React Query v5). 페이지 컴포넌트에서 `useQuery` / `refetch` 직접 사용.
- **클라이언트 상태**: Zustand (`useAuthStore`) — accessToken, user, initialized 만 관리.

### 어드민 페이지 공통 UI 패턴

`src/pages/admin/` 하위 6개 페이지는 동일한 구조를 따른다:

1. **생성 폼**: 카드 헤더 우측 버튼 토글. 추가/취소 시 자동 닫힘.
2. **편집 패널**: 파란 점선 배경 패널이 테이블 위에 표시. 편집 중인 행은 하이라이트.
3. **삭제/편집 액션**: 행 우측 `MoreHorizontal` → `DropdownMenu` (편집 / 삭제).
4. **트리 페이지** (Orgs, Menus): `flattenTree()`로 평탄화 후 `depth`에 따라 `paddingLeft`로 계층 표현. `collapsedIds: Set<number>` state로 접기/펼치기 관리.

### shadcn/ui 컴포넌트

`src/components/ui/`에 있는 것만 사용 가능: `Button`, `Input`, `Card`, `Badge`, `Separator`, `Avatar`, `DropdownMenu`.
아이콘은 `lucide-react` 사용.
