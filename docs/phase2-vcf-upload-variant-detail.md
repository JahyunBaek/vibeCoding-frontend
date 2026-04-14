# Phase 2: VCF 업로드 UI, 변이 상세 모달, 필터 고도화

## 개요

VCF 파일 업로드 기능, 변이 상세 화면(외부 DB 링크 포함), 필터링 UI 개선을 구현한다.

## VCF 업로드 (SamplesPage)

### 동작 흐름

1. 샘플 목록에서 "VCF 업로드" 버튼 클릭
2. 숨겨진 `<input type="file" accept=".vcf,.vcf.gz">` 트리거
3. 파일 선택 → `api.sampleUploadVcf(sampleId, file)` 호출
4. multipart/form-data로 백엔드 전송 (progress 콜백 지원)
5. 성공 시 toast: "VCF 업로드 완료: N개 변이 적재"
6. 샘플 목록 자동 갱신 (queryClient.invalidateQueries)

### API 함수

```typescript
sampleUploadVcf: async (sampleId, file, onProgress?) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await client.post(
    `/api/genomics/samples/${sampleId}/vcf`, fd,
    { onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)) }
  );
  return res.data.data;
}
```

### "변이 보기" 링크

샘플 목록에서 "변이 보기" 클릭 → `/genomics/variants?sampleId=N` 으로 이동.
VariantsPage가 `useSearchParams`로 sampleId를 읽어 자동 필터링.

## 변이 상세 모달 (VariantsPage)

### 트리거
변이 행 클릭 → `setDetailId(variantId)` → `useQuery`로 상세 데이터 fetch.

### 표시 정보

| 섹션 | 항목 |
|------|------|
| 기본 정보 | gene, chromosome:position, ref→alt, variantType |
| HGVS | hgvsC (c.표기), hgvsP (p.표기) |
| 분류 | consequence, impact(배지), acmgClass(배지), zygosity |
| 품질 | quality, read depth, allele frequency |
| 빈도 | gnomAD AF |

### 외부 데이터베이스 링크

| DB | URL 패턴 | 조건 |
|----|---------|------|
| ClinVar | `ncbi.nlm.nih.gov/clinvar/variation/{clinvarId}/` | clinvarId 있을 때 |
| COSMIC | `cancer.sanger.ac.uk/cosmic/mutation/overview?id={cosmicId}` | cosmicId 있을 때 |
| gnomAD | `gnomad.broadinstitute.org/region/{chr}-{pos}` | 항상 |
| HGNC | `genenames.org/tools/search/#!/genes?query={gene}` | 항상 |
| NCBI Gene | `ncbi.nlm.nih.gov/gene/?term={gene}` | 항상 |

모든 링크는 `target="_blank" rel="noopener noreferrer"`.

## 필터링 UI 고도화

### 필터 초기화

- "Reset Filters" 버튼 (RotateCcw 아이콘)
- 활성 필터가 하나라도 있을 때만 표시
- 클릭 시 모든 필터 + URL 파라미터 초기화

### 빈 결과 메시지 분기

| 상태 | 메시지 |
|------|--------|
| 필터 활성 + 결과 0건 | "필터 조건에 맞는 변이가 없습니다." |
| 필터 없음 + 결과 0건 | "데이터가 없습니다." |

### 행 클릭 커서

변이 테이블 행에 `cursor-pointer` 추가 — 클릭 가능함을 시각적으로 표현.

## 번역 키 추가

```
genomics.sample.uploadVcf      — "VCF 업로드"
genomics.sample.vcfUploaded    — "VCF 업로드 완료: {{count}}개 변이 적재"
genomics.sample.vcfUploading   — "VCF 파일 업로드 중..."
genomics.sample.vcfHint        — ".vcf 파일을 선택하세요"
genomics.sample.viewVariants   — "변이 보기"
genomics.variant.detail        — "변이 상세"
genomics.variant.externalLinks — "외부 데이터베이스"
genomics.variant.noResults     — "필터 조건에 맞는 변이가 없습니다."
genomics.variant.resetFilters  — "필터 초기화"
```
