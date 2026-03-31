# src/pages — 페이지 컴포넌트

## 디렉토리 구조

```
pages/
├── DashboardPage.tsx           # 대시보드 (메인)
├── LoginPage.tsx               # 로그인 (공개)
├── SignupPage.tsx              # 회원가입 (공개, 초대 토큰 필요)
├── ResetPasswordPage.tsx       # 비밀번호 재설정 (공개, 토큰 필요)
├── MyInfoPage.tsx              # 내 정보 수정
│
├── boards/                     # 게시판
│   ├── BoardListPage.tsx       #   게시글 목록
│   ├── BoardPostPage.tsx       #   게시글 상세 (댓글 포함)
│   └── BoardWritePage.tsx      #   게시글 작성/수정
│
├── sample/                     # 샘플 데이터 (Mock)
│   ├── SamplePatientsPage.tsx  #   환자 관리
│   └── SampleTrialsPage.tsx    #   임상시험 관리
│
├── analysis/                   # 분석
│   └── AgentChatPage.tsx       #   AI Agent 채팅
│
├── admin/                      # 관리자 전용 (ADMIN + SUPER_ADMIN)
│   ├── AdminUsersPage.tsx      #   사용자 관리
│   ├── AdminRolesPage.tsx      #   역할 관리
│   ├── AdminBoardsPage.tsx     #   게시판 관리
│   ├── AdminOrgsPage.tsx       #   조직 관리
│   ├── AdminMenusPage.tsx      #   메뉴 관리
│   ├── AdminCodesPage.tsx      #   공통코드 관리
│   ├── AdminScreensPage.tsx    #   화면-액션 권한
│   ├── AdminSettingsPage.tsx   #   테넌트 설정
│   └── AdminAuditPage.tsx      #   감사 로그
│
└── super-admin/                # 슈퍼어드민 전용 (SUPER_ADMIN만)
    └── SuperAdminTenantsPage.tsx  # 테넌트 관리
```

## 페이지 작성 패턴

### 기본 구조

```tsx
export default function SomePage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // 서버 상태: useQuery
  const { data, isLoading, refetch } = useQuery({ ... });

  // 변경: useMutation
  const createMut = useMutation({
    mutationFn: () => api.xxxCreate(...),
    onSuccess: () => { refetch(); toast.success(t("...")); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("xxx.pageTitle")}</div>
      {/* ... */}
    </div>
  );
}
```

### Admin 페이지 공통 UI 패턴

1. **생성 폼**: 카드 헤더 우측 버튼으로 토글. 추가/취소 시 자동 닫힘
2. **편집 패널**: 파란 점선 배경 패널이 테이블 위에 표시. 편집 중 행은 하이라이트
3. **삭제/편집 액션**: 행 우측 `MoreHorizontal` → `DropdownMenu` (편집 / 삭제). 삭제는 `ConfirmDialog` 사용
4. **트리 페이지** (Orgs, Menus): `flattenTree()` → `depth` 기반 `paddingLeft` 계층 표현
5. **페이지네이션**: `<Pagination>` 공통 컴포넌트 사용
6. **CSV 내보내기**: 사용자, 감사 로그 페이지에서 사용

## 새 페이지 추가 절차

1. **페이지 파일 생성**: `src/pages/{folder}/{PageName}Page.tsx`
2. **라우트 등록**: `src/routes/AppRoutes.tsx`에 `<Route>` 추가
3. **Breadcrumb 라벨**: `src/components/Breadcrumb.tsx`의 `PATH_LABELS`에 추가
4. **번역 추가**: `src/locales/ko.json`, `en.json`에 해당 도메인 키 추가
5. **메뉴 등록**: 백엔드 Flyway 마이그레이션으로 `menus` 테이블에 INSERT
6. **권한 필요 시**: 가드 컴포넌트로 감싸기 (`RequireAdmin`, `RequireSuperAdmin`)

## 폴더 분류 기준

| 폴더 | 접근 권한 | 라우트 가드 |
|------|-----------|-------------|
| `pages/` (루트) | 인증된 모든 사용자 또는 공개 | `RequireAuth` 또는 없음 |
| `pages/boards/` | 인증된 모든 사용자 | `RequireAuth` |
| `pages/sample/` | 인증된 모든 사용자 | `RequireAuth` |
| `pages/analysis/` | 인증된 모든 사용자 | `RequireAuth` |
| `pages/admin/` | ADMIN + SUPER_ADMIN | `RequireAdmin` |
| `pages/super-admin/` | SUPER_ADMIN만 | `RequireSuperAdmin` |

## 네이밍 규칙

- 파일명: `{기능}{Page}.tsx` (PascalCase, 접미사 `Page`)
- export: `export default function {기능}Page()`
- Admin 페이지: `Admin{기능}Page.tsx`
- Super Admin 페이지: `SuperAdmin{기능}Page.tsx`
