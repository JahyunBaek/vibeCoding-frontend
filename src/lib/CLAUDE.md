# src/lib — 유틸리티 & API 클라이언트

## 파일 구조

```
src/lib/
├── client.ts          # axios 인스턴스, interceptors, refresh, apiRequest (인프라 — 수정 거의 없음)
├── utils.ts           # cn() 등 범용 헬퍼
├── i18n.ts            # i18next 초기화
└── api/               # 도메인별 API 메서드
    ├── index.ts       # 통합 re-export (api 객체 조립)
    ├── auth.ts        # 인증: login, logout, me, signup
    ├── board.ts       # 게시판: boards, posts, comments, files
    ├── admin.ts       # 관리자: users, orgs, roles, menus, codes, permissions, settings, audit
    ├── tenant.ts      # 테넌트: branding, super-admin CRUD
    ├── notification.ts# 알림
    ├── sample.ts      # 샘플: patients, trials, commonCodes, dashboard
    └── agent.ts       # AI Agent: providers, datasets, chat
```

## 새 API 도메인 추가 절차

### 1. 도메인 파일 생성

`src/lib/api/{domain}.ts` 파일을 만들고, `client.ts`에서 `apiRequest`를 import하여 사용한다.

```ts
// src/lib/api/example.ts
import { apiRequest } from "@/lib/client";

export const exampleApi = {
  list: (page = 1) =>
    apiRequest<any>("GET", `/api/examples?page=${page}`),

  create: (payload: { name: string }) =>
    apiRequest<number>("POST", "/api/examples", payload),
};
```

**규칙:**
- 파일명은 백엔드 도메인(패키지)과 1:1 대응 (e.g. `agent` 패키지 → `agent.ts`)
- export 이름은 `{domain}Api` (e.g. `agentApi`, `boardApi`)
- `apiRequest<T>(method, url, body?, opts?)` 만 사용 — `client`를 직접 쓰는 경우는 blob 다운로드, 업로드 progress 등 특수 케이스만
- `client` 인스턴스가 필요하면 `import { apiRequest, client } from "@/lib/client"` 로 가져온다

### 2. index.ts에 등록

`src/lib/api/index.ts`에 import + spread 추가:

```ts
import { exampleApi } from "./example";

export const api = {
  ...authApi,
  ...boardApi,
  // ...기존...
  ...exampleApi,  // ← 추가
};
```

### 3. 완료

기존 `import { api } from "@/lib/api"` 로 모든 곳에서 바로 사용 가능. 별도 import 경로 변경 불필요.

## client.ts 수정이 필요한 경우

`client.ts`는 인프라 레이어로, 아래 경우에만 수정한다:
- axios interceptor 추가/변경 (e.g. 새로운 헤더, 에러 핸들링)
- `apiRequest` 공통 옵션 추가
- refresh 로직 변경

**도메인 API 메서드는 절대 `client.ts`에 추가하지 않는다.**

## 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 | 소문자 단수 도메인명 | `agent.ts`, `board.ts` |
| export 객체 | `{domain}Api` | `agentApi`, `boardApi` |
| 메서드명 | 리소스 + 동사 조합 | `agentChat`, `postCreate`, `userDelete` |
| 목록 조회 | `{resource}List` 또는 `{resource}s` | `postsList`, `rolesAll` |
| 단건 조회 | `{resource}Detail` | `postDetail` |
| blob 다운로드 | `{resource}Download` / `{resource}Export` | `fileDownload`, `auditExport` |
