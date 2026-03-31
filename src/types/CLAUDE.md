# src/types — 공통 타입 정의

## 파일 구조

```
types/
├── api.ts       # ApiError, ApiResponse<T> — 모든 API 응답의 공통 래퍼
├── auth.ts      # UserSummary — 인증된 사용자 정보
├── menu.ts      # MenuNode, FlatMenu — 메뉴 트리 구조
├── org.ts       # OrgNode, FlatOrg — 조직 트리 구조
└── tenant.ts    # Tenant, TenantListRow, TenantCreateRequest, TenantUpdateRequest
```

## 현재 타입 목록

| 타입 | 파일 | 용도 |
|------|------|------|
| `ApiError` | api.ts | `{ code, message }` |
| `ApiResponse<T>` | api.ts | `{ success, data, error? }` |
| `UserSummary` | auth.ts | `{ userId, username, name, roleKey, orgId, tenantId }` |
| `MenuNode` | menu.ts | 서버 메뉴 트리 노드 (재귀 children) |
| `FlatMenu` | menu.ts | 테이블 렌더링용 평탄화 노드 (+ depth) |
| `OrgNode` | org.ts | 서버 조직 트리 노드 (재귀 children) |
| `FlatOrg` | org.ts | 테이블 렌더링용 평탄화 노드 (+ depth) |
| `Tenant` | tenant.ts | 테넌트 기본 정보 |
| `TenantListRow` | tenant.ts | Tenant + userCount |
| `TenantCreateRequest` | tenant.ts | 테넌트 생성 요청 DTO |
| `TenantUpdateRequest` | tenant.ts | 테넌트 수정 요청 DTO |

## 타입 배치 규칙

| 기준 | 위치 |
|------|------|
| **2개 이상 파일**에서 참조 | `src/types/` — `export type` |
| **해당 파일에서만** 사용 | 페이지/컴포넌트 파일 상단에 로컬 정의 |
| API 응답 래퍼 | `src/types/api.ts` (→ `src/lib/api/index.ts`에서 re-export) |
| 스토어 사용자 타입 | `src/types/auth.ts` (→ `src/stores/auth.ts`에서 re-export) |

## re-export 패턴

원본은 `src/types/`에 두고, 소비하는 쪽에서 re-export하여 기존 import 경로를 유지한다.

```ts
// src/types/auth.ts (원본)
export type UserSummary = { ... };

// src/stores/auth.ts (re-export)
export type { UserSummary } from "@/types/auth";

// 사용하는 곳 — 두 경로 모두 동작
import type { UserSummary } from "@/types/auth";
import type { UserSummary } from "@/stores/auth";
```

## 새 타입 파일 추가 절차

1. `src/types/{domain}.ts` 생성
2. `export type` 으로 정의
3. 원본 소스 파일에서 `export type { X } from "@/types/..."` re-export (import 경로 호환)
4. import 시 `import type { X }` 사용 (type-only import)

## 네이밍 규칙

- 파일명: 도메인 소문자 단수 (`auth.ts`, `menu.ts`)
- 타입명: PascalCase (`UserSummary`, `MenuNode`)
- Request/Response DTO: `{Entity}{Action}Request` (`TenantCreateRequest`)
- 목록 행: `{Entity}ListRow` (`TenantListRow`)
