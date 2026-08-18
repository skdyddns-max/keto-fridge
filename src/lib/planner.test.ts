import { describe, it, expect } from "vitest";
import { addToPlan, dayTotals, isDayKeto, removeFromPlan } from "./planner";
import type { Recipe } from "./types";

const mk = (id: string, net: number, protein: number, kcal = 200, fat = 10): Recipe => ({
  id, name: id, category: "meat", servings: 1, ingredients: [], steps: [], tags: [],
  computed: { kcal, netCarbG: net, fatG: fat, proteinG: protein }, keto: true, hasAvoidIngredient: false,
});
const byId = new Map([mk("a", 3, 20), mk("b", 5, 30), mk("c", 4, 15)].map((r) => [r.id, r]));

describe("dayTotals", () => {
  it("하루 레시피들의 순탄수·단백질·칼로리 합산", () => {
    const t = dayTotals(["a", "b"], byId);
    expect(t).toEqual({ count: 2, kcal: 400, netCarbG: 8, fatG: 20, proteinG: 50 });
  });
  it("빈 날은 0", () => {
    expect(dayTotals([], byId)).toEqual({ count: 0, kcal: 0, netCarbG: 0, fatG: 0, proteinG: 0 });
  });
  it("없는 id는 무시", () => {
    expect(dayTotals(["a", "zzz"], byId).count).toBe(1);
  });
});

describe("isDayKeto", () => {
  it("하루 순탄수 20g 이하면 true", () => {
    expect(isDayKeto(dayTotals(["a", "b", "c"], byId))).toBe(true); // 12g
    expect(isDayKeto(dayTotals(["a", "a", "a", "a", "a", "a", "a"], byId))).toBe(false); // 21g
  });
});

describe("addToPlan / removeFromPlan", () => {
  it("추가", () => {
    const p = addToPlan(addToPlan({}, "mon", "a"), "mon", "b");
    expect(p.mon).toEqual(["a", "b"]);
  });
  it("인덱스로 삭제", () => {
    const p = removeFromPlan({ mon: ["a", "b", "c"] }, "mon", 1);
    expect(p.mon).toEqual(["a", "c"]);
  });
  it("원본 불변(순수)", () => {
    const orig = { mon: ["a"] };
    addToPlan(orig, "mon", "b");
    expect(orig.mon).toEqual(["a"]);
  });
});
