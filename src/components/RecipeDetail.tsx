import { useEffect, useState } from "react";
import type { MatchResult } from "../lib/match";
import { MacroPie } from "./MacroPie";

const CATEGORY_LABEL: Record<string, string> = {
  meat: "육류", egg: "계란", seafood: "해산물", veg_side: "채소반찬", soup: "국·찌개", salad: "샐러드", snack: "간식",
};

interface Props {
  result: MatchResult;
  /** pantry 포함 실효 보유 재료 id */
  effectiveOwned: Set<string>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onEat: () => void;
  onAddShopping: (items: { id: string; name: string }[]) => void;
  onClose: () => void;
}

/** 레시피 상세 모달 — 재료(보유 표시)·조리 순서·매크로 파이 */
export function RecipeDetail({ result, effectiveOwned, isFavorite, onToggleFavorite, onEat, onAddShopping, onClose }: Props) {
  const { recipe } = result;
  const missing = recipe.ingredients.filter((ri) => !effectiveOwned.has(ri.id));

  const [ate, setAte] = useState(false);
  const [shopped, setShopped] = useState(false);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={recipe.name}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-stone-400">
              {CATEGORY_LABEL[recipe.category] ?? recipe.category} · {recipe.servings}인분 기준
            </span>
            <h2 className="text-xl font-bold">{recipe.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${isFavorite ? "text-amber-500" : "text-stone-300 hover:text-stone-400"}`}
            >
              ★
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-100"
            >
              ×
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
          <div>
            <div className="text-3xl font-extrabold text-emerald-700">
              {recipe.computed.netCarbG}g
            </div>
            <div className="text-xs text-emerald-600">1인분 순탄수</div>
          </div>
          <div className="text-right text-sm text-stone-600">
            {Math.round(recipe.computed.kcal)} kcal
            <div className="text-xs text-stone-400">1인분 기준</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => { onEat(); setAte(true); }}
            disabled={ate}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${ate ? "bg-emerald-100 text-emerald-600" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            {ate ? "오늘 기록에 담았어요 ✓" : "오늘 먹었어요"}
          </button>
          {missing.length > 0 && (
            <button
              type="button"
              onClick={() => { onAddShopping(missing.map((m) => ({ id: m.id, name: m.name }))); setShopped(true); }}
              disabled={shopped}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${shopped ? "bg-amber-100 text-amber-600" : "border border-amber-400 bg-white text-amber-700 hover:bg-amber-50"}`}
            >
              {shopped ? "장보기에 담았어요 ✓" : `부족 재료 담기 (${missing.length})`}
            </button>
          )}
        </div>

        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-stone-500">매크로</h3>
          <MacroPie computed={recipe.computed} />
        </section>

        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-stone-500">재료 ({recipe.servings}인분)</h3>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ri) => {
              const has = effectiveOwned.has(ri.id);
              return (
                <li key={ri.id} className="flex items-center justify-between text-sm">
                  <span className={has ? "" : "text-stone-400"}>
                    <span className={`mr-2 inline-block w-4 text-center ${has ? "text-emerald-600" : "text-stone-300"}`}>
                      {has ? "✓" : "○"}
                    </span>
                    {ri.name}
                  </span>
                  <span className="text-stone-500">{ri.grams}g</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-stone-500">조리 순서</h3>
          <ol className="space-y-2">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        {recipe.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
