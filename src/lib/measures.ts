/**
 * 가정용 계량 병기 — 그램을 큰술/작은술/개 등 집에서 쓰는 단위로 환산.
 * 조미료·기름·계란·치즈장 등 저울 없이 계량하는 재료에만 적용(없으면 그램만 표시).
 */

interface Measure {
  unit: string; // 주 단위 (큰술/개/장/줄/쪽/모)
  g: number; // 1 단위 = ? 그램
  count?: boolean; // 셀 수 있는 것(개·장·줄)
  sub?: { unit: string; g: number }; // 소량일 때 대체 단위(보통 작은술)
}

const TBSP = (g: number, sub = 5): Measure => ({ unit: "큰술", g, sub: { unit: "작은술", g: sub } });
const CNT = (unit: string, g: number): Measure => ({ unit, g, count: true });

const MEASURES: Record<string, Measure> = {
  // 액체 조미료 (1큰술 ≈ 15g)
  soy_sauce: TBSP(15), soup_soy_sauce: TBSP(15), fish_sauce: TBSP(15), oyster_sauce: TBSP(18, 6),
  cooking_wine: TBSP(15), vinegar: TBSP(15), apple_vinegar: TBSP(15), mustard: TBSP(15),
  mayo: TBSP(15), heavy_cream: TBSP(15), sour_cream: TBSP(15), coconut_milk: TBSP(15),
  // 기름 (1큰술 ≈ 13g, 1작은술 ≈ 5g)
  sesame_oil: TBSP(13, 5), perilla_oil: TBSP(13, 5), olive_oil: TBSP(13, 5), avocado_oil: TBSP(13, 5), coconut_oil: TBSP(13, 5),
  // 가루·장 (1큰술 g 다양)
  gochugaru: TBSP(7, 2), sesame: TBSP(8, 3), perilla_seed: TBSP(7, 2), doenjang: TBSP(17, 6),
  erythritol: TBSP(12, 4), allulose: TBSP(15, 5), cocoa_powder: TBSP(6, 2),
  paprika_powder: TBSP(7, 2), curry_powder: TBSP(7, 2), garlic_powder: TBSP(9, 3),
  almond_flour: TBSP(7, 2), coconut_flour: TBSP(7, 2),
  // 소량 양념 (작은술만)
  salt: { unit: "작은술", g: 5 }, black_pepper: { unit: "작은술", g: 2 },
  // 고체 지방
  butter: TBSP(14, 5),
  // 셀 수 있는 것
  egg: CNT("개", 50), egg_yolk: CNT("개", 18), egg_white: CNT("개", 33), quail_egg: CNT("개", 10),
  cheese_slice: CNT("장", 18), cheese_string: CNT("개", 20), gim: CNT("장", 2),
  bacon: CNT("줄", 15), garlic: CNT("쪽", 5), tofu: CNT("모", 300), soft_tofu: CNT("팩", 350),
  avocado: CNT("개", 150), sausage: CNT("개", 20),
};

const roundHalf = (x: number) => Math.round(x * 2) / 2;

/** 0.5 단위를 ½ 기호로 표기 */
function fmtQty(x: number): string {
  const whole = Math.floor(x);
  const half = x - whole >= 0.5;
  if (half) return whole > 0 ? `${whole}½` : "½";
  return `${whole}`;
}

/**
 * 그램 → 가정용 계량 문자열. 해당 재료가 아니거나 너무 소량이면 null.
 * 예: householdLabel("soy_sauce", 15) === "1큰술", ("egg", 100) === "2개"
 */
export function householdLabel(id: string, grams: number): string | null {
  const m = MEASURES[id];
  if (!m) return null;

  if (m.count) {
    const q = roundHalf(grams / m.g);
    if (q < 0.5) return null;
    return `${fmtQty(q)}${m.unit}`;
  }

  const qMain = grams / m.g;
  // 1큰술의 3/4 미만이면 작은술로 표기(더 정확)
  if (qMain < 0.75 && m.sub) {
    const qs = roundHalf(grams / m.sub.g);
    if (qs < 0.5) return null;
    return `${fmtQty(qs)}${m.sub.unit}`;
  }
  const q = roundHalf(qMain);
  if (q < 0.5) return null;
  return `${fmtQty(q)}${m.unit}`;
}
