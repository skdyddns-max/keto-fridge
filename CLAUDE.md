# CLAUDE.md — 키토 냉장고 개발 지침

이 파일은 Claude Code가 매 세션 참고하는 영구 규칙이다. `spec.md`와 함께 읽는다.

## 절대 규칙
- 런타임에 외부 API를 호출하지 않는다. 모든 로직은 클라이언트 로컬에서 동작한다. (무료 배포 · API 0원 유지)
- 영양값(순탄수·매크로)은 레시피에 직접 적지 않는다. `ingredients.json` + 그램수로 빌드 시 계산한다.
- MVP에서 Supabase·백엔드를 연결하지 않는다. 즐겨찾기·설정은 localStorage.
- 파일·폴더·변수명은 영어. UI 표시 텍스트는 한국어.
- 사용자 확인 없이 배포(deploy)·git push를 실행하지 않는다.

## 작업 방식
- 큰 작업은 코드 작성 전에 계획을 먼저 제안하고 합의를 받는다.
- Phase 단위로 구현하고, 각 Phase 종료 시 커밋 + 무엇이 됐는지 요약한다.
- 데이터 파일 수정 후에는 반드시 `build-data.ts` 검증을 돌려 에러가 없는지 확인한다.
- 새 레시피/재료를 추가할 때 `ingredients.json`에 없는 재료가 생기면 즉시 알린다.

## 프로젝트 구조 (제안)
```
src/
  lib/match.ts        # 매칭 엔진
  lib/nutrition.ts    # 순탄수·매크로 계산
  components/         # UI
data/
  ingredients.json    # 재료 영양표
  recipes.json        # 레시피 800개
scripts/
  build-data.ts       # computed 계산 + 검증
```

## 디자인
- frontend-design 스킬을 사용한다.
- 클린·미니멀, 가독성 최우선, Pretendard 우선. 순탄수는 크고 굵게.

## 도메인 상수
- 키토 기준: 하루 순탄수 20g 이하 → 레시피 1인분 순탄수 8g 이하를 적합으로 채택.
- 순탄수 = 총탄수 − 식이섬유.
- 매크로 목표: 지방 70% / 단백질 25% / 탄수 5%.
