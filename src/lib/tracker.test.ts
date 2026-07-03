import { describe, it, expect } from "vitest";
import { DAILY_LIMIT_G, dayStatus, entriesForDate, localDateKey, makeEntry, sumNetCarb, type DayEntry } from "./tracker";

const e = (recipeId: string, netCarbG: number, date: string, at = 0): DayEntry => ({ recipeId, name: recipeId, netCarbG, date, at });

describe("localDateKey", () => {
  it("로컬 기준 YYYY-MM-DD, 한 자리 월·일 zero-pad", () => {
    expect(localDateKey(new Date(2026, 0, 3, 23, 59))).toBe("2026-01-03");
    expect(localDateKey(new Date(2026, 11, 25, 0, 0))).toBe("2026-12-25");
  });
});

describe("makeEntry", () => {
  it("레시피 순탄수·날짜·시각을 담는다", () => {
    const now = new Date(2026, 6, 3, 12, 0);
    const entry = makeEntry({ id: "r1", name: "삼겹살", computed: { kcal: 0, netCarbG: 5.1, fatG: 0, proteinG: 0 } }, now);
    expect(entry).toMatchObject({ recipeId: "r1", name: "삼겹살", netCarbG: 5.1, date: "2026-07-03" });
    expect(entry.at).toBe(now.getTime());
  });
});

describe("entriesForDate / sumNetCarb", () => {
  const log = [e("a", 5, "2026-07-03"), e("b", 3.3, "2026-07-03"), e("c", 8, "2026-07-02")];
  it("해당 날짜만 필터", () => {
    expect(entriesForDate(log, "2026-07-03").map((x) => x.recipeId)).toEqual(["a", "b"]);
  });
  it("순탄수 합계 (반올림 1자리)", () => {
    expect(sumNetCarb(entriesForDate(log, "2026-07-03"))).toBe(8.3);
    expect(sumNetCarb([])).toBe(0);
  });
});

describe("dayStatus", () => {
  it("경계: 15 미만 ok, 15~20 warn, 20 초과 over", () => {
    expect(dayStatus(0)).toBe("ok");
    expect(dayStatus(14.9)).toBe("ok");
    expect(dayStatus(15)).toBe("warn");
    expect(dayStatus(DAILY_LIMIT_G)).toBe("warn");
    expect(dayStatus(20.1)).toBe("over");
  });
});
