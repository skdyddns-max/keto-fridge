import { macroPercents } from "../lib/nutrition";
import type { Computed } from "../lib/types";

/** 지방/단백질/탄수 비율 미니 스택바 (칼로리 기준) */
export function MacroBar({ computed }: { computed: Computed }) {
  const p = macroPercents(computed);
  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div className="bg-amber-400" style={{ width: `${p.fat}%` }} />
        <div className="bg-rose-400" style={{ width: `${p.protein}%` }} />
        <div className="bg-sky-400" style={{ width: `${p.carb}%` }} />
      </div>
      <div className="flex gap-3 text-[11px] text-stone-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />지방 {p.fat}%</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />단백질 {p.protein}%</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />탄수 {p.carb}%</span>
      </div>
    </div>
  );
}
