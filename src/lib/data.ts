export type Product = {
  id: string;
  slug: string;
  brand: string;
  title: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  price: number; // in USD base
  originalPrice: number;
  website: "Amazon" | "Flipkart" | "HealthKart" | "MuscleBlaze" | "Nykaa" | "iHerb";
  delivery: string;
  servingSize: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  calories: number;
  ingredients: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  warnings: string;
  country: string;
  manufacturer: string;
  labTested: boolean;
  certifications: string[];
  verified: boolean;
};

export const categories = [
  { name: "Protein", icon: "🥛", count: 128 },
  { name: "Whey", icon: "💪", count: 84 },
  { name: "Mass Gainers", icon: "🏋️", count: 42 },
  { name: "Creatine", icon: "⚡", count: 36 },
  { name: "Fish Oil", icon: "🐟", count: 28 },
  { name: "Multivitamins", icon: "💊", count: 96 },
  { name: "Pre Workout", icon: "🔥", count: 54 },
  { name: "BCAA", icon: "🧬", count: 32 },
  { name: "Healthy Snacks", icon: "🥜", count: 112 },
  { name: "Organic Foods", icon: "🌿", count: 88 },
  { name: "Kitchen", icon: "🍳", count: 64 },
  { name: "Electronics", icon: "🎧", count: 152 },
  { name: "Skincare", icon: "✨", count: 76 },
  { name: "Fitness Gear", icon: "🏃", count: 48 },
];

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

export const products: Product[] = [
  {
    id: "p1", slug: "optimum-gold-standard-whey", brand: "Optimum Nutrition",
    title: "Gold Standard 100% Whey Protein",
    category: "Whey", image: img("photo-1593095948071-474c5cc2989d"),
    rating: 4.8, reviews: 12480, price: 54.99, originalPrice: 69.99,
    website: "Amazon", delivery: "Free • 2 days",
    servingSize: "30g", protein: 24, carbs: 3, fat: 1, fiber: 0, sugar: 1, calories: 120,
    ingredients: ["Whey Protein Isolate", "Whey Concentrate", "Peptides", "Lecithin", "Natural Flavors"],
    pros: ["24g high-quality protein", "Low sugar", "Fast absorption", "Informed Choice tested"],
    cons: ["Contains artificial sweeteners", "Premium price"],
    bestFor: "Post-workout recovery, muscle building",
    warnings: "Not for those with dairy allergies",
    country: "USA", manufacturer: "Glanbia Performance Nutrition",
    labTested: true, certifications: ["Informed Choice", "GMP", "FSSAI"],
    verified: true,
  },
  {
    id: "p2", slug: "muscleblaze-biozyme", brand: "MuscleBlaze",
    title: "Biozyme Performance Whey",
    category: "Whey", image: img("photo-1579722821273-0f6c1b5d0d1c"),
    rating: 4.6, reviews: 8320, price: 47.5, originalPrice: 62.0,
    website: "HealthKart", delivery: "Free • 3 days",
    servingSize: "33g", protein: 25, carbs: 2.5, fat: 1.2, fiber: 0.5, sugar: 0.8, calories: 125,
    ingredients: ["Whey Isolate", "Whey Concentrate", "Digezyme", "Lactase"],
    pros: ["50% better absorption", "Digestive enzymes", "Value for money"],
    cons: ["Limited flavor options"],
    bestFor: "Athletes with lactose sensitivity",
    warnings: "Consult physician if pregnant",
    country: "India", manufacturer: "HealthKart",
    labTested: true, certifications: ["Labdoor", "FSSAI", "ISO 9001"],
    verified: true,
  },
  {
    id: "p3", slug: "myprotein-impact-whey", brand: "MyProtein",
    title: "Impact Whey Isolate",
    category: "Whey", image: img("photo-1544367567-0f2fcb009e0b"),
    rating: 4.5, reviews: 15200, price: 39.99, originalPrice: 55.0,
    website: "iHerb", delivery: "$5 • 5 days",
    servingSize: "25g", protein: 23, carbs: 1, fat: 0.3, fiber: 0, sugar: 0.5, calories: 93,
    ingredients: ["Whey Protein Isolate", "Emulsifier", "Natural Flavoring"],
    pros: ["Ultra-low fat", "23g protein per scoop", "60+ flavors"],
    cons: ["Ships from EU", "Longer delivery"],
    bestFor: "Cutting phase, lean muscle",
    warnings: "Contains milk",
    country: "UK", manufacturer: "The Hut Group",
    labTested: true, certifications: ["Informed Sport", "GMP"],
    verified: true,
  },
  {
    id: "p4", slug: "creatine-monohydrate-on", brand: "Optimum Nutrition",
    title: "Micronized Creatine Monohydrate",
    category: "Creatine", image: img("photo-1517836357463-d25dfeac3438"),
    rating: 4.9, reviews: 22100, price: 24.99, originalPrice: 32.0,
    website: "Amazon", delivery: "Free • 1 day",
    servingSize: "5g", protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, calories: 0,
    ingredients: ["Creatine Monohydrate (Creapure®)"],
    pros: ["Pure Creapure®", "Micronized", "Unflavored versatility"],
    cons: ["No taste masking"],
    bestFor: "Strength and power athletes",
    warnings: "Stay well hydrated",
    country: "USA", manufacturer: "Glanbia",
    labTested: true, certifications: ["Creapure®", "Informed Choice"],
    verified: true,
  },
  {
    id: "p5", slug: "now-omega-3", brand: "NOW Foods",
    title: "Omega-3 Fish Oil 1000mg",
    category: "Fish Oil", image: img("photo-1550572017-edd951b55104"),
    rating: 4.7, reviews: 9800, price: 18.5, originalPrice: 24.0,
    website: "iHerb", delivery: "$4 • 4 days",
    servingSize: "2 softgels", protein: 0, carbs: 0, fat: 2, fiber: 0, sugar: 0, calories: 20,
    ingredients: ["Fish Oil Concentrate", "EPA 180mg", "DHA 120mg", "Gelatin"],
    pros: ["Molecularly distilled", "Heavy metal tested", "Great value"],
    cons: ["Mild fishy aftertaste"],
    bestFor: "Heart & brain health",
    warnings: "Consult if on blood thinners",
    country: "USA", manufacturer: "NOW Foods",
    labTested: true, certifications: ["IFOS", "GMP", "USP"],
    verified: true,
  },
  {
    id: "p6", slug: "c4-preworkout", brand: "Cellucor",
    title: "C4 Original Pre-Workout",
    category: "Pre Workout", image: img("photo-1607853202273-797f1c22a38e"),
    rating: 4.4, reviews: 18500, price: 29.99, originalPrice: 39.99,
    website: "Amazon", delivery: "Free • 2 days",
    servingSize: "6g", protein: 0, carbs: 1, fat: 0, fiber: 0, sugar: 0, calories: 5,
    ingredients: ["Beta Alanine 1.6g", "Creatine Nitrate", "Caffeine 150mg", "Arginine AKG"],
    pros: ["Explosive energy", "Great flavors", "Trusted formula"],
    cons: ["Contains artificial colors", "Tingles from beta-alanine"],
    bestFor: "High-intensity training",
    warnings: "Not for caffeine sensitive",
    country: "USA", manufacturer: "Nutrabolt",
    labTested: true, certifications: ["GMP", "NSF"],
    verified: true,
  },
];

export const currencies = [
  { code: "INR", symbol: "₹", rate: 83.2 },
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "AED", symbol: "د.إ", rate: 3.67 },
  { code: "CAD", symbol: "C$", rate: 1.37 },
  { code: "AUD", symbol: "A$", rate: 1.52 },
  { code: "JPY", symbol: "¥", rate: 156 },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];
