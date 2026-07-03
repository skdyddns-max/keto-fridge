import type { MatchResult } from "../lib/match";
import { MacroBar } from "./MacroBar";

const CATEGORY_LABEL: Record<string, string> = {
  meat: "육류",
  egg: "계란",
  seafood: "해산물",
  veg_side: "채소반찬",
  soup: "국·찌개",
  salad: "샐러드",
  snack: "간식",
};

interface Props {
  result: MatchResult;
  isFavorite?: boolean;
  onClick?: () => void;
}

export function RecipeCard({ result, isFavorite = false, onClick }: Props) {
  const { recipe, status, missing } = result;
  return (
    <article
      className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-stone-400">
            {CATEGORY_LABEL[recipe.category] ?? recipe.category}
            {isFavorite && <span className="ml-1.5 text-amber-500">★</span>}
          </span>
          <h3 className="truncate text-base font-semibold">{recipe.name}</h3>
        </div>
        <div className="shrink-0 text-right">
          {/* 순탄수는 크고 굵게 (CLAUDE.md 디자인 규칙) */}
          <div className="text-xl font-extrabold text-emerald-700">
            {recipe.computed.netCarbG}
            <span className="text-xs font-semibold text-emerald-600">g</span>
          </div>
          <div className="text-[11px] leading-none text-stone-400">순탄수 · {Math.round(recipe.computed.kcal)}kcal</div>
        </div>
      </div>

      <div className="mt-3">
        <MacroBar computed={recipe.computed} />
      </div>

      {status === "almost" && missing.length > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          이것만 추가하면 돼요: <strong>{missing.join(", ")}</strong>
        </p>
      )}
    </article>
  );
}
