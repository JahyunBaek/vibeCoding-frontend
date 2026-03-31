# src/locales — 다국어 번역 파일

## 파일 구조

```
locales/
├── ko.json     # 한국어 (기본 언어, fallbackLng)
└── en.json     # 영어
```

## i18n 설정

- 라이브러리: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- 초기화: `src/lib/i18n.ts`
- fallback: `ko`
- 언어 감지 순서: `localStorage("language")` → `navigator`
- 테넌트 locale 자동 적용: `useTenantTheme` 훅이 `localStorage.language` 미설정 시 테넌트 locale로 변경

## 번역 키 네이밍 규칙

```json
{
  "도메인": {
    "키": "값"
  }
}
```

| 도메인 | 용도 | 예시 |
|--------|------|------|
| `common` | 앱 전체 공통 (저장, 취소, 삭제...) | `common.save` |
| `auth` | 인증 관련 | `auth.login`, `auth.passwordMismatch` |
| `nav` | 사이드바/네비게이션 메뉴 | `nav.dashboard`, `nav.users` |
| `breadcrumb` | Breadcrumb 라벨 | `breadcrumb.home` |
| `board` | 게시판 | `board.title`, `board.postSaved` |
| `comment` | 댓글 | `comment.placeholder` |
| `admin` | 관리자 페이지 | `admin.userList`, `admin.boardCreated` |
| `tenant` | 테넌트 관리 | `tenant.list`, `tenant.created` |
| `myInfo` | 내 정보 | `myInfo.profile` |
| `notification` | 알림 | `notification.empty` |
| `sample` | 샘플 데이터 (Medical) | `sample.patients`, `sample.diagnosis` |
| `agent` | AI Agent 분석 | `agent.pageTitle`, `agent.send` |
| `editor` | 리치 에디터 | `editor.bold`, `editor.insertImage` |
| `error` | 에러 화면 | `error.forbidden` |

## 새 번역 추가 절차

1. `ko.json`에 해당 도메인 아래 키-값 추가
2. `en.json`에 동일 키로 영문 번역 추가
3. **두 파일의 키 구조는 항상 동일해야 한다** (한쪽에만 있으면 fallback 시 문제)

## 사용 패턴

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

// 단순 텍스트
t("common.save")

// 보간 (interpolation)
t("board.totalCount", { count: 42 })    // "전체 42개"
t("sample.enrolled", { enrolled: 10, target: 50 })  // "10/50명"
```

## 새 도메인 추가 시

새 페이지 그룹을 만들면 번역 도메인도 추가한다:
1. `ko.json` / `en.json`에 새 도메인 키 추가 (알파벳순 권장)
2. 이 파일의 도메인 표에도 추가
