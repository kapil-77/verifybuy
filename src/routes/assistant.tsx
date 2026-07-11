import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Utensils, Droplets, Pill, StickyNote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateDietPlan, type DietPlan } from "@/lib/diet.functions";

export const Route = createFileRoute("/assistant")({ component: DietPlannerPage });

type FormState = {
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  gym: "none" | "strength" | "hypertrophy" | "endurance" | "mixed";
  gymDaysPerWeek: number;
  goal: "cut" | "maintain" | "bulk";
  diet: "none" | "veg" | "vegan" | "halal";
  allergies: string;
};

const DEFAULTS: FormState = {
  age: 28,
  sex: "male",
  heightCm: 178,
  weightKg: 78,
  activity: "moderate",
  gym: "hypertrophy",
  gymDaysPerWeek: 4,
  goal: "cut",
  diet: "none",
  allergies: "",
};

function DietPlannerPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useServerFn(generateDietPlan);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await run({ data: form });
      setPlan(result);
      toast.success("Your plan is ready");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate plan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-center mb-10">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Diet Planner
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Personalized Daily Nutrition</h1>
        <p className="mt-2 text-text-secondary">
          Get calorie targets, macro breakdown and a meal plan tailored to your body and training.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <form onSubmit={submit} className="card-soft p-6 space-y-4 h-fit">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input type="number" min={10} max={100} value={form.age}
                onChange={(e) => update("age", Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Sex">
              <select value={form.sex} onChange={(e) => update("sex", e.target.value as FormState["sex"])} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Height (cm)">
              <input type="number" value={form.heightCm} onChange={(e) => update("heightCm", Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" value={form.weightKg} onChange={(e) => update("weightKg", Number(e.target.value))} className={inputCls} />
            </Field>
          </div>

          <Field label="Activity level">
            <select value={form.activity} onChange={(e) => update("activity", e.target.value as FormState["activity"])} className={inputCls}>
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (1–3 days/wk)</option>
              <option value="moderate">Moderate (3–5 days/wk)</option>
              <option value="active">Active (6–7 days/wk)</option>
              <option value="very_active">Very active (physical job + training)</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gym focus">
              <select value={form.gym} onChange={(e) => update("gym", e.target.value as FormState["gym"])} className={inputCls}>
                <option value="none">None</option>
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="endurance">Endurance</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field label="Days / week">
              <input type="number" min={0} max={7} value={form.gymDaysPerWeek}
                onChange={(e) => update("gymDaysPerWeek", Number(e.target.value))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal">
              <select value={form.goal} onChange={(e) => update("goal", e.target.value as FormState["goal"])} className={inputCls}>
                <option value="cut">Cut (fat loss)</option>
                <option value="maintain">Maintain</option>
                <option value="bulk">Bulk (muscle gain)</option>
              </select>
            </Field>
            <Field label="Diet">
              <select value={form.diet} onChange={(e) => update("diet", e.target.value as FormState["diet"])} className={inputCls}>
                <option value="none">No preference</option>
                <option value="veg">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="halal">Halal</option>
              </select>
            </Field>
          </div>

          <Field label="Allergies / dislikes">
            <input type="text" placeholder="e.g. lactose, peanuts" value={form.allergies}
              onChange={(e) => update("allergies", e.target.value)} className={inputCls} />
          </Field>

          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-full gradient-primary text-white font-semibold shadow-glow hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <>Generate my plan <Sparkles className="h-4 w-4" /></>}
          </button>
        </form>

        <div>
          {plan ? <PlanView plan={plan} /> : <EmptyPlan />}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-text-secondary">{label}</div>
      {children}
    </label>
  );
}

function EmptyPlan() {
  return (
    <div className="card-soft p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Utensils className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Fill in your details</h3>
      <p className="mt-1 text-sm text-text-secondary">We'll calculate your targets and build a full-day meal plan.</p>
    </div>
  );
}

function PlanView({ plan }: { plan: DietPlan }) {
  const macros = [
    { label: "Calories", value: plan.targetKcal, unit: "kcal", color: "bg-primary" },
    { label: "Protein", value: plan.protein, unit: "g", color: "bg-success" },
    { label: "Carbs", value: plan.carbs, unit: "g", color: "bg-warning" },
    { label: "Fats", value: plan.fats, unit: "g", color: "bg-secondary" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="card-soft p-4">
            <div className="text-xs text-text-muted">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold">{m.value}<span className="text-sm text-text-muted ml-1">{m.unit}</span></div>
            <div className={`mt-2 h-1 rounded-full ${m.color}`} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plan.meals.map((m) => (
          <div key={m.name} className="card-soft p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-text-muted">{m.kcal} kcal</div>
            </div>
            <div className="mt-2 flex gap-3 text-xs text-text-secondary">
              <span>P {m.protein}g</span><span>C {m.carbs}g</span><span>F {m.fats}g</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-text-secondary list-disc pl-4">
              {m.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-soft p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Pill className="h-4 w-4 text-primary" /> Supplements</div>
          <ul className="mt-2 space-y-1 text-sm text-text-secondary list-disc pl-4">
            {plan.supplements.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="card-soft p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Droplets className="h-4 w-4 text-accent" /> Hydration</div>
          <p className="mt-2 text-sm text-text-secondary">{plan.hydration}</p>
        </div>
        <div className="card-soft p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="h-4 w-4 text-warning" /> Notes</div>
          <p className="mt-2 text-sm text-text-secondary">{plan.notes}</p>
        </div>
      </div>
    </motion.div>
  );
}
