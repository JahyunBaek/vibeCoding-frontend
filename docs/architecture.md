# Frontend Architecture

## 기술 스택

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| 프레임워크 | React 18 + TypeScript | UI |
| 번들러 | Vite | 빌드/개발 서버 |
| 서버 상태 | TanStack Query v5 | API 캐시, 동기화 |
| 클라이언트 상태 | Zustand | 인증, 테마 |
| 라우팅 | React Router v6 | SPA 라우팅 |
| UI | shadcn/ui + Tailwind CSS | 컴포넌트/스타일 |
| 다국어 | i18next | ko/en |
| 알림 | sonner | Toast |
| 아이콘 | lucide-react | 아이콘 |
| 에디터 | TipTap | 리치 텍스트 |
| Lint | ESLint + Prettier | 코드 품질 |

## 디렉토리 구조

```
src/
├── types/          # 공통 타입 정의 (ApiResponse, MenuNode, ...)
├── config/         # 상수·설정 (permissions 등)
├── lib/
│   ├── client.ts   # axios 인스턴스, interceptors, refresh, apiRequest
│   ├── utils.ts    # cn() 등 유틸
│   ├── i18n.ts     # i18next 초기화
│   └── api/        # 도메인별 API 메서드
│       ├── index.ts    # 통합 export (api 객체)
│       ├── auth.ts     # 인증
│       ├── board.ts    # 게시판
│       ├── admin.ts    # 관리자
│       ├── sample.ts   # 샘플
│       ├── agent.ts    # AI Agent
│       └── (도메인별 추가)
├── stores/         # Zustand 스토어 (auth, theme)
├── hooks/          # 커스텀 훅
├── locales/        # 번역 JSON (ko.json, en.json)
├── components/
│   ├── ui/         # shadcn/ui 기본 컴포넌트
│   └── layout/     # AppLayout, Sidebar, Topbar
├── pages/
│   ├── LoginPage, DashboardPage, ...
│   ├── boards/     # 게시판
│   ├── sample/     # 샘플 데이터 (데모)
│   ├── analysis/   # AI Agent
│   ├── admin/      # 관리자
│   └── super-admin/
└── routes/
    ├── AppRoutes.tsx  # 라우트 정의
    └── guards.tsx     # RequireAuth, RequireAdmin, RequireSuperAdmin
```

## 데이터 흐름

```
사용자 액션
  → React Component (useState/useForm)
  → useMutation / useQuery (TanStack Query)
  → api.xxx() (src/lib/api/)
  → apiRequest() (src/lib/client.ts)
  → axios → Backend REST API
  → 응답 → TanStack Query 캐시 → UI 자동 업데이트
```

## 상태 관리 전략

| 종류 | 도구 | 예시 |
|------|------|------|
| 서버 상태 (비동기) | TanStack Query | API 데이터, 목록, 상세 |
| 인증 상태 | Zustand | accessToken, user, permissions |
| 테마 | Zustand | dark/light, locale |
| 페이지 로컬 상태 | useState | 필터, 모달 열림, 입력값 |

## 인증 흐름 (프론트엔드)

```
앱 시작 → App.tsx → POST /api/auth/refresh
  → 성공: accessToken → Zustand에 저장, user/permissions 로드
  → 실패: 로그인 페이지로 이동

API 요청 → axios interceptor → Authorization: Bearer {token}
  → 401: refresh 시도 → 성공: 재요청 / 실패: 로그아웃
```

## 코드 품질

```bash
npm run check    # 전체 (typecheck + lint + format:check)
npm run lint     # ESLint
npm run format   # Prettier 적용
npm run typecheck # tsc --noEmit
```

### ESLint 규칙
- TypeScript recommended
- React Hooks rules
- React Refresh (HMR 호환)
- `@typescript-eslint/no-explicit-any`: off (점진적 타입 강화)
- Prettier와 충돌 방지 (`eslint-config-prettier`)

### Prettier 설정
- `printWidth: 120`, `singleQuote: false`, `trailingComma: all`, `endOfLine: lf`
