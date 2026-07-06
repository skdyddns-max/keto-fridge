import { describe, it, expect } from "vitest";
import { householdLabel } from "./measures";

describe("householdLabel", () => {
  it("액체 조미료 → 큰술/작은술", () => {
    expect(householdLabel("soy_sauce", 15)).toBe("1큰술");
    expect(householdLabel("soy_sauce", 30)).toBe("2큰술");
    expect(householdLabel("soy_sauce", 5)).toBe("1작은술"); // 소량은 작은술
    expect(householdLabel("soy_sauce", 10)).toBe("2작은술");
  });

  it("기름 1큰술 ≈ 13g", () => {
    expect(householdLabel("sesame_oil", 13)).toBe("1큰술");
    expect(householdLabel("olive_oil", 5)).toBe("1작은술");
  });

  it("½ 표기", () => {
    expect(householdLabel("butter", 21)).toBe("1½큰술"); // 21/14 = 1.5
    expect(householdLabel("soy_sauce", 23)).toBe("1½큰술"); // 23/15 ≈ 1.53
  });

  it("셀 수 있는 재료 → 개/장/줄/쪽", () => {
    expect(householdLabel("egg", 100)).toBe("2개");
    expect(householdLabel("egg", 50)).toBe("1개");
    expect(householdLabel("cheese_slice", 36)).toBe("2장");
    expect(householdLabel("bacon", 30)).toBe("2줄");
    expect(householdLabel("garlic", 5)).toBe("1쪽");
    expect(householdLabel("tofu", 150)).toBe("½모");
  });

  it("소량 양념은 작은술", () => {
    expect(householdLabel("salt", 5)).toBe("1작은술");
    expect(householdLabel("black_pepper", 2)).toBe("1작은술");
  });

  it("계량 매핑 없는 재료(고기·채소)는 null → 그램만 표시", () => {
    expect(householdLabel("pork_belly", 150)).toBeNull();
    expect(householdLabel("cabbage", 100)).toBeNull();
    expect(householdLabel("lamb", 200)).toBeNull();
  });

  it("너무 소량이면 null (환산 무의미)", () => {
    expect(householdLabel("garlic", 1)).toBeNull(); // 0.2쪽
  });
});
