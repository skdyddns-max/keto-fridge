import { describe, it, expect } from "vitest";
import { difficulty, estimateMinutes } from "./recipeMeta";
import type { Recipe } from "./types";

const PANTRY = new Set(["salt", "soy_sauce", "sesame_oil", "garlic", "butter", "olive_oil"]);
const isPantry = (id: string) => PANTRY.has(id);

const make = (over: Partial<Recipe>): Recipe => ({
  id: "r", name: "n", category: "egg", servings: 1,
  ingredients: [{ id: "egg", name: "계란", grams: 100 }],
  steps: ["푼다", "굽는다"], tags: [], computed: { kcal: 0, netCarbG: 0, fatG: 0, proteinG: 0 },
  keto: true, hasAvoidIngredient: false, ...over,
});

describe("estimateMinutes", () => {
  it("태그의 'N분' 우선", () => {
    expect(estimateMinutes(make({ tags: ["초간단", "10분"] }), isPantry)).toBe(10);
  });
  it("단계의 'N분' 합 + 손질 (5분 반올림)", () => {
    const r = make({ ingredients: [{ id: "egg", name: "계란", grams: 100 }], steps: ["3분 데친다", "5분 볶는다"] });
    // 8분 + 손질(주재료1×2=2) = 10 → 10
    expect(estimateMinutes(r, isPantry)).toBe(10);
  });
  it("시간 표기 없으면 복잡도 추정, 최소 5분", () => {
    expect(estimateMinutes(make({ steps: ["섞는다"] }), isPantry)).toBeGreaterThanOrEqual(5);
  });
});

describe("difficulty", () => {
  it("초간단 태그면 쉬움", () => {
    expect(difficulty(make({ tags: ["초간단"], steps: ["1", "2", "3", "4", "5", "6"] }), isPantry)).toBe("쉬움");
  });
  it("단계+주재료 적으면 쉬움", () => {
    expect(difficulty(make({ steps: ["a", "b"] }), isPantry)).toBe("쉬움");
  });
  it("많으면 보통/손이 가요", () => {
    const many = make({
      steps: ["a", "b", "c", "d", "e"],
      ingredients: [
        { id: "egg", name: "계란", grams: 50 },
        { id: "pork_belly", name: "삼겹살", grams: 100 },
        { id: "cabbage", name: "양배추", grams: 50 },
        { id: "tofu", name: "두부", grams: 50 },
      ],
    });
    expect(difficulty(many, isPantry)).toBe("손이 가요");
  });
});
