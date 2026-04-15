# Phase 4: 보고서/PGx 프론트엔드

## 개요

보고서 조회/생성, 약물유전체(PGx) 데이터베이스 조회 및 샘플 기반 매칭 UI를 제공한다.

## 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/genomics/reports` | ReportsPage | 보고서 목록/상세/확정 |
| `/genomics/pgx` | PgxPage | PGx DB 목록 + 샘플 기반 매칭 |

## ReportsPage

### 목록 화면
- 보고서 제목, 샘플번호, 변이 수, 병원성 변이 수, 상태(DRAFT/FINAL), 생성일
- 행 클릭 → 상세 모달

### 상세 모달
- 통계 카드 3개: 총 변이 수 / 병원성 변이 수 / 기타
- AI 분석 요약 전문 표시 (whitespace-pre-wrap)
- DRAFT 상태일 때 "최종 확정" 버튼

### 보고서 생성
- SamplesPage에서 "보고서 생성" 버튼 → `api.reportGenerate(sampleId)`
- 백엔드에서 AI 요약 생성 후 저장
- 성공 시 toast: "보고서가 생성되었습니다."

## PgxPage

### PGx 데이터베이스 목록
- gene, variant, drug, effect, evidence level, source, recommendation
- 검색: 유전자명 또는 약물명
- 페이지네이션

### Effect 배지 색상
| Effect | 색상 |
|--------|------|
| POOR_METABOLIZER | red |
| INTERMEDIATE | orange |
| NORMAL | green |
| RAPID | blue |

### Evidence Level 배지 색상
| Level | 색상 |
|-------|------|
| 1A | red (강력 근거) |
| 1B | orange |
| 2A | yellow |
| 2B | blue |

### 샘플 기반 PGx 매칭
- 우측 상단 "Sample ID" 입력란
- ID 입력 시 자동으로 매칭 결과 패널 표시 (파란 배경)
- 각 매칭 결과: AlertTriangle 아이콘 + gene + variant + drug + effect 배지 + recommendation
- 매칭 없으면: "해당 샘플에서 PGx 관련 변이가 검출되지 않았습니다."

## API 함수 추가

```typescript
// AI
aiInterpretVariant(variantId)     → POST /api/genomics/ai/interpret/{id}
aiSummarizeSample(sampleId)       → POST /api/genomics/ai/summarize/{id}

// Reports
reportList(page, size, sampleId?) → GET /api/genomics/reports
reportDetail(reportId)            → GET /api/genomics/reports/{id}
reportGenerate(sampleId)          → POST /api/genomics/reports/generate/{id}
reportUpdateStatus(reportId, st)  → PATCH /api/genomics/reports/{id}/status
reportDelete(reportId)            → DELETE /api/genomics/reports/{id}

// PGx
pgxList(page, size, search?)      → GET /api/genomics/pgx
pgxMatchBySample(sampleId)        → GET /api/genomics/pgx/match/{id}
```

## 번역 키 추가

- `genomics.report.*` — 보고서 관련 (pageTitle, generate, summary, draft, final 등)
- `genomics.pgx.*` — PGx 관련 (pageTitle, gene, drug, effect, matchTitle 등)
- `genomics.ai.*` — AI 관련 (summarize, summarizing)
