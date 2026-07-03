import { useMemo, useState } from "react";
import ingredientsRaw from "./data/ingredients.gen.json";
import recipesRaw from "./data/recipes.gen.json";
import { matchRecipes, type MatchResult } from "./lib/match";
import type { Ingredient, Recipe } from "./lib/types";
import { useLocalStorage } from "./store/useLocalStorage";
import { localDateKey, makeEntry, type DayEntry } from "./lib/tracker";
import { IngredientInput } from "./components/IngredientInput";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeDetail } from "./components/RecipeDetail";
import { DayTracker } from "./components/DayTracker";
import { ShoppingList, type ShoppingItem } from "./components/ShoppingList";

const INGREDIENTS = ingredientsRaw as unknown as Ingredient[];
const RECIPES = recipesRaw as unknown as Recipe[];
const PANTRY_IDS = new Set(INGREDIENTS.filter((i) => i.pantry).map((i) => i.id));

const EXPLORE_LIMIT = 20;

export default function App() {
  const [owned, setOwned] = useLocalStorage<string[]>("kf.owned", []);
  const [excluded, setExcluded] = useLocalStorage<string[]>("kf.excluded", []);
  const [favorites, setFavorites] = useLocalStorage<string[]>("kf.favorites", []);
  const [assumePantry, setAssumePantry] = useLocalStorage<boolean>("kf.assumePantry", true);
  const [dayLog, setDayLog] = useLocalStorage<DayEntry[]>("kf.daylog", []);
  const [shopping, setShopping] = useLocalStorage<ShoppingItem[]>("kf.shopping", []);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<MatchResult | null>(null);
  const [showShopping, setShowShopping] = useState(false);
  const now = new Date();

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const results = useMemo(
    () => matchRecipes(RECIPES, new Set(owned), new Set(excluded), { assumePantry, pantryIds: PANTRY_IDS }),
    [owned, excluded, assumePantry],
  );
  const visible = favoritesOnly ? results.filter((r) => favoriteSet.has(r.recipe.id)) : results;

  const cookNow = visible.filter((r) => r.status === "cookNow");
  const almost = visible.filter((r) => r.status === "almost");
  const explore = visible.filter((r) => r.status === "explore").slice(0, EXPLORE_LIMIT);
  const hasInput = owned.length > 0;

  const effectiveOwned = useMemo(() => {
    const s = new Set(owned);
    if (assumePantry) for (const id of PANTRY_IDS) s.add(id);
    return s;
  }, [owned, assumePantry]);

  const toggleFavorite = (recipeId: string) =>
    setFavorites((prev) => (prev.includes(recipeId) ? prev.filter((x) => x !== recipeId) : [...prev, recipeId]));

  const eatRecipe = (r: Recipe) => setDayLog((prev) => [...prev, makeEntry(r, new Date())]);
  const addShopping = (items: ShoppingItem[]) =>
    setShopping((prev) => {
      const seen = new Set(prev.map((x) => x.id));
      return [...prev, ...items.filter((x) => !seen.has(x.id))];
    });

  const card = (r: MatchResult) => (
    <RecipeCard key={r.recipe.id} result={r} isFavorite={favoriteSet.has(r.recipe.id)} onClick={() => setSelected(r)} />
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">키토 냉장고</h1>
          <p className="mt-1 text-sm text-stone-500">냉장고에 있는 재료로, 지금 만들 수 있는 키토 레시피</p>
        </div>
        <button
          type="button"
          onClick={() => setShowShopping(true)}
          className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          aria-label="장보기 리스트 열기"
        >
          🛒 장보기
          {shopping.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
              {shopping.length}
            </span>
          )}
        </button>
      </header>

      <DayTracker
        log={dayLog}
        now={now}
        onRemove={(at) => setDayLog((prev) => prev.filter((e) => e.at !== at))}
        onClear={() => setDayLog((prev) => prev.filter((e) => e.date !== localDateKey(now)))}
      />

      <section className="mb-4">
        <IngredientInput
          ingredients={INGREDIENTS}
          owned={owned}
          onAdd={(id) => setOwned((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          onRemove={(id) => setOwned((prev) => prev.filter((x) => x !== id))}
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={assumePantry}
              onChange={(e) => setAssumePantry(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            기본 조미료(소금·기름·간장 등)는 있는 것으로 간주
          </label>
          {favorites.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <span className="text-amber-600">★</span> 즐겨찾기만 ({favorites.length})
            </label>
          )}
        </div>
      </section>

      <details className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-3" open={excluded.length > 0}>
        <summary className="cursor-pointer text-sm font-medium text-stone-600">
          제외 재료 설정 {excluded.length > 0 && <span className="text-rose-600">({excluded.length})</span>}
        </summary>
        <div className="mt-3">
          <p className="mb-2 text-xs text-stone-400">알레르기·비선호 재료가 든 레시피는 추천에서 빠져요.</p>
          <IngredientInput
            ingredients={INGREDIENTS}
            owned={excluded}
            onAdd={(id) => setExcluded((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            onRemove={(id) => setExcluded((prev) => prev.filter((x) => x !== id))}
            placeholder="제외할 재료 입력 (예: 우유, 땅콩)"
            tone="rose"
          />
        </div>
      </details>

      {!hasInput && !favoritesOnly ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          <p className="font-medium">재료를 입력하면 레시피를 찾아드려요</p>
          <p className="mt-1 text-sm">키토 적합 레시피 {RECIPES.filter((r) => r.keto).length}개 준비되어 있어요</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold text-emerald-700">
              지금 만들 수 있어요 <span className="text-sm font-semibold text-stone-400">{cookNow.length}</span>
            </h2>
            {cookNow.length === 0 ? (
              <p className="text-sm text-stone-500">아직 없어요. 재료를 더 추가해보세요.</p>
            ) : (
              <div className="space-y-3">{cookNow.map(card)}</div>
            )}
          </section>

          {almost.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-amber-700">
                거의 가능해요 <span className="text-sm font-semibold text-stone-400">{almost.length}</span>
              </h2>
              <div className="space-y-3">{almost.map(card)}</div>
            </section>
          )}

          {explore.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-stone-500">더 탐색하기 ({explore.length})</summary>
              <div className="mt-3 space-y-3">{explore.map(card)}</div>
            </details>
          )}
        </div>
      )}

      {selected && (
        <RecipeDetail
          result={selected}
          effectiveOwned={effectiveOwned}
          isFavorite={favoriteSet.has(selected.recipe.id)}
          onToggleFavorite={() => toggleFavorite(selected.recipe.id)}
          onEat={() => eatRecipe(selected.recipe)}
          onAddShopping={addShopping}
          onClose={() => setSelected(null)}
        />
      )}

      {showShopping && (
        <ShoppingList
          items={shopping}
          onRemove={(id) => setShopping((prev) => prev.filter((x) => x.id !== id))}
          onClear={() => setShopping([])}
          onClose={() => setShowShopping(false)}
        />
      )}

      <footer className="mt-12 text-center text-[11px] text-stone-400">
        영양 정보는 식약처·USDA 기준 참고용입니다. 의학적 판단의 근거로 사용하지 마세요.
      </footer>
    </div>
  );
}
