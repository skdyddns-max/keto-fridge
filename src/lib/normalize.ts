import type { Ingredient } from "./types";

/** 입력 정규화: 공백 제거 + 소문자화 */
export function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 자동완성 후보 검색.
 * 우선순위: 이름 전방일치(0) > 별칭 전방일치(1) > 이름/별칭 부분일치(2)
 */
export function suggest(query: string, ingredients: Ingredient[], excludeIds: Set<string> = new Set(), limit = 8): Ingredient[] {
  const q = normalizeText(query);
  if (!q) return [];
  const scored: { ing: Ingredient; score: number }[] = [];
  for (const ing of ingredients) {
    if (excludeIds.has(ing.id)) continue;
    const name = normalizeText(ing.name);
    const aliases = ing.aliases.map(normalizeText);
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (aliases.some((a) => a.startsWith(q))) score = 1;
    else if (name.includes(q) || aliases.some((a) => a.includes(q))) score = 2;
    if (score >= 0) scored.push({ ing, score });
  }
  scored.sort((a, b) => a.score - b.score || a.ing.name.length - b.ing.name.length || a.ing.name.localeCompare(b.ing.name, "ko"));
  return scored.slice(0, limit).map((x) => x.ing);
}

/** 정확 일치(이름/별칭 → id). 자동완성 없이 엔터로 추가할 때 사용 */
export function exactMatch(query: string, ingredients: Ingredient[]): Ingredient | undefined {
  const q = normalizeText(query);
  if (!q) return undefined;
  return ingredients.find((i) => normalizeText(i.name) === q || i.aliases.some((a) => normalizeText(a) === q));
}
