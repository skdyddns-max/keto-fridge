import { useEffect } from "react";

export interface ShoppingItem {
  id: string;
  name: string;
}

interface Props {
  items: ShoppingItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** 장보기 리스트 모달 — almost 레시피의 부족 재료를 모아 체크 */
export function ShoppingList({ items, onRemove, onClear, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="장보기 리스트"
    >
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">장보기 리스트 <span className="text-sm font-semibold text-stone-400">{items.length}</span></h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-100">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            레시피 상세에서 "부족 재료 담기"를 누르면<br />여기에 살 재료가 모여요.
          </p>
        ) : (
          <>
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => onRemove(it.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-stone-50"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-stone-300 text-transparent">✓</span>
                    <span>{it.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={onClear} className="mt-4 text-xs text-stone-400 underline hover:text-stone-600">
              전체 비우기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
