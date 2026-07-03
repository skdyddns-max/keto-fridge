import { describe, it, expect } from "vitest";
import { matchRecipes, type MatchOptions } from "./match";
import type { Recipe } from "./types";

const recipe = (id: string, ingredientIds: string[], over: Partial<Recipe> = {}): Recipe => ({
  id,
  name: id,
  category: "meat",
  servings: 1,
  ingredients: ingredientIds.map((i) => ({ id: i, name: `${i}명`, grams: 100 })),
  steps: [],
  tags: [],
  computed: { kcal: 100, netCarbG: 3, fatG: 10, proteinG: 10 },
  keto: true,
  hasAvoidIngredient: false,
  ...over,
});

const opts: MatchOptions = { assumePantry: true, pantryIds: new Set(["salt", "olive_oil"]) };
const own = (...ids: string[]) => new Set(ids);
const none = new Set<string>();

describe("matchRecipes", () => {
  it("전 재료 보유 → cookNow", () => {
    const [r] = matchRecipes([recipe("a", ["pork", "cabbage"])], own("pork", "cabbage"), none, opts);
    expect(r.status).toBe("cookNow");
    expect(r.coverage).toBe(1);
    expect(r.missing).toEqual([]);
  });

  it("부족 1~2개 → almost, 부족 재료 이름 제공", () => {
    const [r] = matchRecipes([recipe("a", ["pork", "cabbage", "egg"])], own("pork"), none, opts);
    expect(r.status).toBe("almost");
    expect(r.missing).toEqual(["cabbage명", "egg명"]);
  });

  it("부족 3개 이상 → explore", () => {
    const [r] = matchRecipes([recipe("a", ["p", "q", "r", "s"])], own("p"), none, opts);
    expect(r.status).toBe("explore");
  });

  it("keto:false 레시피는 제외", () => {
    const results = matchRecipes([recipe("a", ["pork"], { keto: false })], own("pork"), none, opts);
    expect(results).toHaveLength(0);
  });

  it("제외 재료 포함 레시피는 탈락", () => {
    const results = matchRecipes([recipe("a", ["pork", "butter"])], own("pork", "butter"), own("butter"), opts);
    expect(results).toHaveLength(0);
  });

  it("pantry 재료는 기본 보유로 간주 (assumePantry=true)", () => {
    const [r] = matchRecipes([recipe("a", ["pork", "salt", "olive_oil"])], own("pork"), none, opts);
    expect(r.status).toBe("cookNow");
  });

  it("assumePantry=false면 pantry도 부족으로 계산", () => {
    const [r] = matchRecipes([recipe("a", ["pork", "salt"])], own("pork"), none, { ...opts, assumePantry: false });
    expect(r.status).toBe("almost");
    expect(r.missing).toEqual(["salt명"]);
  });

  it("랭킹: cookNow → 부족 적은 순 → 순탄수 낮은 순", () => {
    const rs = matchRecipes(
      [
        recipe("carb-high", ["pork"], { computed: { kcal: 100, netCarbG: 7, fatG: 1, proteinG: 1 } }),
        recipe("missing2", ["pork", "x", "y"]),
        recipe("missing1", ["pork", "x"]),
        recipe("carb-low", ["pork"], { computed: { kcal: 100, netCarbG: 1, fatG: 1, proteinG: 1 } }),
      ],
      own("pork"),
      none,
      opts,
    );
    expect(rs.map((r) => r.recipe.id)).toEqual(["carb-low", "carb-high", "missing1", "missing2"]);
  });
});
