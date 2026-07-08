import type { Recipe } from "./types";

/** 재료 중 조미료(pantry) 제외한 '주재료' 개수를 세기 위한 판별자 주입 */
export type IsPantry = (id: string) => boolean;

function minutesFrom(text: string): number[] {
  return [...text.matchAll(/(\d+)\s*분/g)].map((m) => parseInt(m[1], 10)).filter((n) => n > 0 && n <= 180);
}

/**
 * 조리 예상 시간(분). 태그의 'N분' > 단계의 'N분' 합 + 손질 > 복잡도 추정 순.
 * 정확치 않으므로 5분 단위로 반올림해 '약 N분'으로 표시한다.
 */
export function estimateMinutes(recipe: Recipe, isPantry: IsPantry): number {
  const tagMin = recipe.tags.flatMap(minutesFrom);
  if (tagMin.length) return roundTo5(Math.max(...tagMin));

  const stepMin = recipe.steps.flatMap(minutesFrom).reduce((a, b) => a + b, 0);
  const mains = recipe.ingredients.filter((ri) => !isPantry(ri.id)).length;
  if (stepMin > 0) return roundTo5(stepMin + Math.min(6, mains * 2)); // 조리시간 + 손질

  // 시간 표기가 없으면 복잡도로 추정
  const est = 4 + recipe.steps.length * 2 + mains * 1.5;
  return roundTo5(est);
}

function roundTo5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

export type Difficulty = "쉬움" | "보통" | "손이 가요";

/** 난이도 — 단계 수 + 주재료 수 기반 (초간단 태그면 무조건 쉬움) */
export function difficulty(recipe: Recipe, isPantry: IsPantry): Difficulty {
  if (recipe.tags.includes("초간단")) return "쉬움";
  const mains = recipe.ingredients.filter((ri) => !isPantry(ri.id)).length;
  const score = recipe.steps.length + mains;
  if (score <= 5) return "쉬움";
  if (score <= 8) return "보통";
  return "손이 가요";
}
