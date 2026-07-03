import { DAILY_LIMIT_G, dayStatus, entriesForDate, localDateKey, sumNetCarb, type DayEntry } from "../lib/tracker";

const STATUS_STYLE = {
  ok: { bar: "bg-emerald-500", text: "text-emerald-700", label: "여유 있어요" },
  warn: { bar: "bg-amber-500", text: "text-amber-700", label: "상한에 가까워요" },
  over: { bar: "bg-rose-500", text: "text-rose-700", label: "오늘 상한을 넘었어요" },
} as const;

interface Props {
  log: DayEntry[];
  now: Date;
  onRemove: (at: number) => void;
  onClear: () => void;
}

/** 오늘 먹은 레시피의 순탄수 누적 트래커 (하루 20g 기준) */
export function DayTracker({ log, now, onRemove, onClear }: Props) {
  const today = entriesForDate(log, localDateKey(now));
  const total = sumNetCarb(today);
  const status = dayStatus(total);
  const s = STATUS_STYLE[status];
  const pct = Math.min(100, (total / DAILY_LIMIT_G) * 100);

  return (
    <details className="mb-4 rounded-xl border border-stone-200 bg-white px-4 py-3" open={today.length > 0}>
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-stone-600">
        <span>오늘 순탄수</span>
        <span className={`font-bold ${s.text}`}>
          {total}
          <span className="text-xs font-semibold"> / {DAILY_LIMIT_G}g</span>
        </span>
      </summary>

      <div className="mt-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`mt-1.5 text-xs ${s.text}`}>{s.label}</p>

        {today.length === 0 ? (
          <p className="mt-3 text-xs text-stone-400">레시피 상세에서 "오늘 먹었어요"를 누르면 여기에 쌓여요.</p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {today.map((e) => (
                <li key={e.at} className="flex items-center justify-between text-sm">
                  <span className="truncate text-stone-700">{e.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-stone-500">{e.netCarbG}g</span>
                    <button
                      type="button"
                      onClick={() => onRemove(e.at)}
                      aria-label={`${e.name} 기록 삭제`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={onClear} className="mt-3 text-xs text-stone-400 underline hover:text-stone-600">
              오늘 기록 비우기
            </button>
          </>
        )}
      </div>
    </details>
  );
}
