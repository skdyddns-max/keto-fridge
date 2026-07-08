import { memo } from "react";
import type { MatchResult } from "../lib/match";
import { categoryMeta } from "../lib/categories";
import { MacroBar } from "./MacroBar";

interface Props {
  result: MatchResult;
  isFavorite?: boolean;
  hasPhoto?: boolean;
  /** 사용자가 올린 사진 썸네일 (있으면 이모지 타일 대신 표시) */
  thumbUrl?: string;
  onClick?: () => void;
}

function RecipeCardBase({ result, isFavorite = false, hasPhoto = false, thumbUrl, onClick }: Props) {
  const { recipe, status, missing } = result;
  const cat = categoryMeta(recipe.category);

  return (
    <article
      className="group flex cursor-pointer overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
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
      {/* 썸네일: 사진이 있으면 사진, 없으면 카테고리 이모지 타일 */}
      <div className={`relative flex w-20 shrink-0 items-center justify-center bg-gradient-to-br ${cat.tile} sm:w-24`}>
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl opacity-90 sm:text-4xl">{cat.emoji}</span>
        )}
        {hasPhoto && <span className="absolute bottom-1 right-1 text-xs">📸</span>}
      </div>

      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.chip}`}>
              {cat.label}
              {isFavorite && <span className="ml-0.5 text-amber-500">★</span>}
            </span>
            <h3 className="mt-1.5 truncate text-base font-bold text-stone-800">{recipe.name}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-emerald-50 px-2.5 py-1 text-center ring-1 ring-emerald-100">
            <div className="text-lg font-extrabold leading-none text-emerald-700">
              {recipe.computed.netCarbG}
              <span className="text-[11px] font-bold text-emerald-500">g</span>
            </div>
            <div className="mt-0.5 text-[9px] font-medium leading-none text-emerald-600/70">순탄수</div>
          </div>
        </div>

        <div className="mt-2.5">
          <MacroBar computed={recipe.computed} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
          <span>{Math.round(recipe.computed.kcal)} kcal</span>
          {recipe.tags.length > 0 && <span className="truncate">#{recipe.tags.slice(0, 2).join(" #")}</span>}
        </div>

        {status === "almost" && missing.length > 0 && (
          <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
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

/**
 * result 객체는 매칭 재계산 시에만 새로 생성되므로(모달 열기·인분 변경엔 불변),
 * 참조 비교로 수백 개 카드의 불필요한 리렌더를 막는다. onClick은 동작이 안정적이라 비교에서 제외.
 */
export const RecipeCard = memo(
  RecipeCardBase,
  (a, b) =>
    a.result === b.result && a.isFavorite === b.isFavorite && a.hasPhoto === b.hasPhoto && a.thumbUrl === b.thumbUrl,
);
