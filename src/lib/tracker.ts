import type { Recipe } from "./types";

/** 키토 하루 순탄수 상한 (spec §2) */
export const DAILY_LIMIT_G = 20;

export interface DayEntry {
  recipeId: string;
  name: string;
  netCarbG: number;
  /** 로컬 날짜 키 (YYYY-MM-DD) */
  date: string;
  /** epoch ms — 같은 날 내 정렬·삭제 식별용 */
  at: number;
}

/** 로컬 타임존 기준 YYYY-MM-DD */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function makeEntry(recipe: Pick<Recipe, "id" | "name" | "computed">, now: Date): DayEntry {
  return { recipeId: recipe.id, name: recipe.name, netCarbG: recipe.computed.netCarbG, date: localDateKey(now), at: now.getTime() };
}

export function entriesForDate(log: DayEntry[], dateKey: string): DayEntry[] {
  return log.filter((e) => e.date === dateKey);
}

export function sumNetCarb(entries: DayEntry[]): number {
  return Math.round(entries.reduce((s, e) => s + e.netCarbG, 0) * 10) / 10;
}

export type DayStatus = "ok" | "warn" | "over";

/** 하루 누적 순탄수 → 상태 (ok: 여유 / warn: 상한 근접 / over: 초과) */
export function dayStatus(totalNetCarbG: number): DayStatus {
  if (totalNetCarbG > DAILY_LIMIT_G) return "over";
  if (totalNetCarbG >= DAILY_LIMIT_G * 0.75) return "warn";
  return "ok";
}
