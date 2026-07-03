import { useMemo } from "react";
import ingredientsRaw from "./data/ingredients.gen.json";
import recipesRaw from "./data/recipes.gen.json";
import { matchRecipes } from "./lib/match";
import type { Ingredient, Recipe } from "./lib/types";
import { useLocalStorage } from "./store/useLocalStorage";
import { IngredientInput } from "./components/IngredientInput";
import { RecipeCard } from "./components/RecipeCard";

const INGREDIENTS = ingredientsRaw as unknown as Ingredient[];
const RECIPES = recipesRaw as unknown as Recipe[];
const PANTRY_IDS = new Set(INGREDIENTS.filter((i) => i.pantry).map((i) => i.id));

const EXPLORE_LIMIT = 20;

export default function App() {
  const [owned, setOwned] = useLocalStorage<string[]>("kf.owned", []);
  const [assumePantry, setAssumePantry] = useLocalStorage<boolean>("kf.assumePantry", true);
  // 제외 재료는 Phase 2에서 설정 UI 추가 (엔진은 이미 지원)
  const [excluded] = useLocalStorage<string[]>("kf.excluded", []);

  const results = useMemo(
    () => matchRecipes(RECIPES, new Set(owned), new Set(excluded), { assumePantry, pantryIds: PANTRY_IDS }),
    [owned, excluded, assumePantry],
  );

  const cookNow = results.filter((r) => r.status === "cookNow");
  const almost = results.filter((r) => r.status === "almost");
  const explore = results.filter((r) => r.status === "explore").slice(0, EXPLORE_LIMIT);
  const hasInput = owned.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">키토 냉장고</h1>
        <p className="mt-1 text-sm text-stone-500">냉장고에 있는 재료로, 지금 만들 수 있는 키토 레시피</p>
      </header>

      <section className="mb-6">
        <IngredientInput
          ingredients={INGREDIENTS}
          owned={owned}
          onAdd={(id) => setOwned((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          onRemove={(id) => setOwned((prev) => prev.filter((x) => x !== id))}
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={assumePantry}
            onChange={(e) => setAssumePantry(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          기본 조미료(소금·기름·간장 등)는 있는 것으로 간주
        </label>
      </section>

      {!hasInput ? (
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
              <div className="space-y-3">{cookNow.map((r) => <RecipeCard key={r.recipe.id} result={r} />)}</div>
            )}
          </section>

          {almost.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-amber-700">
                거의 가능해요 <span className="text-sm font-semibold text-stone-400">{almost.length}</span>
              </h2>
              <div className="space-y-3">{almost.map((r) => <RecipeCard key={r.recipe.id} result={r} />)}</div>
            </section>
          )}

          {explore.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-stone-500">더 탐색하기 ({explore.length})</summary>
              <div className="mt-3 space-y-3">{explore.map((r) => <RecipeCard key={r.recipe.id} result={r} />)}</div>
            </details>
          )}
        </div>
      )}

      <footer className="mt-12 text-center text-[11px] text-stone-400">
        영양 정보는 식약처·USDA 기준 참고용입니다. 의학적 판단의 근거로 사용하지 마세요.
      </footer>
    </div>
  );
}
