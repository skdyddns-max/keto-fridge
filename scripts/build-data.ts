/**
 * build-data.ts — 데이터 검증 + computed 주입 파이프라인
 *
 * 원천(data/*.json)은 사람이 그램수/재료 id만 적는다. 이 스크립트가:
 *  1) 모든 레시피 재료가 ingredients.json에 존재하는지 검증 (없으면 빌드 실패)
 *  2) per-serving computed 자동 계산 (netCarb = Σ(carb−fiber)×g/100 ÷ servings)
 *  3) 키토 필터: 1인분 netCarb > 8 → keto:false 태깅 + 로그
 *  4) 중복 감지 (이름 / 재료조합)
 *  5) 카테고리 분포 리포트
 * 통과 시 src/data/*.gen.json 산출(앱은 이 파일만 import).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");
const OUT = join(ROOT, "src", "data");

const KETO_LIMIT_G = 8; // 1인분 순탄수 상한 (spec §2)

type Nutrition = { kcal: number; carbG: number; fiberG: number; fatG: number; proteinG: number };
type Ingredient = {
  id: string;
  name: string;
  aliases: string[];
  per100g: Nutrition;
  keto: "friendly" | "caution" | "avoid";
  pantry: boolean;
};
type RecipeIngredient = { id: string; name: string; grams: number };
type Computed = { kcal: number; netCarbG: number; fatG: number; proteinG: number };
type Recipe = {
  id: string;
  name: string;
  category: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  computed: Computed;
  keto?: boolean;
  hasAvoidIngredient?: boolean;
};

const read = <T>(f: string): T => JSON.parse(readFileSync(join(DATA, f), "utf-8")) as T;
const round1 = (n: number) => Math.round(n * 10) / 10;

const RED = (s: string) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s: string) => `\x1b[33m${s}\x1b[0m`;
const GRN = (s: string) => `\x1b[32m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;

function main() {
  const ingredients = read<Ingredient[]>("ingredients.json");
  const recipes = read<Recipe[]>("recipes.json");
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const errors: string[] = [];

  // --- 0. 재료 id 무결성 (ingredients.json 자체) ---
  const idSeen = new Set<string>();
  for (const ing of ingredients) {
    if (idSeen.has(ing.id)) errors.push(`ingredients.json 중복 id: ${ing.id}`);
    idSeen.add(ing.id);
  }

  // --- 1. 레시피 재료 존재 검증 + 3~5. 계산/중복/분포 준비 ---
  const recipeIdSeen = new Set<string>();
  const nameSig = new Map<string, string>(); // normalized name -> recipe id
  const comboSig = new Map<string, string>(); // ingredient-set -> recipe id
  const categoryCount = new Map<string, number>();
  const overLimit: { id: string; name: string; netCarbG: number }[] = [];
  let ketoTrue = 0;

  for (const r of recipes) {
    if (recipeIdSeen.has(r.id)) errors.push(`recipes.json 중복 레시피 id: ${r.id}`);
    recipeIdSeen.add(r.id);

    if (!r.servings || r.servings < 1) errors.push(`${r.id}: servings 값이 올바르지 않음 (${r.servings})`);
    const servings = r.servings || 1;

    // 1) 재료 존재 검증
    let missing = false;
    for (const ri of r.ingredients) {
      if (!byId.has(ri.id)) {
        errors.push(`${r.id} "${r.name}": 미등록 재료 id "${ri.id}" (${ri.name}) — ingredients.json에 추가 필요`);
        missing = true;
      }
    }
    if (missing) continue; // 계산 불가

    // 2) computed 계산 (per serving)
    let kcal = 0, netCarb = 0, fat = 0, protein = 0;
    let hasAvoid = false;
    for (const ri of r.ingredients) {
      const ing = byId.get(ri.id)!;
      const f = ri.grams / 100;
      const perIngNet = Math.max(0, ing.per100g.carbG - ing.per100g.fiberG); // 음수 방지
      kcal += ing.per100g.kcal * f;
      netCarb += perIngNet * f;
      fat += ing.per100g.fatG * f;
      protein += ing.per100g.proteinG * f;
      if (ing.keto === "avoid") hasAvoid = true;
    }
    r.computed = {
      kcal: round1(kcal / servings),
      netCarbG: round1(netCarb / servings),
      fatG: round1(fat / servings),
      proteinG: round1(protein / servings),
    };
    r.hasAvoidIngredient = hasAvoid;

    // 3) 키토 필터
    r.keto = r.computed.netCarbG <= KETO_LIMIT_G;
    if (r.keto) ketoTrue++;
    else overLimit.push({ id: r.id, name: r.name, netCarbG: r.computed.netCarbG });

    // 4) 중복 감지
    const nkey = r.name.replace(/\s+/g, "").toLowerCase();
    if (nameSig.has(nkey)) errors.push(`중복 이름: ${r.id} == ${nameSig.get(nkey)} ("${r.name}")`);
    else nameSig.set(nkey, r.id);
    const ckey = r.ingredients.map((x) => x.id).sort().join("+");
    if (comboSig.has(ckey)) errors.push(`중복 재료조합: ${r.id} ~ ${comboSig.get(ckey)} (${ckey})`);
    else comboSig.set(ckey, r.id);

    // 5) 카테고리 분포
    categoryCount.set(r.category, (categoryCount.get(r.category) || 0) + 1);
  }

  // ================= 리포트 =================
  console.log(`\n${GRN("■ build-data 검증 리포트")}`);
  console.log(`재료: ${ingredients.length}종  |  레시피: ${recipes.length}개`);

  console.log(`\n${GRN("[카테고리 분포]")}`);
  [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    const bar = "█".repeat(Math.round((n / recipes.length) * 40));
    console.log(`  ${c.padEnd(12)} ${String(n).padStart(3)}  ${DIM(bar)}`);
  });

  console.log(`\n${GRN("[키토 판정]")}`);
  console.log(`  keto 적합 (≤${KETO_LIMIT_G}g): ${GRN(String(ketoTrue))} / ${recipes.length}`);
  if (overLimit.length) {
    console.log(`  ${YEL(`한도 초과 → keto:false (${overLimit.length}개):`)}`);
    overLimit
      .sort((a, b) => b.netCarbG - a.netCarbG)
      .forEach((o) => console.log(`    ${YEL("•")} ${o.id} ${o.name} — 순탄수 ${o.netCarbG}g`));
  }

  const avoidCount = recipes.filter((r) => r.hasAvoidIngredient).length;
  if (avoidCount) console.log(`\n  ${YEL(`⚠ avoid 재료 포함 레시피: ${avoidCount}개 (UI 경고 배지 대상)`)}`);

  if (errors.length) {
    console.log(`\n${RED(`[에러 ${errors.length}건] — 빌드 실패, 산출물 미생성`)}`);
    errors.forEach((e) => console.log(`  ${RED("✗")} ${e}`));
    process.exit(1);
  }

  // ================= 산출 =================
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "ingredients.gen.json"), JSON.stringify(ingredients, null, 2) + "\n");
  writeFileSync(join(OUT, "recipes.gen.json"), JSON.stringify(recipes, null, 2) + "\n");
  console.log(`\n${GRN("✓ 검증 통과")} → src/data/ingredients.gen.json, recipes.gen.json 생성\n`);
}

main();
