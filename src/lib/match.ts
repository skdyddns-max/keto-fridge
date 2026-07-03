import type { Recipe } from "./types";

export type MatchStatus = "cookNow" | "almost" | "explore";

export interface MatchResult {
  recipe: Recipe;
  status: MatchStatus;
  /** 부족한 재료 이름들 (almost 안내용) */
  missing: string[];
  /** 보유 재료 커버리지 0~1 */
  coverage: number;
}

export interface MatchOptions {
  /** pantry 재료(조미료류)를 기본 보유로 간주 */
  assumePantry: boolean;
  /** pantry 재료 id 집합 */
  pantryIds: Set<string>;
}

/**
 * 매칭 엔진 (spec §4)
 * - keto:false 레시피 탈락
 * - excluded 재료 포함 레시피 탈락
 * - coverage = |owned ∩ required| / |required|
 * - cookNow(부족 0) / almost(부족 1~2) / explore(그 외)
 * - 랭킹: cookNow 우선 → 부족 개수 → 순탄수 낮은 순
 */
export function matchRecipes(
  recipes: Recipe[],
  owned: Set<string>,
  excluded: Set<string>,
  opts: MatchOptions,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const recipe of recipes) {
    if (!recipe.keto) continue;
    if (recipe.ingredients.some((ri) => excluded.has(ri.id))) continue;
    // 관련성: 사용자가 실제로 가진 재료를 하나도 안 쓰는 레시피는 제외
    // (pantry 자동보유는 관련성으로 치지 않는다 — 양념만 겹치는 무관한 레시피 방지)
    if (!recipe.ingredients.some((ri) => owned.has(ri.id))) continue;

    const required = recipe.ingredients.map((ri) => ri.id);
    const has = (id: string) => owned.has(id) || (opts.assumePantry && opts.pantryIds.has(id));
    const missingIngs = recipe.ingredients.filter((ri) => !has(ri.id));
    const coverage = required.length === 0 ? 0 : (required.length - missingIngs.length) / required.length;

    const status: MatchStatus = missingIngs.length === 0 ? "cookNow" : missingIngs.length <= 2 ? "almost" : "explore";
    results.push({ recipe, status, missing: missingIngs.map((ri) => ri.name), coverage });
  }

  const rank: Record<MatchStatus, number> = { cookNow: 0, almost: 1, explore: 2 };
  results.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      a.missing.length - b.missing.length ||
      a.recipe.computed.netCarbG - b.recipe.computed.netCarbG,
  );

  // 다양성 보정 (spec §4): 동일 (상태, 부족개수) 그룹 안에서 같은 category 연속 노출 방지
  const out: MatchResult[] = [];
  const groupKey = (r: MatchResult) => `${r.status}:${r.missing.length}`;
  let i = 0;
  while (i < results.length) {
    let j = i;
    while (j < results.length && groupKey(results[j]) === groupKey(results[i])) j++;
    out.push(...diversify(results.slice(i, j), (r) => r.recipe.category));
    i = j;
  }
  return out;
}

/**
 * 그리디 인터리빙: 직전과 같은 key(category)가 아닌 첫 후보를 차례로 선택.
 * 대안이 없을 때만 같은 key 연속 허용. 원래 순서를 최대한 보존한다.
 */
export function diversify<T>(items: T[], keyOf: (t: T) => string): T[] {
  const pool = [...items];
  const out: T[] = [];
  let prev = "";
  while (pool.length > 0) {
    let idx = pool.findIndex((t) => keyOf(t) !== prev);
    if (idx === -1) idx = 0;
    const [picked] = pool.splice(idx, 1);
    out.push(picked);
    prev = keyOf(picked);
  }
  return out;
}
