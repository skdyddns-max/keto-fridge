/** 카테고리별 라벨·이모지·색 (카드·상세·섹션에서 공용) */
export interface CategoryMeta {
  label: string;
  emoji: string;
  /** 칩 배경/글자 (연한 배경) */
  chip: string;
  /** 카드 좌측 강조선 색 */
  accent: string;
  /** 썸네일 타일 그라데이션 */
  tile: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  meat: { label: "육류", emoji: "🥩", chip: "bg-rose-100 text-rose-700", accent: "bg-rose-400", tile: "from-rose-100 to-rose-50" },
  seafood: { label: "해산물", emoji: "🦐", chip: "bg-sky-100 text-sky-700", accent: "bg-sky-400", tile: "from-sky-100 to-sky-50" },
  egg: { label: "계란", emoji: "🍳", chip: "bg-amber-100 text-amber-700", accent: "bg-amber-400", tile: "from-amber-100 to-amber-50" },
  veg_side: { label: "채소반찬", emoji: "🥬", chip: "bg-lime-100 text-lime-700", accent: "bg-lime-400", tile: "from-lime-100 to-lime-50" },
  soup: { label: "국·찌개", emoji: "🍲", chip: "bg-orange-100 text-orange-700", accent: "bg-orange-400", tile: "from-orange-100 to-orange-50" },
  salad: { label: "샐러드", emoji: "🥗", chip: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-400", tile: "from-emerald-100 to-emerald-50" },
  snack: { label: "간식", emoji: "🍪", chip: "bg-violet-100 text-violet-700", accent: "bg-violet-400", tile: "from-violet-100 to-violet-50" },
};

/** 타일·바로가기에 쓸 카테고리 순서 */
export const CATEGORY_ORDER = ["meat", "egg", "seafood", "veg_side", "soup", "salad", "snack"] as const;

export const categoryMeta = (category: string): CategoryMeta =>
  CATEGORIES[category] ?? { label: category, emoji: "🍽️", chip: "bg-stone-100 text-stone-600", accent: "bg-stone-300", tile: "from-stone-100 to-stone-50" };
