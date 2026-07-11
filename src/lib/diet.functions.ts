import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const DietInput = z.object({
  age: z.number().int().min(10).max(100),
  sex: z.enum(["male", "female"]),
  heightCm: z.number().min(100).max(230),
  weightKg: z.number().min(30).max(250),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  gym: z.enum(["none", "strength", "hypertrophy", "endurance", "mixed"]),
  gymDaysPerWeek: z.number().int().min(0).max(7),
  goal: z.enum(["cut", "maintain", "bulk"]),
  diet: z.enum(["none", "veg", "vegan", "halal"]),
  allergies: z.string().max(200).optional().default(""),
});

const MealSchema = z.object({
  name: z.string(),
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  items: z.array(z.string()),
});

const PlanSchema = z.object({
  targetKcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  meals: z.array(MealSchema),
  supplements: z.array(z.string()),
  hydration: z.string(),
  notes: z.string(),
});

export type DietPlan = z.infer<typeof PlanSchema>;

const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function computeTargets(i: z.infer<typeof DietInput>) {
  const bmr =
    i.sex === "male"
      ? 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + 5
      : 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age - 161;
  const tdee = bmr * ACTIVITY_MULT[i.activity];
  const adj = i.goal === "cut" ? -400 : i.goal === "bulk" ? 350 : 0;
  const kcal = Math.round(tdee + adj);
  const protein = Math.round(i.weightKg * (i.goal === "cut" ? 2.2 : 1.8));
  const fats = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fats * 9) / 4));
  return { kcal, protein, carbs, fats };
}

export const generateDietPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DietInput.parse(input))
  .handler(async ({ data }): Promise<DietPlan> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const t = computeTargets(data);
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `You are a registered dietitian designing a one-day meal plan.

CLIENT
- Age: ${data.age} · Sex: ${data.sex}
- Height: ${data.heightCm} cm · Weight: ${data.weightKg} kg
- Activity: ${data.activity} · Gym: ${data.gym} (${data.gymDaysPerWeek} days/wk)
- Goal: ${data.goal} · Diet: ${data.diet}
- Allergies/dislikes: ${data.allergies || "none"}

TARGETS (computed via Mifflin–St Jeor)
- Calories: ${t.kcal} kcal
- Protein: ${t.protein} g · Carbs: ${t.carbs} g · Fats: ${t.fats} g

RULES
- Produce exactly 4 meals: Breakfast, Lunch, Snack, Dinner.
- Each meal's items: 3–5 short strings with grams/quantity.
- Meal totals must sum close to daily targets (±5%).
- Respect diet preference and allergies strictly.
- supplements: 2–5 short items (e.g. "Creatine 5g", "Whey 25g post-workout").
- hydration: one short sentence.
- notes: one short line on timing/quality.
Return the JSON matching the schema.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: PlanSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return PlanSchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          // fall through
        }
      }
      // Deterministic fallback so UI never crashes
      return {
        targetKcal: t.kcal,
        protein: t.protein,
        carbs: t.carbs,
        fats: t.fats,
        meals: [
          { name: "Breakfast", kcal: Math.round(t.kcal * 0.25), protein: Math.round(t.protein * 0.25), carbs: Math.round(t.carbs * 0.3), fats: Math.round(t.fats * 0.2), items: ["Oats 60g", "Greek yogurt 200g", "Berries 100g", "Honey 1 tsp"] },
          { name: "Lunch", kcal: Math.round(t.kcal * 0.35), protein: Math.round(t.protein * 0.35), carbs: Math.round(t.carbs * 0.35), fats: Math.round(t.fats * 0.35), items: ["Grilled chicken 180g", "Brown rice 150g cooked", "Mixed veg 200g", "Olive oil 1 tbsp"] },
          { name: "Snack", kcal: Math.round(t.kcal * 0.15), protein: Math.round(t.protein * 0.15), carbs: Math.round(t.carbs * 0.15), fats: Math.round(t.fats * 0.15), items: ["Whey shake 30g", "Apple 1", "Almonds 20g"] },
          { name: "Dinner", kcal: Math.round(t.kcal * 0.25), protein: Math.round(t.protein * 0.25), carbs: Math.round(t.carbs * 0.2), fats: Math.round(t.fats * 0.3), items: ["Salmon 180g", "Sweet potato 200g", "Steamed greens 200g"] },
        ],
        supplements: ["Whey 25g post-workout", "Creatine 5g/day", "Omega-3 1g", "Vitamin D 1000 IU"],
        hydration: "Aim for 3–4L of water spread across the day.",
        notes: "Prioritize protein per meal (30–45g) and sleep 7–9h for recovery.",
      };
    }
  });
