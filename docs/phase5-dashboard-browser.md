# Phase 5: 시각화 — Dashboard + 게놈 브라우저

## 개요

recharts 기반 변이 분포 대시보드와 IGV.js 게놈 브라우저를 구현한다.

## 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/genomics/dashboard` | GenomicsDashboardPage | 변이 분포 차트 대시보드 |
| `/genomics/browser` | BrowserPage | IGV.js 게놈 브라우저 |

## GenomicsDashboardPage

### 구성

1. **요약 카드 (4개)**
   - 총 변이 수 / 총 샘플 수 / Pathogenic 수 / HIGH Impact 수

2. **염색체별 변이 분포** (BarChart)
   - X축: 염색체, Y축: 변이 수

3. **Pie 차트 3개** (3 column grid)
   - 변이 유형별 (SNV, INDEL, CNV, SV)
   - 영향도별 (HIGH=red, MODERATE=orange, LOW=yellow, MODIFIER=gray)
   - ACMG 분류별 (PATHOGENIC=red ~ BENIGN=green)

4. **Top 15 유전자** (Horizontal BarChart)
   - Y축: 유전자명, X축: 변이 수

### 샘플 필터
- 우측 상단 Sample ID 입력 → 특정 샘플의 통계만 조회
- 빈칸이면 전체 통계

## BrowserPage (IGV.js)

### 기능
- **참조 게놈**: hg38 (기본)
- **Sample ID 입력** → 해당 샘플의 변이를 BED 형식 annotation track으로 로드
- **Locus 입력** → Enter 키로 위치 이동
- 변이 색상: ACMG 분류에 따라 (Pathogenic=red, VUS=yellow, Benign=green)

### IGV.js 연동 방식
```
1. igv.createBrowser(div, { genome: "hg38" })
2. api.variantList(sampleId, 5000)로 변이 데이터 fetch
3. variants → BED features로 변환 (chr, start, end, name, color)
4. browser.loadTrack({ type: "annotation", features })
5. 첫 번째 변이 위치로 자동 이동
```

### 의존성
- `igv` npm 패키지 (IGV.js)

## 번역 키

```
genomics.dashboard.* — 대시보드 (pageTitle, totalVariants, byChromosome, ...)
genomics.browser.*   — 브라우저 (pageTitle, genome, locus, loadVariants, noSample)
```
