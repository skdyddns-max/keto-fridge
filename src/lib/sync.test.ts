import { describe, it, expect } from "vitest";
import { EMPTY_STATE, mergeStates, sameState, type SyncState } from "./sync";

const state = (over: Partial<SyncState>): SyncState => ({ ...EMPTY_STATE, ...over });

describe("mergeStates", () => {
  it("favorites/excluded 합집합 (중복 제거)", () => {
    const m = mergeStates(state({ favorites: ["a", "b"], excluded: ["x"] }), state({ favorites: ["b", "c"], excluded: ["y"] }));
    expect(m.favorites.sort()).toEqual(["a", "b", "c"]);
    expect(m.excluded.sort()).toEqual(["x", "y"]);
  });

  it("shopping은 id 기준 합집합", () => {
    const m = mergeStates(
      state({ shopping: [{ id: "p", name: "돼지" }] }),
      state({ shopping: [{ id: "p", name: "돼지" }, { id: "e", name: "계란" }] }),
    );
    expect(m.shopping.map((x) => x.id).sort()).toEqual(["e", "p"]);
  });

  it("daylog는 at(시각) 기준 합집합", () => {
    const m = mergeStates(
      state({ daylog: [{ recipeId: "r1", name: "A", netCarbG: 3, date: "2026-07-03", at: 100 }] }),
      state({ daylog: [{ recipeId: "r1", name: "A", netCarbG: 3, date: "2026-07-03", at: 100 }, { recipeId: "r2", name: "B", netCarbG: 5, date: "2026-07-03", at: 200 }] }),
    );
    expect(m.daylog.map((x) => x.at).sort()).toEqual([100, 200]);
  });

  it("updatedAt은 더 최신값", () => {
    expect(mergeStates(state({ updatedAt: 5 }), state({ updatedAt: 9 })).updatedAt).toBe(9);
  });

  it("빈 상태와 병합은 원본 보존", () => {
    const s = state({ favorites: ["a"], updatedAt: 3 });
    expect(mergeStates(s, EMPTY_STATE).favorites).toEqual(["a"]);
  });
});

describe("sameState", () => {
  it("내용 같으면 true (updatedAt·순서 무관)", () => {
    expect(sameState(state({ favorites: ["a", "b"], updatedAt: 1 }), state({ favorites: ["b", "a"], updatedAt: 999 }))).toBe(true);
  });
  it("내용 다르면 false", () => {
    expect(sameState(state({ favorites: ["a"] }), state({ favorites: ["a", "b"] }))).toBe(false);
  });
});
