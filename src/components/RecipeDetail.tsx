import { useEffect, useRef, useState } from "react";
import type { MatchResult } from "../lib/match";
import { categoryMeta } from "../lib/categories";
import { householdLabel } from "../lib/measures";
import { usePhotos } from "../store/usePhotos";
import { MacroPie } from "./MacroPie";
import { CookMode } from "./CookMode";

interface Props {
  result: MatchResult;
  /** pantry 포함 실효 보유 재료 id */
  effectiveOwned: Set<string>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onEat: () => void;
  onAddShopping: (items: { id: string; name: string }[]) => void;
  onPhotosChanged?: () => void;
  onClose: () => void;
}

/** 레시피 상세 모달 — 재료(보유 표시)·조리 순서·매크로 파이·내 사진 */
export function RecipeDetail({ result, effectiveOwned, isFavorite, onToggleFavorite, onEat, onAddShopping, onPhotosChanged, onClose }: Props) {
  const { recipe } = result;
  const missing = recipe.ingredients.filter((ri) => !effectiveOwned.has(ri.id));

  const [ate, setAte] = useState(false);
  const [shopped, setShopped] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [portions, setPortions] = useState(recipe.servings); // 만들 인분 수
  const factor = portions / recipe.servings; // 재료 배수 (순탄수는 1인분 기준이라 불변)
  const [cooking, setCooking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { photos, add, remove, busy, error } = usePhotos(recipe.id, onPhotosChanged);

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
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryMeta(recipe.category).chip}`}>
              <span>{categoryMeta(recipe.category).emoji}</span>
              {categoryMeta(recipe.category).label} · {recipe.servings}인분
            </span>
            <h2 className="mt-1.5 text-xl font-bold">{recipe.name}</h2>
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
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-500">재료</h3>
            {/* 인분 조절 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPortions((p) => Math.max(1, p - 1))}
                disabled={portions <= 1}
                aria-label="인분 줄이기"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-14 text-center text-sm font-bold text-stone-700">{portions}인분</span>
              <button
                type="button"
                onClick={() => setPortions((p) => Math.min(10, p + 1))}
                disabled={portions >= 10}
                aria-label="인분 늘리기"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ri) => {
              const has = effectiveOwned.has(ri.id);
              const grams = Math.round(ri.grams * factor);
              const hh = householdLabel(ri.id, ri.grams * factor);
              return (
                <li key={ri.id} className="flex items-center justify-between text-sm">
                  <span className={has ? "" : "text-stone-400"}>
                    <span className={`mr-2 inline-block w-4 text-center ${has ? "text-emerald-600" : "text-stone-300"}`}>
                      {has ? "✓" : "○"}
                    </span>
                    {ri.name}
                  </span>
                  <span className="text-stone-500">
                    {hh && <span className="mr-1.5 font-medium text-stone-700">{hh}</span>}
                    <span className="text-stone-400">{grams}g</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {portions !== recipe.servings && (
            <p className="mt-2 text-[11px] text-stone-400">순탄수·매크로는 1인분 기준이라 그대로예요. 재료만 {portions}인분으로 계산했어요.</p>
          )}
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-500">조리 순서</h3>
            <button
              type="button"
              onClick={() => setCooking(true)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              👨‍🍳 요리 시작
            </button>
          </div>
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

        {/* 내가 만든 사진 */}
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-500">📸 내가 만든 사진 {photos.length > 0 && <span className="text-stone-400">({photos.length})</span>}</h3>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
            >
              {busy ? "저장 중…" : "+ 사진 추가"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) add(f);
              e.target.value = "";
            }}
          />
          {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
          {photos.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 py-6 text-stone-400 transition hover:border-emerald-300 hover:text-emerald-600"
            >
              <span className="text-2xl">🍳</span>
              <span className="text-xs">직접 만든 요리 사진을 남겨보세요</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                  <img src={p.url} alt="내가 만든 사진" className="h-full w-full cursor-pointer object-cover" onClick={() => setZoom(p.url)} />
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label="사진 삭제"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-sm text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {recipe.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* 사진 확대 보기 */}
      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="확대" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}

      {cooking && <CookMode recipe={recipe} factor={factor} onClose={() => setCooking(false)} />}
    </div>
  );
}
