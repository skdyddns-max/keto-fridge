import { describe, it, expect } from "vitest";
import { coupangSearchUrl, searchRecipes } from "./search";
import type { Recipe } from "./types";

const r = (id: string, name: string, tags: string[] = [], ingNames: string[] = [], keto = true): Recipe => ({
  id, name, category: "egg", servings: 1,
  ingredients: ingNames.map((n) => ({ id: n, name: n, grams: 50 })),
  steps: [], tags, computed: { kcal: 0, netCarbG: 2, fatG: 0, proteinG: 0 }, keto, hasAvoidIngredient: false,
});

const pool = [
  r("a", "기본 계란말이", ["초간단"], ["계란"]),
  r("b", "치즈 계란말이", [], ["계란", "체다치즈"]),
  r("c", "삼겹살 소금구이", ["10분"], ["삼겹살"]),
  r("d", "코티지치즈 베리볼", ["트렌드"], ["코티지치즈"]),
  r("e", "keto:false 계란", [], ["계란"], false),
];

describe("searchRecipes", () => {
  it("이름 전방일치 우선", () => {
    const names = searchRecipes("기본", pool).map((x) => x.name);
    expect(names[0]).toBe("기본 계란말이");
  });
  it("이름 부분일치도 찾음", () => {
    const names = searchRecipes("계란말이", pool).map((x) => x.name);
    expect(names).toEqual(["기본 계란말이", "치즈 계란말이"]);
  });
  it("태그로도 찾음", () => {
    expect(searchRecipes("트렌드", pool).map((x) => x.id)).toContain("d");
  });
  it("재료명으로도 찾음", () => {
    expect(searchRecipes("삼겹살", pool).map((x) => x.id)).toContain("c");
  });
  it("keto:false는 제외", () => {
    expect(searchRecipes("계란", pool).some((x) => x.id === "e")).toBe(false);
  });
  it("공백 입력은 빈 배열", () => {
    expect(searchRecipes("  ", pool)).toEqual([]);
  });
});

describe("coupangSearchUrl", () => {
  it("검색 URL 생성(한글 인코딩)", () => {
    expect(coupangSearchUrl("삼겹살")).toBe("https://www.coupang.com/np/search?q=%EC%82%BC%EA%B2%B9%EC%82%B4");
  });
});
