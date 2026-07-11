## 1. ElevenLabs agent — refined prompt + tool contract

Rewrite the pasted prompt into a clean system prompt tailored to VeriFy (verified product comparison + diet planner). Give it a strict tool-first policy: whenever the user asks to go somewhere, filter, compare, or open a product, call a tool — don't just describe it.

**Client tools exposed by `VoiceAssistant.tsx` (expanded set):**
| Tool | Params | Effect |
|---|---|---|
| `navigateTo` | `page` (home/categories/compare/assistant/rewards) | `router.navigate` |
| `searchCategory` | `query` | `/categories?q=…` |
| `openProduct` | `slug` | `/product/$slug` |
| `addToCompare` | `slug` | push into compare store |
| `removeFromCompare` | `slug` | remove from compare store |
| `clearCompare` | — | clear store |
| `openCompare` | — | navigate `/compare` |
| `scrollToSection` | `id` | `document.getElementById(id).scrollIntoView` |
| `toggleTheme` | — | `useTheme().toggle()` |
| `openDietPlanner` | — | navigate `/assistant` |

The final refined prompt text will be delivered in chat so you can paste it into ElevenLabs → Agent → System prompt, and each tool above must be created in ElevenLabs → Tools with matching name + JSON param schema.

## 2. Remove About

- Delete `src/routes/about.tsx`
- Remove About link from `Navbar.tsx` and `Footer.tsx`
- Remove `about` entry from `VoiceAssistant.tsx` route map
- Remove any `<Link to="/about">` references app-wide

## 3. Replace `/assistant` with AI Diet Planner

New page `src/routes/assistant.tsx` (renamed conceptually to "Diet Planner", route path stays `/assistant` so nav + voice tool keep working; nav label becomes "Diet Planner").

**Form fields:** age, sex, height (cm), weight (kg), activity level (sedentary → very active), gym routine (none/strength/hypertrophy/endurance/mixed + days/week), goal (cut/maintain/bulk), dietary preference (none/veg/vegan/halal), allergies (free text).

**Flow:**
1. Client computes baseline via Mifflin–St Jeor + activity multiplier → shows target kcal instantly.
2. On "Generate plan" → calls new server function `generateDietPlan` (`src/lib/diet.functions.ts`) which uses Lovable AI Gateway (`google/gemini-3-flash-preview`) with `generateText` + `Output.object` (schema kept flat: totals, macro grams, 4 meals with name/kcal/protein/carbs/fats/items[], hydration note, supplement suggestions[]). Prompt states counts/limits; schema stays constraint-free; call is guarded with `NoObjectGeneratedError` fallback.
3. Result rendered as cards: macro ring (kcal/P/C/F), meal cards, supplements, hydration tip. Loading + error toasts.

**Backend wiring:**
- Add `src/lib/ai-gateway.server.ts` with `createLovableAiGatewayProvider` helper (per knowledge).
- Ensure `LOVABLE_API_KEY` exists via `ai_gateway--create`.
- Server function reads `process.env.LOVABLE_API_KEY` inside `.handler()`.

## 4. White-button contrast fix

Audit buttons with white/light backgrounds (hero CTAs, category chips, "Try:" suggestions, product card buttons, CompareBar buttons). Apply:
- `text-primary` → replace with `text-[hsl(var(--primary))] font-semibold` (bolder dark blue)
- Add utility `.btn-on-light { @apply text-primary font-semibold; }` in `styles.css` and swap classes where offending
- Verify dark-mode variant still readable (uses existing dark tokens)

## 5. Verify

- `tsgo` typecheck
- Playwright: load `/`, click Diet Planner nav, submit form, screenshot result; click Compare bar; toggle theme; ensure About 404s.

### Technical notes
- Voice tools live in `useConversation({ clientTools })`; expanding just adds keys — no ElevenLabs SDK change.
- Compare store is `src/lib/store.ts` (zustand-style) — reuse its actions in new tools.
- Route path `/assistant` preserved to avoid breaking existing links/voice map; only nav label + page contents change.
- Nav "About" removal + link audits are mechanical string edits.
