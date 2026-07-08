import { useEffect, useRef, useState } from "react";
import type { Recipe } from "../lib/types";
import { householdLabel } from "../lib/measures";

interface Props {
  recipe: Recipe;
  /** 재료 배수(인분 조절 반영) */
  factor: number;
  onClose: () => void;
}

/** 단계 텍스트에서 "N분" 추출 (타이머용) */
export function stepMinutes(step: string): number | null {
  const m = step.match(/(\d+)\s*분/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n > 0 && n <= 180 ? n : null;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* 오디오 미지원 무시 */
  }
  navigator.vibrate?.([200, 100, 200]);
}

/** 조리 모드 — 큰 단계·재료 체크·타이머·화면 켜짐 유지 */
export function CookMode({ recipe, factor, onClose }: Props) {
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [doneIngs, setDoneIngs] = useState<Set<string>>(new Set());
  const [timerStep, setTimerStep] = useState<number | null>(null);
  const [remain, setRemain] = useState(0);
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  // 화면 꺼짐 방지
  useEffect(() => {
    const request = async () => {
      try {
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* 미지원 무시 */
      }
    };
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      wakeRef.current?.release().catch(() => {});
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 타이머
  useEffect(() => {
    if (timerStep === null) return;
    if (remain <= 0) {
      beep();
      setTimerStep(null);
      return;
    }
    const t = setTimeout(() => setRemain((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [timerStep, remain]);

  const startTimer = (idx: number, min: number) => {
    setTimerStep(idx);
    setRemain(min * 60);
  };
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const toggleStep = (i: number) =>
    setDoneSteps((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const doneCount = doneSteps.size;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white" onClick={(e) => e.stopPropagation()}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-emerald-600">조리 모드 · {doneCount}/{recipe.steps.length} 단계</p>
          <h2 className="truncate text-lg font-bold">{recipe.name}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="조리 모드 닫기" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-stone-400 hover:bg-stone-100">
          ×
        </button>
      </div>

      {/* 진행바 */}
      <div className="h-1 w-full bg-stone-100">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / recipe.steps.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 재료 준비 체크 */}
        <details className="mb-4 rounded-xl bg-stone-50 px-4 py-3" open>
          <summary className="cursor-pointer text-sm font-bold text-stone-600">재료 준비 ({doneIngs.size}/{recipe.ingredients.length})</summary>
          <ul className="mt-2 space-y-1">
            {recipe.ingredients.map((ri) => {
              const done = doneIngs.has(ri.id);
              const hh = householdLabel(ri.id, ri.grams * factor);
              return (
                <li key={ri.id}>
                  <button
                    type="button"
                    onClick={() => setDoneIngs((p) => { const n = new Set(p); n.has(ri.id) ? n.delete(ri.id) : n.add(ri.id); return n; })}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white"
                  >
                    <span className={done ? "text-stone-400 line-through" : "text-stone-700"}>
                      <span className={`mr-2 ${done ? "text-emerald-500" : "text-stone-300"}`}>{done ? "☑" : "☐"}</span>
                      {ri.name}
                    </span>
                    <span className="text-stone-500">
                      {hh && <span className="mr-1.5 font-medium text-stone-700">{hh}</span>}
                      <span className="text-stone-400">{Math.round(ri.grams * factor)}g</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </details>

        {/* 단계 */}
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => {
            const done = doneSteps.has(i);
            const min = stepMinutes(s);
            const active = timerStep === i;
            return (
              <li
                key={i}
                className={`rounded-2xl border p-4 transition ${done ? "border-stone-100 bg-stone-50" : "border-stone-200 bg-white shadow-sm"}`}
              >
                <button type="button" onClick={() => toggleStep(i)} className="flex w-full gap-3 text-left">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-600"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-base leading-relaxed ${done ? "text-stone-400 line-through" : "text-stone-800"}`}>{s}</span>
                </button>
                {min && (
                  <div className="mt-3 pl-11">
                    {active ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold tabular-nums text-emerald-700">{mmss(remain)}</span>
                        <button type="button" onClick={() => setTimerStep(null)} className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600">
                          정지
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startTimer(i, min)}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                      >
                        ⏱️ {min}분 타이머 시작
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {doneCount === recipe.steps.length && (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center">
            <div className="text-3xl">🎉</div>
            <p className="mt-2 font-bold text-emerald-700">완성! 맛있게 드세요</p>
            <button type="button" onClick={onClose} className="mt-3 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
