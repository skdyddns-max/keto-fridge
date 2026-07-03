import { describe, it, expect } from "vitest";
import { computeRecipe, macroPercents } from "./nutrition";
import type { Ingredient, Recipe } from "./types";
import ingredientsRaw from "../data/ingredients.gen.json";
import recipesRaw from "../data/recipes.gen.json";

const ing = (id: string, carbG: number, fiberG: number, fatG = 0, proteinG = 0, kcal = 0): Ingredient => ({
  id, name: id, aliases: [], per100g: { kcal, carbG, fiberG, fatG, proteinG }, keto: "friendly", pantry: false,
});

describe("computeRecipe", () => {
  const byId = new Map([
    ing("meat", 0, 0, 28, 17, 331),
    ing("veg", 6, 2.5, 0, 1, 25),
    ing("weird_fiber", 3, 5), // 식이섬유 > 탄수 (곤약류)
  ].map((i) => [i.id, i]));

  it("순탄수 = (탄수-식이섬유) × 그램/100", () => {
    const c = computeRecipe({ servings: 1, ingredients: [{ id: "veg", name: "", grams: 200 }] }, byId);
    expect(c.netCarbG).toBe(7); // (6-2.5)*2 = 7
  });

  it("식이섬유가 탄수보다 커도 순탄수는 음수가 되지 않는다", () => {
    const c = computeRecipe({ servings: 1, ingredients: [{ id: "weird_fiber", name: "", grams: 100 }] }, byId);
    expect(c.netCarbG).toBe(0);
  });

  it("servings로 나눠 1인분 기준으로 계산한다", () => {
    const one = computeRecipe({ servings: 1, ingredients: [{ id: "meat", name: "", grams: 150 }] }, byId);
    const two = computeRecipe({ servings: 2, ingredients: [{ id: "meat", name: "", grams: 300 }] }, byId);
    expect(two).toEqual(one);
  });

  it("미등록 재료는 에러", () => {
    expect(() => computeRecipe({ servings: 1, ingredients: [{ id: "nope", name: "", grams: 10 }] }, byId)).toThrow();
  });

  it("[교차검증] gen 레시피 전체의 computed와 재계산이 일치한다", () => {
    const ingredients = ingredientsRaw as unknown as Ingredient[];
    const recipes = recipesRaw as unknown as Recipe[];
    const map = new Map(ingredients.map((i) => [i.id, i]));
    for (const r of recipes) {
      expect(computeRecipe(r, map), r.id).toEqual(r.computed);
    }
  });
});

describe("macroPercents", () => {
  it("칼로리 기준 비율, 합계 100", () => {
    const p = macroPercents({ kcal: 0, fatG: 70, proteinG: 25, netCarbG: 5 });
    expect(p.fat + p.protein + p.carb).toBe(100);
    expect(p.fat).toBeGreaterThan(80); // 70g*9 vs 25g*4+5g*4
  });

  it("전부 0이면 0/0/0", () => {
    expect(macroPercents({ kcal: 0, fatG: 0, proteinG: 0, netCarbG: 0 })).toEqual({ fat: 0, protein: 0, carb: 0 });
  });
});
