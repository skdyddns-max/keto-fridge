export interface Nutrition {
  kcal: number;
  carbG: number;
  fiberG: number;
  fatG: number;
  proteinG: number;
}

export type KetoGrade = "friendly" | "caution" | "avoid";

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  per100g: Nutrition;
  keto: KetoGrade;
  pantry: boolean;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  grams: number;
}

export interface Computed {
  kcal: number;
  netCarbG: number;
  fatG: number;
  proteinG: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  computed: Computed;
  keto: boolean;
  hasAvoidIngredient: boolean;
}
