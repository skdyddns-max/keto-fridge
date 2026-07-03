import type { DayEntry } from "./tracker";
import type { ShoppingItem } from "../components/ShoppingList";

/** 기기간 동기화 대상 사용자 상태 (localStorage와 동일 필드) */
export interface SyncState {
  favorites: string[];
  excluded: string[];
  shopping: ShoppingItem[];
  daylog: DayEntry[];
  updatedAt: number;
}

export const EMPTY_STATE: SyncState = { favorites: [], excluded: [], shopping: [], daylog: [], updatedAt: 0 };

const uniq = (xs: string[]) => [...new Set(xs)];

function unionBy<T>(a: T[], b: T[], key: (t: T) => string | number): T[] {
  const seen = new Set<string | number>();
  const out: T[] = [];
  for (const x of [...a, ...b]) {
    const k = key(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/**
 * 두 상태를 손실 없이 병합 (새 기기 연결 시 기존 데이터 보존).
 * - favorites/excluded: 합집합
 * - shopping: id 기준 합집합
 * - daylog: at(시각) 기준 합집합
 * - updatedAt: 더 최신값
 */
export function mergeStates(a: SyncState, b: SyncState): SyncState {
  return {
    favorites: uniq([...a.favorites, ...b.favorites]),
    excluded: uniq([...a.excluded, ...b.excluded]),
    shopping: unionBy(a.shopping, b.shopping, (x) => x.id),
    daylog: unionBy(a.daylog, b.daylog, (x) => x.at),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

/** 두 상태가 동일 내용인지 (불필요한 push 방지용, updatedAt 제외 비교) */
export function sameState(a: SyncState, b: SyncState): boolean {
  const norm = (s: SyncState) =>
    JSON.stringify({
      f: [...s.favorites].sort(),
      e: [...s.excluded].sort(),
      s: [...s.shopping].map((x) => x.id).sort(),
      d: [...s.daylog].map((x) => x.at).sort(),
    });
  return norm(a) === norm(b);
}
