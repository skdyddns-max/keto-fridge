import { useState } from "react";

/** localStorage 동기화 상태 훅 (즐겨찾기·제외재료·최근 입력용) */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* 저장 실패는 무시 (시크릿 모드 등) */
      }
      return v;
    });
  };

  return [value, set] as const;
}
