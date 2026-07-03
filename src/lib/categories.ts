/** 카테고리별 라벨·이모지·색 (카드·상세·섹션에서 공용) */
export interface CategoryMeta {
  label: string;
  emoji: string;
  /** 칩 배경/글자 (연한 배경) */
  chip: string;
  /** 카드 좌측 강조선 색 */
  accent: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  meat: { label: "육류", emoji: "🥩", chip: "bg-rose-100 text-rose-700", accent: "bg-rose-400" },
  seafood: { label: "해산물", emoji: "🦐", chip: "bg-sky-100 text-sky-700", accent: "bg-sky-400" },
  egg: { label: "계란", emoji: "🍳", chip: "bg-amber-100 text-amber-700", accent: "bg-amber-400" },
  veg_side: { label: "채소반찬", emoji: "🥬", chip: "bg-lime-100 text-lime-700", accent: "bg-lime-400" },
  soup: { label: "국·찌개", emoji: "🍲", chip: "bg-orange-100 text-orange-700", accent: "bg-orange-400" },
  salad: { label: "샐러드", emoji: "🥗", chip: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-400" },
  snack: { label: "간식", emoji: "🍪", chip: "bg-violet-100 text-violet-700", accent: "bg-violet-400" },
};

export const categoryMeta = (category: string): CategoryMeta =>
  CATEGORIES[category] ?? { label: category, emoji: "🍽️", chip: "bg-stone-100 text-stone-600", accent: "bg-stone-300" };
