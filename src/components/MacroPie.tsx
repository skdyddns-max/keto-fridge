import { macroPercents } from "../lib/nutrition";
import type { Computed } from "../lib/types";

const COLORS = { fat: "#fbbf24", protein: "#fb7185", carb: "#38bdf8" }; // amber-400 / rose-400 / sky-400

/** 매크로 도넛 파이 (경량 SVG, spec §6) */
export function MacroPie({ computed, size = 96 }: { computed: Computed; size?: number }) {
  const p = macroPercents(computed);
  const r = 40;
  const c = 2 * Math.PI * r;
  const segs = [
    { key: "fat", pct: p.fat, label: "지방", grams: computed.fatG },
    { key: "protein", pct: p.protein, label: "단백질", grams: computed.proteinG },
    { key: "carb", pct: p.carb, label: "순탄수", grams: computed.netCarbG },
  ] as const;

  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`매크로 비율 지방 ${p.fat}% 단백질 ${p.protein}% 탄수 ${p.carb}%`}>
        <g transform="rotate(-90 50 50)">
          {segs.map((s) => {
            const dash = (s.pct / 100) * c;
            const el = (
              <circle
                key={s.key}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={COLORS[s.key]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x="50" y="47" textAnchor="middle" className="fill-stone-800" fontSize="17" fontWeight="800">
          {p.fat}%
        </text>
        <text x="50" y="62" textAnchor="middle" className="fill-stone-400" fontSize="9">
          지방
        </text>
      </svg>
      <dl className="space-y-1 text-sm">
        {segs.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[s.key] }} />
            <dt className="w-12 text-stone-500">{s.label}</dt>
            <dd className="font-semibold">{s.grams}g <span className="font-normal text-stone-400">({s.pct}%)</span></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
