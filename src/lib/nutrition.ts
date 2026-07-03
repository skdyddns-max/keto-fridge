import type { Computed, Ingredient, Recipe } from "./types";

const round1 = (n: number) => Math.round(n * 10) / 10;

/** 레시피 1인분 영양 계산 — build-data.ts와 동일한 공식 (교차검증용으로도 사용) */
export function computeRecipe(recipe: Pick<Recipe, "ingredients" | "servings">, byId: Map<string, Ingredient>): Computed {
  let kcal = 0;
  let netCarb = 0;
  let fat = 0;
  let protein = 0;
  for (const ri of recipe.ingredients) {
    const ing = byId.get(ri.id);
    if (!ing) throw new Error(`unknown ingredient: ${ri.id}`);
    const f = ri.grams / 100;
    kcal += ing.per100g.kcal * f;
    netCarb += Math.max(0, ing.per100g.carbG - ing.per100g.fiberG) * f;
    fat += ing.per100g.fatG * f;
    protein += ing.per100g.proteinG * f;
  }
  const s = recipe.servings || 1;
  return {
    kcal: round1(kcal / s),
    netCarbG: round1(netCarb / s),
    fatG: round1(fat / s),
    proteinG: round1(protein / s),
  };
}

export interface MacroPercents {
  fat: number;
  protein: number;
  carb: number;
}

/** 칼로리 기준 매크로 비율(%) — 지방 9kcal/g, 단백질·탄수 4kcal/g */
export function macroPercents(c: Computed): MacroPercents {
  const fatK = c.fatG * 9;
  const proteinK = c.proteinG * 4;
  const carbK = c.netCarbG * 4;
  const total = fatK + proteinK + carbK;
  if (total === 0) return { fat: 0, protein: 0, carb: 0 };
  const fat = Math.round((fatK / total) * 100);
  const protein = Math.round((proteinK / total) * 100);
  return { fat, protein, carb: Math.max(0, 100 - fat - protein) };
}
