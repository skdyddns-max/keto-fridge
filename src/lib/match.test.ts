import { describe, it, expect } from "vitest";
import { diversify, matchRecipes, type MatchOptions } from "./match";
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

  it("보유 재료를 하나도 안 쓰는 레시피는 제외 (관련성 필터)", () => {
    const rs = matchRecipes(
      [recipe("lamb-dish", ["lamb", "salt"]), recipe("unrelated", ["pork", "cabbage"]), recipe("pantry-only", ["salt", "olive_oil"])],
      own("lamb"),
      none,
      opts,
    );
    // 양고기만 보유 → 양고기 쓰는 레시피만 노출, 무관/양념전용 레시피 제외
    expect(rs.map((r) => r.recipe.id)).toEqual(["lamb-dish"]);
  });

  it("pantry만 보유로 간주돼도 관련성엔 안 쳐서 무관 레시피가 뜨지 않는다", () => {
    // 1재료 레시피(치즈칩)는 pantry 덕에 almost가 되지만, 보유한 lamb를 안 쓰므로 제외
    const rs = matchRecipes([recipe("cheese-chip", ["cheese"])], own("lamb"), none, opts);
    expect(rs).toHaveLength(0);
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

  it("다양성 보정: 같은 category 연속 노출 방지 (같은 상태 그룹 안에서)", () => {
    const rs = matchRecipes(
      [
        recipe("m1", ["pork"], { category: "meat", computed: { kcal: 0, netCarbG: 1, fatG: 1, proteinG: 1 } }),
        recipe("m2", ["pork"], { category: "meat", computed: { kcal: 0, netCarbG: 2, fatG: 1, proteinG: 1 } }),
        recipe("m3", ["pork"], { category: "meat", computed: { kcal: 0, netCarbG: 3, fatG: 1, proteinG: 1 } }),
        recipe("e1", ["pork"], { category: "egg", computed: { kcal: 0, netCarbG: 4, fatG: 1, proteinG: 1 } }),
        recipe("s1", ["pork"], { category: "soup", computed: { kcal: 0, netCarbG: 5, fatG: 1, proteinG: 1 } }),
      ],
      own("pork"),
      none,
      opts,
    );
    // 전부 cookNow — meat 3연속 대신 인터리빙되어야 함
    expect(rs.map((r) => r.recipe.category)).toEqual(["meat", "egg", "meat", "soup", "meat"]);
  });

  it("다양성 보정이 상태 우선순위를 침범하지 않는다", () => {
    const rs = matchRecipes(
      [
        recipe("now-meat", ["pork"], { category: "meat" }),
        recipe("almost-egg", ["pork", "x"], { category: "egg" }),
        recipe("now-meat2", ["pork"], { category: "meat" }),
      ],
      own("pork"),
      none,
      opts,
    );
    // cookNow 2개가 (같은 meat라도) almost보다 항상 앞
    expect(rs.map((r) => r.status)).toEqual(["cookNow", "cookNow", "almost"]);
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

describe("diversify", () => {
  it("대안이 없으면 같은 key 연속 허용", () => {
    expect(diversify(["a", "a", "a"], (x) => x)).toEqual(["a", "a", "a"]);
  });

  it("빈 배열 안전", () => {
    expect(diversify([], (x: string) => x)).toEqual([]);
  });

  it("원래 순서를 최대한 보존하며 인터리빙", () => {
    expect(diversify(["a1", "a2", "b1", "a3"], (x) => x[0])).toEqual(["a1", "b1", "a2", "a3"]);
  });
});
