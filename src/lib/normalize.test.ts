import { describe, it, expect } from "vitest";
import { normalizeText, suggest, exactMatch } from "./normalize";
import type { Ingredient } from "./types";

const ing = (id: string, name: string, aliases: string[] = []): Ingredient => ({
  id, name, aliases, per100g: { kcal: 0, carbG: 0, fiberG: 0, fatG: 0, proteinG: 0 }, keto: "friendly", pantry: false,
});

const pool = [
  ing("pork_belly", "삼겹살", ["삼겹", "돼지삼겹살"]),
  ing("pork_neck", "돼지목살", ["목살"]),
  ing("cabbage", "양배추"),
  ing("napa_cabbage", "배추", ["알배추"]),
  ing("butter", "버터", ["무염버터"]),
];

describe("normalizeText", () => {
  it("공백 제거·소문자화", () => {
    expect(normalizeText("  삼겹 살 ")).toBe("삼겹살");
    expect(normalizeText("BuTTer")).toBe("butter");
  });
});

describe("suggest", () => {
  it("이름 전방일치가 별칭·부분일치보다 우선", () => {
    // "배추": 이름 전방일치(배추) > 별칭 전방일치 없음 > 부분일치(양배추, 알배추)
    const names = suggest("배추", pool).map((i) => i.name);
    expect(names[0]).toBe("배추");
    expect(names).toContain("양배추");
  });

  it("별칭으로도 찾는다", () => {
    expect(suggest("목살", pool)[0].id).toBe("pork_neck");
    expect(suggest("삼겹", pool)[0].id).toBe("pork_belly");
  });

  it("공백 섞인 입력도 인식", () => {
    expect(suggest("삼겹 살", pool)[0].id).toBe("pork_belly");
  });

  it("이미 추가된 재료는 제외", () => {
    const names = suggest("배추", pool, new Set(["napa_cabbage"])).map((i) => i.id);
    expect(names).not.toContain("napa_cabbage");
  });

  it("빈 입력은 빈 배열", () => {
    expect(suggest("  ", pool)).toEqual([]);
  });
});

describe("exactMatch", () => {
  it("이름/별칭 정확 일치", () => {
    expect(exactMatch("버터", pool)?.id).toBe("butter");
    expect(exactMatch("무염버터", pool)?.id).toBe("butter");
    expect(exactMatch("버", pool)).toBeUndefined();
  });
});
