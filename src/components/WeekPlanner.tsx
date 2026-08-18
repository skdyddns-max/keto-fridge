import { useEffect } from "react";
import type { Recipe } from "../lib/types";
import { PLAN_DAYS, type Plan, dayTotals, isDayKeto } from "../lib/planner";
import { DAILY_LIMIT_G } from "../lib/tracker";

interface Props {
  plan: Plan;
  byId: Map<string, Recipe>;
  onRemove: (day: string, index: number) => void;
  onOpenRecipe: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** 주간 식단 플래너 — 요일별 레시피 + 탄단지 일일 합계 (운동인 대상) */
export function WeekPlanner({ plan, byId, onRemove, onOpenRecipe, onClear, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const totalCount = PLAN_DAYS.reduce((s, d) => s + (plan[d.key]?.length ?? 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="주간 식단"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h2 className="text-lg font-bold">🗓️ 주간 식단 <span className="text-sm font-semibold text-stone-400">{totalCount}개</span></h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-100">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {totalCount === 0 && (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-8 text-center text-sm text-stone-500">
              레시피 상세에서 <strong>🗓️ 식단에 추가</strong>를 누르면<br />요일별로 식단이 짜여요. 탄단지 합계도 자동 계산!
            </p>
          )}
          {PLAN_DAYS.map((d) => {
            const ids = plan[d.key] ?? [];
            const t = dayTotals(ids, byId);
            const carbOk = isDayKeto(t);
            return (
              <section key={d.key} className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-bold text-stone-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700">{d.label}</span>
                    {ids.length > 0 && (
                      <span className="flex flex-wrap gap-1.5 text-[11px] font-medium">
                        <span className={`rounded-full px-2 py-0.5 ${carbOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                          순탄수 {t.netCarbG}/{DAILY_LIMIT_G}g
                        </span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">단백질 {t.proteinG}g</span>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">{t.kcal}kcal</span>
                      </span>
                    )}
                  </h3>
                </div>
                {ids.length === 0 ? (
                  <p className="mt-2 pl-9 text-xs text-stone-300">비어 있음</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {ids.map((id, idx) => {
                      const r = byId.get(id);
                      if (!r) return null;
                      return (
                        <li key={`${id}-${idx}`} className="flex items-center justify-between gap-2 pl-9 text-sm">
                          <button type="button" onClick={() => onOpenRecipe(id)} className="flex-1 truncate text-left text-stone-700 hover:text-emerald-700">
                            {r.name} <span className="text-xs text-stone-400">· 단백 {r.computed.proteinG}g</span>
                          </button>
                          <button type="button" onClick={() => onRemove(d.key, idx)} aria-label="삭제" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100">
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {totalCount > 0 && (
          <div className="border-t border-stone-100 p-4">
            <button type="button" onClick={onClear} className="text-xs text-stone-400 underline hover:text-stone-600">주간 식단 비우기</button>
          </div>
        )}
      </div>
    </div>
  );
}
