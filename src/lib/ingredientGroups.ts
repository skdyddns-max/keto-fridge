import type { Ingredient } from "./types";

/** 재료를 냉장고 그리드용 그룹으로 분류 */
export interface Group {
  key: string;
  label: string;
  emoji: string;
}

export const GROUP_ORDER: Group[] = [
  { key: "meat", label: "육류", emoji: "🥩" },
  { key: "egg", label: "계란", emoji: "🍳" },
  { key: "seafood", label: "해산물", emoji: "🦐" },
  { key: "dairy", label: "유제품", emoji: "🧀" },
  { key: "veg", label: "채소·버섯", emoji: "🥬" },
  { key: "tofu", label: "두부·곤약", emoji: "🍢" },
  { key: "nuts", label: "견과·씨앗", emoji: "🥜" },
  { key: "fruit", label: "과일", emoji: "🍓" },
  { key: "etc", label: "기타", emoji: "🍽️" },
];

const SEAFOOD = new Set(["shrimp","squid","octopus","mackerel","salmon","tuna_can","pollock","cod","mackerel_pike","clam","mussel","crab","pollock_roe","shrimp_dried","anchovy_dried","gim","kelp_dried","wakame","fish_cake","crab_stick","oyster","scallop","abalone","eel"]);
const DAIRY = new Set(["butter","ghee","heavy_cream","sour_cream","mascarpone","greek_yogurt","cottage_cheese","milk"]);
const TOFU = new Set(["tofu","soft_tofu","fried_tofu","konjac"]);
const FRUIT = new Set(["lemon","lime","blueberry","strawberry","raspberry","coconut_meat"]);
const NUTS = new Set(["almond","walnut","macadamia","pecan","peanut","pine_nut","chia_seed","flaxseed","pumpkin_seed","sunflower_seed","almond_flour","coconut_flour","psyllium","peanut_butter","hemp_seed","almond_butter","cacao_nibs","sesame","perilla_seed"]);
const MEAT_EXTRA = new Set(["duck","lamb","sausage","ham_deli","spam","pepperoni","bacon"]);
const EGG = new Set(["egg","egg_yolk","egg_white","quail_egg"]);
const VEG = new Set(["cabbage","napa_cabbage","spinach","lettuce","perilla_leaf","zucchini","cucumber","broccoli","cauliflower","bell_pepper","chili_green","onion","green_onion","chives","radish","bean_sprout","mung_sprout","tomato","cherry_tomato","eggplant","kimchi","avocado","olive","asparagus","celery","kale","bok_choy","water_dropwort","jalapeno","leek","carrot","pumpkin"]);

export function groupOf(i: Ingredient): string {
  const id = i.id;
  if (/^(pork|beef|chicken)/.test(id) || MEAT_EXTRA.has(id)) return "meat";
  if (EGG.has(id)) return "egg";
  if (SEAFOOD.has(id)) return "seafood";
  if (id.startsWith("cheese") || DAIRY.has(id)) return "dairy";
  if (TOFU.has(id)) return "tofu";
  if (id.startsWith("mushroom") || VEG.has(id)) return "veg";
  if (NUTS.has(id)) return "nuts";
  if (FRUIT.has(id)) return "fruit";
  return "etc";
}
