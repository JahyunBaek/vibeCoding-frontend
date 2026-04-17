# Phase 6: 규제/보안 UI — 동의서, 비식별화 내보내기

## 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/genomics/consents` | ConsentsPage | 동의서 관리 (생성/서명/철회) |

## ConsentsPage

### 기능
- **목록**: 환자ID, 샘플번호, 동의유형, 상태, 서명자, 서명일, 만료일
- **상태 필터**: PENDING / SIGNED / REVOKED / EXPIRED
- **생성**: 모달 (환자ID, 샘플ID, 동의유형, 만료일, 비고)
- **서명**: PENDING 상태일 때 "서명" 버튼 → 서명자 이름 + 입회인 이름 입력
- **철회**: SIGNED 상태일 때 "철회" 버튼
- **삭제**: 모든 상태에서 가능

### 동의 유형 배지
| Type | 번역 |
|------|------|
| GENETIC_TEST | 유전자 검사 동의 |
| RESEARCH_USE | 연구 목적 사용 동의 |
| DATA_SHARING | 데이터 공유 동의 |
| BIOBANK | 바이오뱅크 동의 |

### 상태 색상
| Status | Color |
|--------|-------|
| PENDING | yellow |
| SIGNED | green |
| REVOKED | red |
| EXPIRED | gray |

## 비식별화 내보내기 (SamplesPage)

SamplesPage 각 샘플 행에 "비식별화 내보내기" (Download 아이콘) 버튼 추가.
클릭 시 `api.exportDeidentified(sampleId)` → CSV blob 다운로드.

## 메뉴 구조 (최종)

```
Genomics
├── Dashboard  → /genomics/dashboard
├── Samples    → /genomics/samples
├── Panels     → /genomics/panels
├── Variants   → /genomics/variants
├── Reports    → /genomics/reports
├── PGx        → /genomics/pgx
├── Browser    → /genomics/browser
└── Consents   → /genomics/consents   ← Phase 6
```
