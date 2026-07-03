import type { MatchResult } from "../lib/match";
import { categoryMeta } from "../lib/categories";
import { MacroBar } from "./MacroBar";

interface Props {
  result: MatchResult;
  isFavorite?: boolean;
  onClick?: () => void;
}

export function RecipeCard({ result, isFavorite = false, onClick }: Props) {
  const { recipe, status, missing } = result;
  const cat = categoryMeta(recipe.category);

  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
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
      {/* 카테고리 색 강조선 */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${cat.accent}`} />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.chip}`}>
              <span>{cat.emoji}</span>
              {cat.label}
              {isFavorite && <span className="ml-0.5 text-amber-500">★</span>}
            </span>
            <h3 className="mt-1.5 truncate text-base font-bold text-stone-800">{recipe.name}</h3>
          </div>

          {/* 순탄수 크게 강조 (알약 배경) */}
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-emerald-50 px-3 py-1.5 text-center ring-1 ring-emerald-100">
            <div className="text-xl font-extrabold leading-none text-emerald-700">
              {recipe.computed.netCarbG}
              <span className="text-xs font-bold text-emerald-500">g</span>
            </div>
            <div className="mt-0.5 text-[10px] font-medium leading-none text-emerald-600/70">순탄수</div>
          </div>
        </div>

        <div className="mt-3">
          <MacroBar computed={recipe.computed} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
          <span>{Math.round(recipe.computed.kcal)} kcal</span>
          {recipe.tags.length > 0 && <span className="truncate">#{recipe.tags.slice(0, 2).join(" #")}</span>}
        </div>

        {status === "almost" && missing.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span>🛒</span>
            <span>
              이것만 추가하면 돼요: <strong>{missing.join(", ")}</strong>
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
