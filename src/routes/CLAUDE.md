# src/routes — 라우터 설정 & 가드

## 파일 구조

```
routes/
├── AppRoutes.tsx    # React Router v6 중첩 라우트 정의
└── guards.tsx       # RequireAuth, RequireAdmin, RequireSuperAdmin
```

## 라우트 구조

```
/login                          → LoginPage (공개)
/reset-password                 → ResetPasswordPage (공개)
/signup                         → SignupPage (공개)
/                               → RequireAuth > AppLayout
  /dashboard                    →   DashboardPage
  /sample/patients              →   SamplePatientsPage
  /sample/trials                →   SampleTrialsPage
  /analysis/agent               →   AgentChatPage
  /boards/:boardId              →   BoardListPage
  /boards/:boardId/new          →   BoardWritePage
  /boards/:boardId/posts/:postId →  BoardPostPage
  /me                           →   MyInfoPage
  /admin/*                      →   RequireAdmin > Admin*Page
  /super-admin/*                →   RequireSuperAdmin > SuperAdmin*Page
/*                              → /dashboard (리다이렉트)
```

## 가드 컴포넌트

| 가드 | 조건 | 실패 시 |
|------|------|---------|
| `RequireAuth` | `initialized` && `accessToken` | Spinner 또는 `/login` 리다이렉트 |
| `RequireAdmin` | `user.roleKey` ∈ {ADMIN, SUPER_ADMIN} | 403 텍스트 표시 |
| `RequireSuperAdmin` | `user.roleKey === "SUPER_ADMIN"` | 403 텍스트 표시 |

## 새 라우트 추가 절차

1. `AppRoutes.tsx`에 `<Route>` 추가 (import + JSX)
2. 인증 필요: `RequireAuth` 하위 (AppLayout 내부)에 배치
3. Admin 전용: `<RequireAdmin>` 으로 감싸기
4. Super Admin 전용: `<RequireSuperAdmin>` 으로 감싸기
5. 공개 페이지: AppLayout 외부, `RequireAuth` 바깥에 배치

## 주의사항

- 모든 인증 필요 페이지는 `AppLayout` 하위에 위치해야 사이드바/Topbar가 표시됨
- 동적 세그먼트 (`:boardId`, `:postId`)는 Breadcrumb에서 자동으로 건너뜀
- `Navigate to="/dashboard" replace`가 catch-all로 있어 존재하지 않는 경로는 대시보드로 이동
