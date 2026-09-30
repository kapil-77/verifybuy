<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/VeriFy-8B5CF6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwyIDd2NkMwIDE3LjUgNyAyMiAxMiAyMkMxNyAyMiAyNCAxNy41IDI0IDEzVjdMMTIgMloiIGZpbGw9IiM4QjVDRjYiLz48cGF0aCBkPSJNOSAxMi41TDEwLjUgMTRMMTUgOSIvc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=">
  </picture>
</p>

<h1 align="center">VeriFy</h1>

<p align="center">
  <strong>Compare, Verify & Buy Smarter Across Every Store</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/Features-✧-8B5CF6?style=flat-square" alt="Features"/></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Stack-React_TanStack_Tailwind-2563EB?style=flat-square" alt="Stack"/></a>
  <a href="https://github.com/kapil-77/verifybuy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=flat-square" alt="License"/></a>
  <a href="#deployment"><img src="https://img.shields.io/badge/Deploy-Cloudflare-F38020?style=flat-square" alt="Deploy"/></a>
  <img src="https://img.shields.io/badge/Build-Passing-22C55E?style=flat-square" alt="Build"/>
</p>

<br/>

<div align="center">
  
  🛒 **Product Comparison** · 🔬 **Authenticity Verification** · 🤖 **AI Diet Planner** · 🎙️ **Voice Assistant**
  
</div>

---

## 📋 Table of Contents

- [Why VeriFy?](#-why-verify)
- [What Makes It Different](#-what-makes-it-different)
- [Challenges Solved](#-challenges-solved)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Routes](#-api-routes)
- [AI Capabilities](#-ai-capabilities)
- [RAG-Powered Product Research](#-rag-powered-product-research)
- [Authentication](#-authentication)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## ✧ Why VeriFy?

Online shopping today is fragmented. A protein powder on Amazon has different pricing, ingredients, and certifications than the same category on HealthKart or iHerb — and there's no single place to compare them all.

**VeriFy** solves this by aggregating products across multiple e-commerce platforms into one unified comparison engine. It doesn't just show prices — it breaks down ingredients, flags artificial additives, displays lab-test certifications, and even scores products on health, clean-label, and value metrics.

The result? Shoppers make informed decisions without tab-hopping between six websites.

---

## ✧ What Makes It Different

| Capability | VeriFy | Traditional Price Comparators |
|---|---|---|
| Cross-store product comparison | ✅ Side-by-side with nutrition & ingredients | ❌ Price-only |
| Authenticity & lab report verification | ✅ Downloadable certificates & badges | ❌ Not available |
| AI-powered diet planner | ✅ Personalized meal plans via Gemini | ❌ Not available |
| Voice-controlled navigation | ✅ ElevenLabs conversational AI | ❌ Not available |
| Ingredient-level comparison matrix | ✅ Yes | ❌ No |
| Health, clean-label & value scores | ✅ Triple scoring system | ❌ Ratings only |
| Dark mode / multi-currency | ✅ Both | ❌ Rarely |

---

## ✧ Challenges Solved

**1. SSR Stability on Edge**
Server-side rendering with TanStack Start on Cloudflare Workers presented unique challenges — h3 swallows thrown errors into generic 500 responses. We built a custom error-capture layer (`error-capture.ts`) that hooks into `unhandledrejection` and `error` events, coupled with a response-normalization middleware in `server.ts` that detects swallowed "HTTPError" JSON bodies and returns a proper HTML error page instead.

**2. Real-Time Voice Integration in SPA**
Integrating ElevenLabs Conversational AI into a single-page app required careful lifecycle management — establishing WebRTC audio streams, handling mic permissions gracefully across browsers, and wiring client-side tools (`navigateTo`, `addToCompare`, `toggleTheme`) so the voice assistant can manipulate the app state in real time.

**3. AI Plan Generation with Graceful Fallback**
The diet planner uses Gemini to generate structured meal plans via the Vercel AI SDK. If the model fails to produce valid JSON (or the API is unreachable), the system falls back to a deterministic plan computed from Mifflin–St Jeor equations — ensuring the UI never crashes and the user always gets actionable data.

**4. Routing Without Next.js Conventions**
TanStack Start uses file-based routing but with different conventions than Next.js or Remix. We documented the routing rules in `src/routes/README.md` to prevent confusion between `$param`, `_layout`, `splat`, and `__root` patterns.

---

## ✧ Future Work To Do

**1. Products Scrapping pipeline**

🔄 Integrate a robust scraping pipeline to fetch real-time product prices, availability, ratings, and specifications from trusted e-commerce platforms.

**2. Purchase Tracking**

💰 Implement a purchase tracking functionlity to verify successful purchases originating from VerifyBuy and enable reward points, cashback, or referral commissions.


## ✧ Features

### 🔍 Cross-Store Product Comparison
- Select up to 4 products and view them side-by-side
- Compare **Overview**, **Ingredients**, **Pros & Cons**, and **Nutrition** in tabbed views
- Automatic "Best" highlighting for lowest price, highest rating, or best macros
- Persistent compare bar floating at the bottom of every page

### 🔬 Authenticity & Lab Verification
- Every product displays manufacturer, country of origin, and certifications (FSSAI, GMP, ISO, etc.)
- Downloadable lab report buttons on certification badges
- Verified badge for authenticated products

### 🤖 AI Diet Planner
- Forms-based input for age, sex, height, weight, activity level, gym focus, and dietary preferences
- Generates a full-day, 4-meal plan with calorie targets and macronutrient breakdown
- Powered by Google Gemini via the Vercel AI SDK with deterministic fallback
- Supports vegetarian, vegan, and halal preferences

### 🎙️ Voice Assistant
- Conversational AI interface using ElevenLabs Conversational AI
- Navigate pages, add/remove products from comparison, open categories, toggle theme
- Real-time transcription and status indicators
- Graceful error handling for mic permissions and missing hardware

### 💰 Rewards & Gamification
- Earn **coins** for "Buy Now" actions and **points** for confirmed purchases
- Tier system (Bronze → Silver → Gold → Platinum) with increasing perks
- Activity history tracking
- Progress bar toward next tier

### 🎨 UI/UX
- Fully responsive design (mobile → desktop)
- Dark/light theme with system-preference detection and zero-flash hydration
- Multi-currency support (USD, INR, EUR, GBP, AED, CAD, AUD, JPY)
- Animated starfield background on the hero section
- Smooth page transitions with Framer Motion
- Toast notifications for all user actions

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Meta-Framework** | [TanStack Start](https://tanstack.com/start/latest) (SSR) |
| **Routing** | [TanStack Router](https://tanstack.com/router/latest) (file-based) |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query/latest) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + `tw-animate-css` |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) with persistence |
| **AI SDK** | [Vercel AI SDK v7](https://sdk.vercel.ai/) + `@ai-sdk/openai-compatible` |
| **Voice AI** | [ElevenLabs Conversational AI](https://elevenlabs.io/) |
| **Auth** | [Firebase Auth](https://firebase.google.com/products/auth) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Build Tool** | [Vite v8](https://vitejs.dev/) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) (via Nitro) |
| **Linting** | ESLint + Prettier + TypeScript-ESLint |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        A[React SPA]
        B[Zustand Store]
        C[TanStack Query Cache]
        D[ElevenLabs Voice Client]
    end

    subgraph Server["Cloudflare Worker"]
        E[TanStack Start SSR]
        F[File-based Router]
        G[Server Functions]
        H[Nitro Adapter]
        
        subgraph Middleware["Error Middleware"]
            I[error-capture.ts]
            J[server.ts SSR wrapper]
        end
    end

    subgraph Services["External Services"]
        K[Firebase Auth]
        L[Google Gemini API]
        M[ElevenLabs API]
    end

    A --> E
    C --> E
    D --> M
    G --> L
    F --> E
    E --> H
    H --> K
    E --> I
    I --> J
    B --> A
    C --> A
```

**Data Flow:**
1. Client renders via TanStack Start SSR — initial HTML is server-rendered
2. Client-side navigation uses TanStack Router with preloaded route data
3. Server Functions (`createServerFn`) handle AI calls, auth verification, and API proxying
4. Zustand persists user preferences (currency, theme, compare list, wishlist) to localStorage
5. Voice assistant establishes WebRTC connection to ElevenLabs; client-side tools manipulate app state directly

---

## 📁 Project Structure

```
├── public/
│   └── images/                     # Static assets (brands, products, certifications)
│
├── src/
│   ├── components/
│   │   ├── auth/                   # AuthCard, AuthModal, EmailForm, SocialButton
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── product/                # ProductCard
│   │   ├── profile/                # ActivityTimeline
│   │   ├── rag/                    # ResearchPanel — RAG trigger on product pages
│   │   └── ui/                     # 40+ Radix/shadcn UI components
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx             # Firebase auth context & provider
│   │   ├── useTheme.tsx            # Dark/light theme with hydration-safe bootstrap
│   │   ├── use-mobile.tsx          # Responsive breakpoint detection
│   │   └── useScrolled.ts          # Scroll position hook for navbar
│   │
│   ├── lib/
│   │   ├── activity.ts             # Activity tracking types & factory
│   │   ├── api.ts                  # Backend API client
│   │   ├── auth.ts                 # Firebase auth functions
│   │   ├── data.ts                 # Product types, brand/category helpers, currencies
│   │   ├── diet.functions.ts       # AI diet planner (server function)
│   │   ├── error-capture.ts        # Global error capture for SSR
│   │   ├── error-page.ts           # HTML fallback error page
│   │   ├── firebase.ts             # Firebase initialization
│   │   ├── store.ts                # Zustand store (compare, wishlist, points, auth)
│   │   ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│   │   ├── rag/                    # Source-grounded RAG research pipeline (server-only)
│   │   │   ├── types.ts            # Shared pipeline types
│   │   │   ├── chunking.ts         # Text cleaning + overlap chunking
│   │   │   ├── embeddings.ts       # Gemini embedder (prod) + hash embedder (tests)
│   │   │   ├── vector-store.ts     # In-memory vector store (cosine top-k + filters)
│   │   │   ├── retrieval.ts        # Semantic top-k retrieval + relevance guards
│   │   │   ├── context.ts          # LLM context + citation construction
│   │   │   ├── generate.ts         # Source-grounded answer generation (Gemini)
│   │   │   ├── sources.ts          # Product catalog → source documents
│   │   │   ├── catalog.ts          # Server-only seed catalog adapter
│   │   │   ├── ingest.ts           # Clean → chunk → embed → store (dedup)
│   │   │   ├── pipeline.ts         # Retrieval→generation orchestrator
│   │   │   ├── research.functions.ts  # Server functions (createServerFn)
│   │   │   └── *.test.ts           # Unit tests (node:test, no extra deps)
│   │   └── utils/
│   │       └── images.ts           # Image path builders
│   │
│   ├── routes/
│   │   ├── __root.tsx              # Root layout (shell, providers, navbar, footer)
│   │   ├── index.tsx               # Homepage (hero, categories, trending, newsletter)
│   │   ├── assistant.tsx           # AI Diet Planner page
│   │   ├── categories.tsx          # Browse & filter products
│   │   ├── compare.tsx             # Product comparison table
│   │   ├── profile.tsx             # Auth page (sign in / sign up)
│   │   ├── product.$slug.tsx       # Product detail page with charts
│   │   ├── rewards.tsx             # Gamification & loyalty tiers
│   │   ├── api/
│   │   │   └── elevenlabs.token.ts # Server-side ElevenLabs token proxy
│   │   └── README.md               # Routing conventions documentation
│   │
│   ├── seed/
│   │   ├── brands.ts               # Brand seed data
│   │   ├── categories.ts           # Category tree (Supplements, Foods, Skincare, etc.)
│   │   ├── certifications.ts       # Certification seed data
│   │   └── products/               # Product seed data
│   │       ├── index.ts
│   │       ├── supplements.ts
│   │       └── otherCategories.ts
│   │
│   ├── router.tsx                  # Router instance with QueryClient
│   ├── routeTree.gen.ts            # Auto-generated route tree (do not edit)
│   ├── server.ts                   # SSR error-wrapping entry point
│   ├── start.ts                    # TanStack Start configuration
│   └── styles.css                  # Tailwind CSS with custom design tokens
│
├── .env.example                    # Environment variable template
├── .gitignore
├── .prettierrc
├── .prettierignore
├── components.json                 # shadcn/ui configuration
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- (Optional) **Cloudflare account** for deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/kapil-77/verifybuy.git
cd verifybuy

# Install dependencies
npm install

# Copy environment variables and fill them in
cp .env.example .env
```

### Development

```bash
# Start the dev server (Vite + HMR)
npm run dev
```

The app will be available at **http://localhost:8080**.

> **Note:** The dev server runs on port 8080. To change this, update the `server.port` value in `vite.config.ts`.

### Build

```bash
# Production build (client + SSR + Nitro/Cloudflare)
npm run build

# Development build (useful for debugging SSR)
npm run build:dev
```

### Preview

```bash
# Preview the production build locally
npm run preview
```

### Lint & Format

```bash
# Run ESLint
npm run lint

# Auto-format with Prettier
npm run format
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
# ─── ElevenLabs Voice Assistant ───
# Get your API key at https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx

# ─── Google Gemini AI (Diet Planner) ───
# Get your API key at https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXX

# ─── Firebase Authentication ───
# Find these in your Firebase Console → Project Settings → General → Web Apps
VITE_FIREBASE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ─── Optional: Backend API URL (for auth verification) ───
VITE_API_URL=http://localhost:3001
```

> All `VITE_` prefixed variables are exposed to the client bundle. Never store secrets in `VITE_` variables.

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build for Cloudflare Workers |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build |
| `npm test` | Run RAG pipeline unit tests (Node built-in runner, no extra deps) |
| `npm run lint` | Run ESLint across the project |
| `npm run format` | Auto-format with Prettier |

---

## 🌐 API Routes

### `POST /api/elevenlabs/token`

Proxies a signed token request to ElevenLabs Conversational AI. Used by the voice assistant to establish a WebRTC session.

**Request body:** (none — server injects API key from environment)

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error response:**
```json
{
  "error": "ElevenLabs not connected"
}
```

---

## 🤖 AI Capabilities

### Diet Planner (`/assistant`)

The diet planner uses a server function (`createServerFn`) to call Google Gemini's OpenAI-compatible endpoint:

1. User fills out a 10-field form (age, sex, height, weight, activity, gym focus, goal, diet preference, allergies)
2. Client calls `generateDietPlan` server function via `useServerFn`
3. Server computes BMR/TDEE targets using the Mifflin–St Jeor equation
4. Gemini generates a structured JSON meal plan via `generateText` with `Output.object()`
5. If AI fails, a deterministic fallback plan is returned immediately

**Model:** `google/gemini-3-flash-preview` via `@ai-sdk/openai-compatible`

### Voice Assistant (`VoiceAssistant`)

The voice assistant uses ElevenLabs Conversational AI with custom **client-side tools**:

| Tool Name | Description |
|---|---|
| `navigateTo` | Navigate to any page (home, categories, compare, etc.) |
| `searchCategory` | Filter products by keyword |
| `openProduct` | Open a product detail page by slug or name |
| `addToCompare` | Add a product to the comparison list |
| `removeFromCompare` | Remove a product from the comparison list |
| `clearCompare` | Clear the entire comparison list |
| `openCompare` | Navigate to the compare page |
| `openDietPlanner` | Navigate to the diet planner |
| `scrollToSection` | Scroll to a specific section by ID |
| `toggleTheme` | Toggle dark/light mode |

---

## 🤖 RAG-Powered Product Research

**Retrieval-Augmented Generation (RAG)** turns VeriFy's product/review research flow into a **source-grounded pipeline**: instead of asking Gemini to answer from memory, the app first retrieves the most relevant evidence from a searchable index of the product catalog, then generates an answer that can only cite that evidence — with clickable source URLs.

### Why RAG in VeriFy?

- **No hallucinated product facts.** Answers about ingredients, nutrition, ratings and certifications are generated *only* from retrieved chunks of the real catalog. The prompt forbids outside knowledge and citations are validated server-side before they are returned.
- **Every claim is traceable.** Source URL + document metadata (`productId`, `brandId`, `categoryId`, source type) travel through the entire pipeline — chunk → vector store → retrieval → context → generation — so every generated claim carries a real, clickable source.
- **Cheaper & faster.** Only a bounded top-k of relevant chunks (not the whole catalog) is sent to the model, keeping the context small and predictable.
- **Clean separation.** Retrieval (pure math over vectors + lexical guards) and generation (LLM) are separate modules, so each is testable and replaceable independently. If nothing relevant is found, the LLM is *never called*.
- **No new infrastructure.** The vector store is an in-memory cosine index — the practical choice for a Cloudflare Worker with a few hundred chunks and no external database.

### Pipeline

```mermaid
flowchart LR
    subgraph Sources["Product / review sources"]
        S1[Catalog products]
        S2[Certifications]
    end

    subgraph Ingestion["Ingestion (server, lazy)"]
        I1[Text extraction & cleaning]
        I2[Document chunking<br/>max 900 chars + overlap]
        I3[Embeddings<br/>gemini-embedding-001 via batchEmbedContents]
        I4[Vector storage<br/>in-memory cosine store]
    end

    subgraph Query["Query time"]
        Q1[User research query<br/>+ metadata filters]
        Q2[Query embedding]
        Q3[Semantic retrieval<br/>top-k + min-score + lexical guard]
        Q4[Context construction<br/>bounded, cited]
        Q5[LLM generation<br/>Gemini via AI SDK]
    end

    S1 --> I1
    S2 --> I1
    I1 --> I2 --> I3 --> I4
    Q1 --> Q2 --> Q3
    Q3 -->|top-k relevant chunks| I4
    Q3 --> Q4 --> Q5
    Q4 -->|source URL + metadata + citations| Q5
    Q5 --> R1[Source-grounded answer + citations]
```

**Module map (`src/lib/rag/`)**

| Step | Module |
|---|---|
| Product/review sources | `sources.ts` (catalog → source documents), `catalog.ts` (seed adapter) |
| Text extraction & cleaning | `chunking.ts` → `cleanText()` |
| Document chunking | `chunking.ts` → `chunkText()` / `chunkDocument()` |
| Embeddings | `embeddings.ts` → `createGeminiEmbedder()` (`gemini-embedding-001` via REST `:batchEmbedContents`, ≤64-item batches, `RETRIEVAL_DOCUMENT`/`RETRIEVAL_QUERY` task types) |
| Vector storage | `vector-store.ts` → `InMemoryVectorStore` |
| Semantic retrieval | `retrieval.ts` → `retrieve()` (top-k + score threshold + lexical relevance guard) |
| Context construction | `context.ts` → `buildContext()` (char budget, dedupe, canonical citations) |
| Generation | `generate.ts` → `generateGroundedAnswer()` |
| Orchestration | `ingest.ts` + `pipeline.ts` |
| Server API | `research.functions.ts` (`createServerFn`) |

### Server functions

Both are POST server functions in `src/lib/rag/research.functions.ts` — the same `createServerFn` pattern as the diet planner. They run **server-side only**; `GEMINI_API_KEY` never reaches the client.

| Function | Input | Output |
|---|---|---|
| `researchProductSummary` | `{ productId }` | `ResearchAnswer` — grounded summary + citations for that product |
| `answerResearchQuery` | `{ query, filter? }` | `ResearchAnswer` — grounded answer with optional `productId` / `categoryId` / `sourceType` filtering |

### In-app trigger

The product detail page (`/product/$slug`) renders a **ResearchPanel** (`src/components/rag/ResearchPanel.tsx`) under the product header. Pressing **Run AI Research** calls `researchProductSummary` for that product and renders the grounded answer plus its clickable citations. The panel is purely additive — it never auto-runs (no surprise LLM cost) and never fabricates results; empty retrieval and API failures render graceful status messages.

`ResearchAnswer`:

```json
{
  "status": "ok",
  "answer": "ISO100 delivers 25g of protein per 29g serving with zero sugar... [1]",
  "citations": [
    {
      "index": 1,
      "chunkId": "p7:ingredients::0",
      "sourceUrl": "https://www.amazon.com/s?k=ISO100+...",
      "sourceTitle": "ISO100 Hydrolyzed Whey Protein Isolate 5lb",
      "snippet": "Ingredients: Hydrolyzed Whey Protein Isolate...",
      "metadata": { "productId": "p7", "brandId": "brand-004", "categoryId": "cat-002" }
    }
  ],
  "grounded": true,
  "retrievedCount": 4,
  "contextChunkCount": 2
}
```

**Guarantees**
- Citation objects are derived **only** from chunks the model was actually shown; the model's numeric citation indices are validated server-side and anything else is dropped. No fabricated sources.
- `sourceUrl` values are real, navigable store listing/search URLs derived deterministically from the product's store + title.
- Empty retrieval / empty corpus / embedding failure / generation failure all return a structured status (`no_sources`, `empty_retrieval`, `embedding_error`, `generation_error`) with an empty answer — the LLM is never invoked without relevant context.
- Duplicate documents are skipped via an ingestion ledger; malformed sources (too short, missing URL) are isolated and reported.

### Tests

```bash
npm test
```

Runs `src/lib/rag/*.test.ts` with Node's built-in test runner (`node:test`) — **no extra dependencies**. Coverage: chunking (size/overlap/malformed), vector store (cosine, top-k, filters, dedup), retrieval (ranking, thresholds, lexical guard), context construction (citations, budget, dedupe), ingestion (duplicates/invalid) and the end-to-end pipeline (no-LLM short-circuits, generation errors).

---

## 🔑 Authentication

VeriFy uses **Firebase Authentication** with three providers:

- **Google** — OAuth popup via `signInWithPopup`
- **GitHub** — OAuth popup via `signInWithPopup`
- **Email/Password** — `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`

**Flow:**
1. User authenticates on the `/profile` page
2. Firebase SDK returns a `User` object mapped to `AuthUser` (uid, displayName, email, photoURL)
3. Zustand store updates `authUser` state (persisted across sessions)
4. The navbar switches to a profile avatar with dropdown (display name, email, logout)

**Backend verification:** The optional backend API (`sendIdTokenToBackend`) sends the Firebase ID token via `Authorization: Bearer <token>` for server-side session verification.

---

## 🌍 Deployment

### Cloudflare Workers (Recommended)

This project is pre-configured for deployment to Cloudflare Workers via Nitro:

```bash
# 1. Build for production
npm run build

# 2. Deploy using Nitro
npx nitro deploy --prebuilt
```

The build generates a `wrangler.json` and `.wrangler/deploy/config.json` automatically.

### Environment Variables for Production

Set the following in your Cloudflare Dashboard → Workers → verify → Settings → Variables:

| Variable | Type | Description |
|---|---|---|
| `ELEVENLABS_API_KEY` | Secret | ElevenLabs API key |
| `GEMINI_API_KEY` | Secret | Google Gemini API key |
| `VITE_FIREBASE_API_KEY` | Plain text | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Plain text | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Plain text | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Plain text | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Plain text | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Plain text | Firebase app ID |

---

## 🗺️ Roadmap

- [x] Cross-store product comparison engine
- [x] AI-powered diet planner with Gemini
- [x] Voice-controlled navigation via ElevenLabs
- [x] Firebase authentication (Google, GitHub, Email)
- [x] Rewards & gamification system
- [x] Dark/light theme with zero-flash hydration
- [x] Multi-currency support
- [ ] Real product data integration via e-commerce APIs
- [ ] Price history tracking & alerts
- [ ] User reviews & ratings
- [ ] Mobile application (React Native)
- [ ] Barcode scanner for instant product lookup
- [ ] Community-driven lab report uploads

---

## 🤝 Contributing

Contributions are welcome and encouraged!

1. **Fork** the repository
2. **Create a branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

**Guidelines:**
- Follow the existing code style (Prettier + ESLint)
- Add TypeScript types for all new APIs and data structures
- Use `createServerFn` for any server-side logic that needs client invocation
- Keep components focused and testable
- Update `seed/` data when adding new product categories or brands

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [TanStack](https://tanstack.com/) — React Router, React Query, and React Start
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed Radix UI components
- [Vercel AI SDK](https://sdk.vercel.ai/) — First-class AI integration for TypeScript
- [ElevenLabs](https://elevenlabs.io/) — Conversational AI voice technology
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI model for diet planning
- [Firebase](https://firebase.google.com/) — Authentication infrastructure
- [Lucide](https://lucide.dev/) — Open-source icon library
- [Cloudflare](https://www.cloudflare.com/) — Edge deployment platform

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/kapil-77">Kapil</a>
</p>

<p align="center">
  <a href="https://github.com/kapil-77/verifybuy">
    <img src="https://img.shields.io/github/stars/kapil-77/verifybuy?style=social" alt="GitHub stars"/>
  </a>
  <a href="https://github.com/kapil-77/verifybuy/fork">
    <img src="https://img.shields.io/github/forks/kapil-77/verifybuy?style=social" alt="GitHub forks"/>
  </a>
</p>
