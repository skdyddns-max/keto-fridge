import ingredientsRaw from "../data/ingredients.gen.json";
import type { Ingredient } from "./types";

const PANTRY_IDS = new Set((ingredientsRaw as unknown as Ingredient[]).filter((i) => i.pantry).map((i) => i.id));

/** 조미료(기본 보유 간주) 재료인지 */
export const isPantry = (id: string): boolean => PANTRY_IDS.has(id);
