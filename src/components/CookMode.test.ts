import { describe, it, expect } from "vitest";
import { stepMinutes } from "./CookMode";

describe("stepMinutes", () => {
  it("'N분' 추출", () => {
    expect(stepMinutes("약불에서 10분간 굽는다")).toBe(10);
    expect(stepMinutes("3분간 반숙으로 익힌다")).toBe(3);
    expect(stepMinutes("180도 오븐에서 35분 굽는다")).toBe(35);
  });
  it("공백 허용", () => {
    expect(stepMinutes("5 분 끓인다")).toBe(5);
  });
  it("분이 없으면 null", () => {
    expect(stepMinutes("소금·후추를 뿌린다")).toBeNull();
    expect(stepMinutes("팬에 버터를 녹인다")).toBeNull();
  });
  it("비상식적 값(0·180 초과)은 null", () => {
    expect(stepMinutes("0분")).toBeNull();
    expect(stepMinutes("200분 고아낸다")).toBeNull();
  });
});
