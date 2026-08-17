import { useEffect, useMemo } from "react";
import type { Ingredient } from "../lib/types";
import { GROUP_ORDER, groupOf } from "../lib/ingredientGroups";

interface Props {
  /** 선택 가능한 재료 (비양념·레시피 사용) */
  ingredients: Ingredient[];
  owned: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}

/** 재료 톡톡 선택 — 카테고리별 그리드에서 타이핑 없이 눌러 담기 */
export function IngredientPicker({ ingredients, owned, onToggle, onClose }: Props) {
  const ownedSet = useMemo(() => new Set(owned), [owned]);

  const grouped = useMemo(() => {
    const map: Record<string, Ingredient[]> = {};
    for (const i of ingredients) (map[groupOf(i)] ??= []).push(i);
    for (const k in map) map[k].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return map;
  }, [ingredients]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="재료 골라 담기"
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h2 className="text-lg font-bold">
            🧺 재료 골라 담기 {owned.length > 0 && <span className="text-sm font-semibold text-emerald-600">{owned.length}개 담음</span>}
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-100">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {GROUP_ORDER.map((g) => {
            const items = grouped[g.key];
            if (!items || items.length === 0) return null;
            return (
              <section key={g.key} className="mb-5">
                <h3 className="mb-2 text-sm font-bold text-stone-500">
                  {g.emoji} {g.label} <span className="font-medium text-stone-300">{items.length}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((i) => {
                    const on = ownedSet.has(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => onToggle(i.id)}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          on
                            ? "border-emerald-500 bg-emerald-500 font-semibold text-white"
                            : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {on ? "✓ " : ""}{i.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="border-t border-stone-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            {owned.length > 0 ? `${owned.length}개 담고 레시피 보기` : "닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}
