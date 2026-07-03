import { useEffect, useMemo, useState } from "react";
import ingredientsRaw from "./data/ingredients.gen.json";
import recipesRaw from "./data/recipes.gen.json";
import { diversify, matchRecipes, type MatchResult } from "./lib/match";
import { CATEGORY_ORDER, categoryMeta } from "./lib/categories";
import type { Ingredient, Recipe } from "./lib/types";
import { getPhotos } from "./lib/photos";
import { useLocalStorage } from "./store/useLocalStorage";
import { localDateKey, makeEntry, type DayEntry } from "./lib/tracker";
import { recipeIdsWithPhotos } from "./lib/photos";
import { syncEnabled } from "./lib/supabase";
import type { SyncState } from "./lib/sync";
import { useSync } from "./store/useSync";
import { IngredientInput } from "./components/IngredientInput";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeDetail } from "./components/RecipeDetail";
import { DayTracker } from "./components/DayTracker";
import { ShoppingList, type ShoppingItem } from "./components/ShoppingList";
import { SyncPanel } from "./components/SyncPanel";

const INGREDIENTS = ingredientsRaw as unknown as Ingredient[];
const RECIPES = recipesRaw as unknown as Recipe[];
const PANTRY_IDS = new Set(INGREDIENTS.filter((i) => i.pantry).map((i) => i.id));
const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
// 자동완성 제안 대상: 레시피에 실제 등장하는 재료만 (막다른 선택 방지)
const USED_INGREDIENT_IDS = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)));
const SELECTABLE_INGREDIENTS = INGREDIENTS.filter((i) => USED_INGREDIENT_IDS.has(i.id));

/** 원터치 추가용 인기 재료 */
const POPULAR_IDS = ["pork_belly", "egg", "cabbage", "chicken_thigh", "tofu", "shrimp", "butter", "cheese_cheddar", "zucchini", "avocado"];

const EXPLORE_LIMIT = 20;
const BROWSE_LIMIT = 40;

/** 레시피를 카드 표시용 결과로 감싼다 (추천·카테고리 탐색용) */
const asResult = (recipe: Recipe): MatchResult => ({ recipe, status: "explore", missing: [], coverage: 0 });

/** 첫 화면 추천 — 카테고리별로 가장 간단한(주재료 적고 순탄수 낮은) 레시피 1개씩 */
const nonPantryCount = (r: Recipe) => r.ingredients.filter((i) => !PANTRY_IDS.has(i.id)).length;
const RECOMMENDED: Recipe[] = CATEGORY_ORDER.map(
  (c) =>
    RECIPES.filter((r) => r.keto && r.category === c).sort(
      (a, b) => nonPantryCount(a) - nonPantryCount(b) || a.computed.netCarbG - b.computed.netCarbG,
    )[0],
)
  .filter(Boolean)
  .slice(0, 6);

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
  const [photoIds, setPhotoIds] = useState<Set<string>>(new Set());
  const [photoThumbs, setPhotoThumbs] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const now = new Date();

  // 사진 있는 레시피 id + 첫 사진 썸네일(카드용) 로드. photoIds는 작으므로 부담 없음.
  const refreshPhotoIds = async () => {
    const ids = await recipeIdsWithPhotos().catch(() => new Set<string>());
    setPhotoIds(ids);
    setPhotoThumbs((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return {};
    });
    const thumbs: Record<string, string> = {};
    for (const id of ids) {
      const ps = await getPhotos(id).catch(() => []);
      if (ps[0]) thumbs[id] = URL.createObjectURL(ps[0].blob);
    }
    setPhotoThumbs(thumbs);
  };
  useEffect(() => {
    refreshPhotoIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const results = useMemo(
    () => matchRecipes(RECIPES, new Set(owned), new Set(excluded), { assumePantry, pantryIds: PANTRY_IDS }),
    [owned, excluded, assumePantry],
  );
  const catOk = (r: MatchResult) => !categoryFilter || r.recipe.category === categoryFilter;
  const base = favoritesOnly ? results.filter((r) => favoriteSet.has(r.recipe.id)) : results;
  const visible = base.filter(catOk);

  const cookNow = visible.filter((r) => r.status === "cookNow");
  const almost = visible.filter((r) => r.status === "almost");
  const explore = visible.filter((r) => r.status === "explore").slice(0, EXPLORE_LIMIT);
  const hasInput = owned.length > 0;

  // 재료 입력 전 카테고리만 선택한 경우: 그 카테고리 레시피 둘러보기
  const browse = useMemo(
    () =>
      !hasInput && !favoritesOnly && categoryFilter
        ? diversify(RECIPES.filter((r) => r.keto && r.category === categoryFilter), (r) => r.name).slice(0, BROWSE_LIMIT).map(asResult)
        : [],
    [hasInput, favoritesOnly, categoryFilter],
  );

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

  // 기기간 동기화 (Supabase 설정 시에만 활성). 로컬 상태 ↔ 원격 병합.
  const local: SyncState = { favorites, excluded, shopping, daylog: dayLog, updatedAt: 0 };
  const applyRemote = (s: SyncState) => {
    setFavorites(s.favorites);
    setExcluded(s.excluded);
    setShopping(s.shopping);
    setDayLog(s.daylog);
  };
  const sync = useSync({ local, applyRemote });

  const card = (r: MatchResult) => (
    <RecipeCard
      key={r.recipe.id}
      result={r}
      isFavorite={favoriteSet.has(r.recipe.id)}
      hasPhoto={photoIds.has(r.recipe.id)}
      thumbUrl={photoThumbs[r.recipe.id]}
      onClick={() => setSelected(r)}
    />
  );
  const grid = (rs: MatchResult[]) => <div className="grid gap-3 sm:grid-cols-2">{rs.map(card)}</div>;

  const categoryTiles = (
    <div className="mb-6">
      <p className="mb-2 text-sm font-bold text-stone-700">🍽️ 카테고리로 둘러보기</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {CATEGORY_ORDER.map((c) => {
          const m = categoryMeta(c);
          const active = categoryFilter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(active ? null : c)}
              className={`flex flex-col items-center gap-1 rounded-2xl border py-3 transition ${
                active ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200" : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-lg ${m.tile}`}>{m.emoji}</span>
              <span className="text-[11px] font-medium text-stone-600">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-600/20">
        {/* 장식용 반투명 원 */}
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <span className="text-3xl">🥑</span> 키토 냉장고
            </h1>
            <p className="mt-1.5 text-sm text-emerald-50/90">냉장고에 있는 재료로, 지금 만들 수 있는 키토 레시피</p>
          </div>
          <button
            type="button"
            onClick={() => setShowShopping(true)}
            className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label="장보기 리스트 열기"
          >
            🛒 장보기
            {shopping.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-amber-950">
                {shopping.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {syncEnabled && (
        <SyncPanel session={sync.session} status={sync.status} onSignIn={sync.signIn} onSignInPassword={sync.signInPassword} onSignOut={sync.signOut} />
      )}

      <DayTracker
        log={dayLog}
        now={now}
        onRemove={(at) => setDayLog((prev) => prev.filter((e) => e.at !== at))}
        onClear={() => setDayLog((prev) => prev.filter((e) => e.date !== localDateKey(now)))}
      />

      <section className="mb-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-stone-700">
          🧺 냉장고에 뭐가 있나요?
        </h2>
        <IngredientInput
          ingredients={SELECTABLE_INGREDIENTS}
          owned={owned}
          onAdd={(id) => setOwned((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          onRemove={(id) => setOwned((prev) => prev.filter((x) => x !== id))}
        />

        {/* 원터치 인기 재료 */}
        {(() => {
          const picks = POPULAR_IDS.filter((id) => !owned.includes(id));
          if (picks.length === 0) return null;
          return (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-medium text-stone-400">자주 쓰는 재료 톡 눌러 담기</p>
              <div className="flex flex-wrap gap-1.5">
                {picks.map((id) => {
                  const ing = INGREDIENT_BY_ID.get(id);
                  if (!ing) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOwned((prev) => [...prev, id])}
                      className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      + {ing.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-100 pt-3">
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
          🚫 제외 재료 설정 {excluded.length > 0 && <span className="text-rose-600">({excluded.length})</span>}
        </summary>
        <div className="mt-3">
          <p className="mb-2 text-xs text-stone-400">알레르기·비선호 재료가 든 레시피는 추천에서 빠져요.</p>
          <IngredientInput
            ingredients={SELECTABLE_INGREDIENTS}
            owned={excluded}
            onAdd={(id) => setExcluded((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            onRemove={(id) => setExcluded((prev) => prev.filter((x) => x !== id))}
            placeholder="제외할 재료 입력 (예: 우유, 땅콩)"
            tone="rose"
          />
        </div>
      </details>

      {categoryTiles}

      {!hasInput && !favoritesOnly && !categoryFilter ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-emerald-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm">✨</span>
              오늘의 초간단 추천
            </h2>
            {grid(RECOMMENDED.map(asResult))}
          </section>
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-center">
            <span className="text-2xl">🧊</span>
            <p className="mt-2 text-sm text-stone-500">
              냉장고 재료를 입력하면 <span className="font-bold text-emerald-600">{RECIPES.filter((r) => r.keto).length}</span>개 중 딱 맞는 레시피를 찾아드려요
            </p>
          </div>
        </div>
      ) : browse.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-700">
            <span>{categoryMeta(categoryFilter!).emoji}</span>
            {categoryMeta(categoryFilter!).label} 레시피
            <button type="button" onClick={() => setCategoryFilter(null)} className="ml-1 text-xs font-medium text-stone-400 underline hover:text-stone-600">
              전체 보기
            </button>
          </h2>
          {grid(browse)}
          {browse.length >= BROWSE_LIMIT && (
            <p className="mt-4 text-center text-xs text-stone-400">냉장고 재료를 입력하면 이 중 만들 수 있는 걸 골라드려요</p>
          )}
        </section>
      ) : (
        <div className="space-y-8">
          {categoryFilter && (
            <button type="button" onClick={() => setCategoryFilter(null)} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              {categoryMeta(categoryFilter).emoji} {categoryMeta(categoryFilter).label}만 보는 중 · 필터 해제 ✕
            </button>
          )}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-emerald-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm">🔥</span>
              지금 만들 수 있어요
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-600">{cookNow.length}</span>
            </h2>
            {cookNow.length === 0 ? (
              <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-stone-500">아직 없어요. 재료를 더 추가해보세요.</p>
            ) : (
              grid(cookNow)
            )}
          </section>

          {almost.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-sm">🛒</span>
                거의 가능해요
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">{almost.length}</span>
              </h2>
              {grid(almost)}
            </section>
          )}

          {explore.length > 0 && (
            <details>
              <summary className="cursor-pointer rounded-xl bg-white/60 px-4 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-white">
                🔍 더 탐색하기 ({explore.length})
              </summary>
              <div className="mt-3">{grid(explore)}</div>
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
          onPhotosChanged={refreshPhotoIds}
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

      {/* 사용법 안내 */}
      <section className="mt-12 rounded-3xl border border-stone-200/70 bg-white/70 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-700">💡 이렇게 사용하세요</h2>
        <ol className="space-y-3">
          {[
            { icon: "🧺", title: "재료 입력", desc: "냉장고에 있는 재료를 검색하거나 '자주 쓰는 재료'를 톡 눌러 담으세요." },
            { icon: "🔥", title: "레시피 확인", desc: "‘지금 만들 수 있어요’에 바로 요리 가능한 레시피가 뜹니다. 카드를 누르면 조리법·순탄수·매크로를 볼 수 있어요." },
            { icon: "🛒", title: "장보기", desc: "‘거의 가능해요’ 레시피는 상세에서 부족 재료를 장보기 리스트에 담을 수 있어요." },
            { icon: "📊", title: "하루 순탄수 관리", desc: "먹은 레시피를 ‘오늘 먹었어요’로 기록하면 하루 순탄수(20g 이하)를 자동으로 합산해줘요." },
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg ring-1 ring-emerald-100">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-700">
                  <span className="mr-1.5 text-emerald-600">{i + 1}.</span>{s.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 rounded-xl bg-emerald-50/60 px-4 py-3 text-xs leading-relaxed text-emerald-800/80">
          <strong className="font-semibold">키토 기준</strong> · 순탄수 = 총탄수 − 식이섬유. 1인분 순탄수 8g 이하 레시피만 추천하며, 하루 총 20g 이하를 권장합니다.
          즐겨찾기·기록은 이 브라우저에 저장돼요.
        </div>
      </section>

      <footer className="mt-8 text-center text-[11px] text-stone-400">
        영양 정보는 식약처·USDA 기준 참고용입니다. 의학적 판단의 근거로 사용하지 마세요.
      </footer>
    </div>
  );
}
