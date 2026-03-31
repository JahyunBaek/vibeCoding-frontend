# src/components — 공통 컴포넌트

## 디렉토리 구조

```
components/
├── ui/                 # shadcn/ui 원본 — 직접 수정 금지, npx shadcn-ui add로 관리
│   ├── alert-dialog.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── separator.tsx
│   └── spinner.tsx
│
├── layout/             # 레이아웃 전용 (AppLayout 하위)
│   ├── AppLayout.tsx   #   Sidebar + Topbar + Breadcrumb + <Outlet />
│   ├── Sidebar.tsx     #   동적 메뉴 렌더링 (GET /api/menus/my)
│   └── Topbar.tsx      #   다크모드 토글, 알림, 프로필
│
├── Can.tsx             # 권한 기반 조건부 렌더링
├── ConfirmDialog.tsx   # 삭제 확인 다이얼로그 (AlertDialog 래퍼)
├── Pagination.tsx      # 테이블 하단 페이지네이션
├── Breadcrumb.tsx      # 현재 경로 네비게이션
├── ErrorBoundary.tsx   # 앱 크래시 방지
├── TenantSelector.tsx  # SUPER_ADMIN용 테넌트 필터 드롭다운
└── RichEditor.tsx      # TipTap 기반 HTML 에디터
```

## 공통 컴포넌트 사용 가이드

### ConfirmDialog — 삭제 확인

`window.confirm()` 대신 반드시 이 컴포넌트를 사용한다.

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

### Can — 권한 조건부 렌더링

화면-액션 권한이 필요한 UI 요소를 감싼다. `useAction` 훅을 내부적으로 사용.

```tsx
import { Can } from "@/components/Can";
import { SCREENS, ACTIONS } from "@/config/permissions";

<Can screen={SCREENS.BOARD_POST} action={ACTIONS.CREATE}>
  <Button>글쓰기</Button>
</Can>

// condition prop으로 추가 조건 결합 가능
<Can screen={SCREENS.BOARD_POST} action={ACTIONS.EDIT} condition={isAuthor}>
  <Button>수정</Button>
</Can>
```

### Pagination — 페이지네이션

모든 목록 페이지 하단에 사용. `page`, `totalPages`, `onChange`만 전달.

```tsx
<Pagination page={page} totalPages={totalPages} onChange={setPage} />
```

### TenantSelector — 테넌트 필터

SUPER_ADMIN 전용. 역할이 SUPER_ADMIN이 아니면 자동으로 null 반환.

```tsx
<TenantSelector value={tenantId} onChange={setTenantId} />
```

### RichEditor — HTML 에디터

TipTap 기반. 게시판 글쓰기/편집에 사용. 이미지 업로드 내장.

## 새 공통 컴포넌트 추가 기준

| 기준 | 위치 |
|------|------|
| **2개 이상 페이지**에서 재사용 | `src/components/` |
| 특정 페이지에서만 사용 | 해당 페이지 파일 내부 또는 같은 폴더 |
| shadcn/ui 기반 primitive | `src/components/ui/` (npx 명령으로 추가) |
| 레이아웃 관련 | `src/components/layout/` |

## ui/ 수정 규칙

- `src/components/ui/` 파일은 shadcn/ui 원본이므로 **직접 수정하지 않는다**
- 커스텀이 필요하면 래퍼 컴포넌트를 `src/components/`에 만든다 (예: `ConfirmDialog`는 `AlertDialog` 래퍼)
- 새 ui 컴포넌트 추가: `npx shadcn-ui@latest add {component}`
- 아이콘은 `lucide-react` 사용
