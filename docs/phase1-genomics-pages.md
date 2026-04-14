# Phase 1: 유전체 분석 프론트엔드 페이지

## 개요

유전체 분석 플랫폼의 프론트엔드를 구현한다.
샘플 관리, 패널 관리, 변이 조회 3개 페이지와 API 레이어, 다국어 지원을 포함한다.

## 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/genomics/samples` | SamplesPage | 샘플 목록/등록/상태변경/삭제 |
| `/genomics/panels` | PanelsPage | 패널 목록/생성/상세/삭제 |
| `/genomics/variants` | VariantsPage | 변이 필터링/상세 |

메뉴는 백엔드 V16 마이그레이션에서 자동 등록됨 (Genomics 그룹 하위).

## 페이지별 기능

### SamplesPage (`/genomics/samples`)

- **목록**: 상태별 필터, 검색, 페이지네이션
- **등록**: 모달 폼 (환자ID, 검체유형, 패널선택, 비고)
- **상태 변경**: 다음 단계 버튼 (RECEIVED → EXTRACTED → ... → REPORTED)
- **삭제**: 행별 삭제 버튼
- 상태 배지 색상 매핑 (gray → blue → indigo → yellow → green → emerald)

### PanelsPage (`/genomics/panels`)

- **목록**: 검색, 페이지네이션
- **생성**: 모달 폼 (코드, 이름, 카테고리, 유전자 목록 동적 추가)
- **상세**: 모달에서 유전자 테이블 표시
- **삭제**: 행별 삭제 버튼
- 카테고리 배지 (TARGETED=blue, WES=purple, WGS=orange)

### VariantsPage (`/genomics/variants`)

- **다중 필터**: 유전자, 변이유형, 영향도, ACMG, gnomAD AF 상한, 검색
- **샘플 필터**: `?sampleId=N` 쿼리파라미터로 특정 샘플 필터링
- 영향도 배지 (HIGH=red, MODERATE=orange, LOW=yellow, MODIFIER=gray)
- ACMG 배지 (PATHOGENIC=red ~ BENIGN=emerald)

## API 레이어

`src/lib/api/genomics.ts` → `index.ts`에서 통합 export

| 함수 | Method | 경로 |
|------|--------|------|
| `sampleList` | GET | `/api/genomics/samples` |
| `sampleDetail` | GET | `/api/genomics/samples/{id}` |
| `sampleCreate` | POST | `/api/genomics/samples` |
| `sampleUpdate` | PUT | `/api/genomics/samples/{id}` |
| `sampleUpdateStatus` | PATCH | `/api/genomics/samples/{id}/status` |
| `sampleDelete` | DELETE | `/api/genomics/samples/{id}` |
| `panelList` | GET | `/api/genomics/panels` |
| `panelActive` | GET | `/api/genomics/panels/active` |
| `panelDetail` | GET | `/api/genomics/panels/{id}` |
| `panelCreate` | POST | `/api/genomics/panels` |
| `panelUpdate` | PUT | `/api/genomics/panels/{id}` |
| `panelDelete` | DELETE | `/api/genomics/panels/{id}` |
| `variantList` | GET | `/api/genomics/variants` |
| `variantDetail` | GET | `/api/genomics/variants/{id}` |

## 다국어 (i18n)

`genomics` 번역 도메인 추가 (ko.json, en.json):

```
genomics.title
genomics.samples / genomics.panels / genomics.variants
genomics.sample.* (pageTitle, sampleNo, sampleType, status*, ...)
genomics.panel.*  (pageTitle, panelCode, geneCount, genes, ...)
genomics.variant.* (pageTitle, gene, chromosome, impact, acmgClass, ...)
```
