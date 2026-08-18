import type { Recipe } from "./types";
import { DAILY_LIMIT_G } from "./tracker";

export interface PlanDay {
  key: string;
  label: string;
}

export const PLAN_DAYS: PlanDay[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

/** 요일키 → 레시피 id 배열 */
export type Plan = Record<string, string[]>;

export interface DayTotals {
  count: number;
  kcal: number;
  netCarbG: number;
  fatG: number;
  proteinG: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function dayTotals(ids: string[], byId: Map<string, Recipe>): DayTotals {
  let kcal = 0, netCarbG = 0, fatG = 0, proteinG = 0, count = 0;
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) continue;
    count++;
    kcal += r.computed.kcal;
    netCarbG += r.computed.netCarbG;
    fatG += r.computed.fatG;
    proteinG += r.computed.proteinG;
  }
  return { count, kcal: Math.round(kcal), netCarbG: round1(netCarbG), fatG: round1(fatG), proteinG: round1(proteinG) };
}

/** 하루 순탄수가 키토 기준(20g) 이내인지 */
export function isDayKeto(t: DayTotals): boolean {
  return t.netCarbG <= DAILY_LIMIT_G;
}

export function addToPlan(plan: Plan, day: string, recipeId: string): Plan {
  const list = plan[day] ?? [];
  return { ...plan, [day]: [...list, recipeId] };
}

export function removeFromPlan(plan: Plan, day: string, index: number): Plan {
  const list = plan[day] ?? [];
  return { ...plan, [day]: list.filter((_, i) => i !== index) };
}
