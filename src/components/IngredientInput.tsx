import { useMemo, useRef, useState } from "react";
import { exactMatch, suggest } from "../lib/normalize";
import type { Ingredient } from "../lib/types";

interface Props {
  ingredients: Ingredient[];
  owned: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  placeholder?: string;
  /** 칩 색상 톤 — 보유재료(emerald) / 제외재료(rose) */
  tone?: "emerald" | "rose";
}

const TONE = {
  emerald: { chip: "bg-emerald-100 text-emerald-800", x: "text-emerald-600 hover:bg-emerald-200" },
  rose: { chip: "bg-rose-100 text-rose-800", x: "text-rose-600 hover:bg-rose-200" },
};

/** 재료 태그 입력 — 자동완성(이름·별칭), 키보드 탐색, 칩 제거 */
export function IngredientInput({ ingredients, owned, onAdd, onRemove, placeholder, tone = "emerald" }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const candidates = useMemo(() => suggest(query, ingredients, ownedSet), [query, ingredients, ownedSet]);

  const add = (id: string) => {
    onAdd(id);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중 엔터 중복 방지
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = candidates[active] ?? exactMatch(query, ingredients);
      if (pick && !ownedSet.has(pick.id)) add(pick.id);
    } else if (e.key === "Escape") {
      setQuery("");
    } else if (e.key === "Backspace" && query === "" && owned.length > 0) {
      onRemove(owned[owned.length - 1]);
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "냉장고 재료를 입력하세요 (예: 삼겹살, 계란, 양배추)"}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          aria-label="재료 검색"
        />
        {candidates.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
            {candidates.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(c.id)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${i === active ? "bg-emerald-50" : ""}`}
                >
                  <span>{c.name}</span>
                  {c.pantry && <span className="text-[11px] text-stone-400">조미료</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {owned.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {owned.map((id) => {
            const ing = byId.get(id);
            if (!ing) return null;
            return (
              <span key={id} className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-sm font-medium ${TONE[tone].chip}`}>
                {ing.name}
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  aria-label={`${ing.name} 제거`}
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${TONE[tone].x}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
