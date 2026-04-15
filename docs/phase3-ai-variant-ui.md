# Phase 3: AI 변이 해석 UI

## 개요

변이 상세 모달에서 Gemini AI를 활용한 임상적 해석 기능을 제공한다.

## 변이 상세 모달 AI 해석 버튼

### 동작 흐름

1. VariantsPage에서 행 클릭 → 상세 모달 표시
2. "AI 해석" 버튼 (Sparkles 아이콘) 클릭
3. `api.aiInterpretVariant(variantId)` 호출
4. 로딩 중: Loader2 스피너 + "AI 분석 중..." 텍스트
5. 결과: 모달 하단에 마크다운 형식으로 표시 (bg-muted/50 영역)
6. 모달 닫기 시 AI 결과 초기화

### UI 위치

```
변이 상세 모달
├── 기본 정보 (gene, position, ref/alt, type, ...)
├── HGVS, consequence, impact, acmg, zygosity
├── quality, read depth, VAF, gnomAD AF
├── 외부 데이터베이스 링크 (ClinVar, COSMIC, gnomAD, HGNC, NCBI)
└── AI 변이 해석 ← NEW
    ├── [AI 해석] 버튼
    └── 해석 결과 (마크다운, 스크롤 가능 max-h-60)
```

## 번역 키

```
genomics.variant.aiInterpret       — "AI 해석"
genomics.variant.aiInterpreting    — "AI 분석 중..."
genomics.variant.aiInterpretation  — "AI 변이 해석"
```
