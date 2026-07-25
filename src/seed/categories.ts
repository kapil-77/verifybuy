export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  parent?: string;
}

export const categories: Category[] = [
  { id: "cat-001", name: "Supplements", slug: "supplements", icon: "💪" },
  { id: "cat-002", name: "Whey Protein", slug: "whey-protein", parent: "Supplements", icon: "🥛" },
  { id: "cat-003", name: "Creatine", slug: "creatine", parent: "Supplements", icon: "⚡" },
  { id: "cat-004", name: "Mass Gainer", slug: "mass-gainer", parent: "Supplements", icon: "🏋️" },
  { id: "cat-005", name: "Fish Oil", slug: "fish-oil", parent: "Supplements", icon: "🐟" },
  { id: "cat-006", name: "Multivitamin", slug: "multivitamin", parent: "Supplements", icon: "💊" },
  { id: "cat-007", name: "Pre Workout", slug: "pre-workout", parent: "Supplements", icon: "🔥" },
  { id: "cat-008", name: "BCAA", slug: "bcaa", parent: "Supplements", icon: "🧬" },
  { id: "cat-009", name: "Protein Bar", slug: "protein-bar", parent: "Food", icon: "🍫" },
  { id: "cat-010", name: "Healthy Foods", slug: "healthy-foods", icon: "🥗" },
  { id: "cat-011", name: "Peanut Butter", slug: "peanut-butter", parent: "Healthy Foods", icon: "🥜" },
  { id: "cat-012", name: "Oats", slug: "oats", parent: "Healthy Foods", icon: "🌾" },
  { id: "cat-013", name: "Granola", slug: "granola", parent: "Healthy Foods", icon: "🥣" },
  { id: "cat-014", name: "Muesli", slug: "muesli", parent: "Healthy Foods", icon: "🥣" },
  { id: "cat-015", name: "Trail Mix", slug: "trail-mix", parent: "Healthy Foods", icon: "🥜" },
  { id: "cat-016", name: "Skincare", slug: "skincare", icon: "✨" },
  { id: "cat-017", name: "Face Wash", slug: "face-wash", parent: "Skincare", icon: "🫧" },
  { id: "cat-018", name: "Moisturizer", slug: "moisturizer", parent: "Skincare", icon: "🧴" },
  { id: "cat-019", name: "Serum", slug: "serum", parent: "Skincare", icon: "💧" },
  { id: "cat-020", name: "Sunscreen", slug: "sunscreen", parent: "Skincare", icon: "☀️" },
  { id: "cat-021", name: "Personal Care", slug: "personal-care", icon: "🧼" },
  { id: "cat-022", name: "Shampoo", slug: "shampoo", parent: "Personal Care", icon: "🧴" },
  { id: "cat-023", name: "Body Wash", slug: "body-wash", parent: "Personal Care", icon: "🚿" },
];