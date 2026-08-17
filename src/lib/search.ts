import type { Recipe } from "./types";
import { normalizeText } from "./normalize";

/**
 * 레시피 이름·태그·재료로 검색.
 * 우선순위: 이름 전방일치(0) > 이름 부분일치(1) > 태그/재료 일치(2)
 */
export function searchRecipes(query: string, recipes: Recipe[], limit = 40): Recipe[] {
  const q = normalizeText(query);
  if (!q) return [];
  const scored: { r: Recipe; score: number }[] = [];
  for (const r of recipes) {
    if (!r.keto) continue;
    const name = normalizeText(r.name);
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.includes(q)) score = 1;
    else if (r.tags.some((t) => normalizeText(t).includes(q)) || r.ingredients.some((i) => normalizeText(i.name).includes(q))) score = 2;
    if (score >= 0) scored.push({ r, score });
  }
  scored.sort((a, b) => a.score - b.score || a.r.computed.netCarbG - b.r.computed.netCarbG);
  return scored.slice(0, limit).map((s) => s.r);
}

/** 쿠팡 검색 링크 (부족 재료 바로 구매) */
export function coupangSearchUrl(keyword: string): string {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
}
