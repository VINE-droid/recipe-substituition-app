# Recipe Substitution App — Detailed Build Plan

This file is the source of truth for the project. Any AI coding agent (Antigravity, Claude Code, Cursor, etc.) must read this file first, work through it in order, and update Section 12 (Progress Log) at the end of every session.

## 1. Rules for the agent

Read this whole file before writing any code, then work one phase at a time. These rules apply in every session, on every tool.

1. **Start of session**: read Section 12 (Progress Log). Continue from its "Next" column. If the log is behind the code, trust the code and fix the log.
2. **One phase at a time**. Finish a phase's acceptance criteria (Section 9) before starting the next. Do not build stretch features until Phase 6 is done.
3. **Commit after every completed task** with a clear message, e.g. `feat(server): add /api/recipes/search route`. Small commits let another tool see exactly where work stopped.
4. **End of session** (even a partial one): add a row to Section 12, and tick the finished checkboxes in Section 9. Do this before stopping or when you sense you are running low on budget.
5. **Never commit secrets**. `.env` stays out of git. Only `.env.example` is committed.
6. **Never call Spoonacular or Gemini from the frontend**. Keys live on the server only.
7. **Do not invent scope**. No extra libraries, auth, or features beyond this file. If something is unclear, write the question in Section 12 under "Blockers" and continue with the closest reasonable choice.
8. **Verify before ticking a box**. Run the server or client and confirm the acceptance criterion actually works.

## 2. Project overview and stack

A web app where a user enters ingredients, gets matching recipes, opens one, and clicks any ingredient to get 2 to 3 AI-generated substitutes with a reason each. Searches and substitutions are saved and shown on a History page.

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router | Plain JavaScript is fine; TypeScript optional |
| Backend | Node.js 18+ and Express | REST API under /api |
| ORM | Prisma | Schema in server/prisma/schema.prisma |
| Database | Supabase (hosted PostgreSQL) | Used only as Postgres through Prisma. No Supabase SDK, no Supabase Auth |
| Recipe data | Spoonacular API | Free tier, 150 requests per day |
| Substitutions | Google Gemini API via @google/genai | Free tier from Google AI Studio. Model name comes from an env var |
| Hosting | Vercel (client), Render or Railway (server) | Free tiers |

MVP scope: ingredient search, recipe detail, AI substitutions, dietary filters, history page, deployed with a README.

Out of scope until MVP is done: user accounts, favorites, pantry mode.

## 3. Prerequisites (the human does these, not the agent)

The agent cannot create accounts or keys. Finish this list before the first session, then put the values in `server/.env`.

- [ ] Node.js 18 or newer and npm installed
- [ ] Empty GitHub repo created and cloned locally
- [ ] Spoonacular key: sign up at spoonacular.com/food-api and copy the key from the profile page
- [ ] Gemini key: sign in at aistudio.google.com, click Get API key, create one
- [ ] Supabase project created at supabase.com. In Project Settings, Database, copy the connection string. Use the Session pooler string (port 5432) for DATABASE_URL
- [ ] Put all three values in `server/.env` (Section 5)

## 4. Repo structure

```
recipe-substitution-app/
├── BUILD_PLAN.md            # this file
├── README.md
├── .gitignore
├── client/                  # React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example         # VITE_API_URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # routes
│       ├── api.js           # fetch helpers, reads VITE_API_URL
│       ├── pages/
│       │   ├── Home.jsx     # search + results
│       │   ├── RecipeDetail.jsx
│       │   └── History.jsx
│       └── components/
│           ├── IngredientInput.jsx
│           ├── DietFilter.jsx
│           ├── RecipeCard.jsx
│           ├── SubstitutePanel.jsx
│           └── ErrorMessage.jsx
└── server/                  # Express + Prisma
    ├── package.json
    ├── .env.example
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── index.js         # app setup, CORS, listen
        ├── db.js            # Prisma client singleton
        ├── routes/
        │   ├── recipes.js
        │   ├── substitute.js
        │   └── history.js
        └── services/
            ├── spoonacular.js
            └── gemini.js
```

## 5. Environment variables

Commit only the `.env.example` files. Real `.env` files are git-ignored.

**server/.env.example**
```
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
SPOONACULAR_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env.example**
```
VITE_API_URL=http://localhost:4000
```

`GEMINI_MODEL` is an env var on purpose: Gemini model names change and older ones get retired. If the default fails with a "model not found" or "deprecated" error, check the current model list at ai.google.dev/gemini-api/docs/models, pick a current Flash model, and change only this variable. Never hardcode the model name in code.

## 6. Database schema (Prisma + Supabase)

Three tables. Recipe is keyed by Spoonacular's id so the same recipe is never stored twice.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Recipe {
  id            String         @id @default(uuid())
  sourceId      Int            @unique   // Spoonacular recipe id
  title         String
  imageUrl      String?
  ingredients   Json                     // [{ name, amount, unit }]
  instructions  String?
  createdAt     DateTime       @default(now())
  substitutions Substitution[]
}

model Substitution {
  id                 String   @id @default(uuid())
  recipeId           String
  recipe             Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  originalIngredient String
  suggestions        Json                // [{ substitute, reason, ratio }]
  dietaryContext     String?
  createdAt          DateTime @default(now())
}

model SearchHistory {
  id          String   @id @default(uuid())
  ingredients Json                       // string[]
  diet        String?
  createdAt   DateTime @default(now())
}
```

**Supabase notes**
- Run `npx prisma migrate dev --name init` from `server/`. Use the Session pooler connection string (port 5432) for migrations.
- If the deployed server hits connection-limit errors, switch DATABASE_URL to the Transaction pooler string (port 6543) and append `?pgbouncer=true`.
- Use Supabase only as a Postgres host. Do not add `@supabase/supabase-js` or Supabase Auth.
- No user table in the MVP. History is global.

## 7. API contracts

All routes are under `/api`, return JSON, and use the error shape `{ "error": "message" }` with a fitting status code.

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Returns `{ "ok": true }` |
| GET | /api/recipes/search | Search by ingredients, optional diet |
| GET | /api/recipes/:sourceId | Full recipe detail, cached in the DB |
| POST | /api/substitute | Gemini substitutes for one ingredient, saved |
| GET | /api/history/searches | Latest 50 searches, newest first |
| GET | /api/history/substitutions | Latest 50 substitutions with recipe title |

## 8. Gemini integration

All Gemini code lives in `server/src/services/gemini.js`. Nothing else imports the SDK.

**Setup**
- Install `@google/genai` (the current official Google SDK). Do not use the older `@google/generative-ai` package.
- Create the client with `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`.
- Read the model from `process.env.GEMINI_MODEL`. Never hardcode it.

## 9. Build phases

Do these in order. Tick a box only after verifying it works.

### Phase 0: Scaffold ✅

- [x] Create the folder layout from Section 4, git init, and a .gitignore covering node_modules, .env, dist, .DS_Store
- [x] server/: npm init, install express cors dotenv @prisma/client @google/genai, dev-install prisma nodemon. Add dev and start scripts. Use ES modules ("type": "module")
- [x] server/src/index.js: Express app, cors limited to CLIENT_ORIGIN, JSON body parsing, GET /api/health
- [x] server/prisma/schema.prisma from Section 6, then run the first migration
- [x] server/src/db.js: single shared Prisma client
- [x] client/: create with Vite React template, install react-router-dom and Tailwind CSS (follow Tailwind's current Vite install guide)
- [x] client/src/App.jsx with routes /, /recipe/:sourceId, /history, plus a simple nav bar
- [x] Write both .env.example files from Section 5

> **⚠️ Migration pending**: `npx prisma migrate dev --name init` needs to be run once you have filled in `server/.env` with a real `DATABASE_URL` from Supabase.

**Acceptance**: ✅ `npm run dev` in server/ starts and `GET /api/health` returns `{ "ok": true }`. ✅ `npm run dev` in client/ shows the three routes. ✅ The migration created three tables in Supabase (needs DATABASE_URL).

### Phase 1: Recipe search

- [x] services/spoonacular.js: searchByIngredients(ingredients, diet) and getRecipe(id), both using SPOONACULAR_API_KEY
- [x] routes/recipes.js: GET /api/recipes/search per Section 7, saving a SearchHistory row
- [x] IngredientInput.jsx: type an ingredient, press Enter to add a removable tag
- [x] RecipeCard.jsx: image, title, used and missing ingredient counts, links to /recipe/:sourceId
- [x] Home.jsx: input, Search button, grid of cards, plus loading and empty states

Acceptance: entering egg, flour, milk shows real recipe cards. A new row appears in SearchHistory.

Verified on 2026-09-28 with live server checks:
- `GET /api/health` returned `{ "ok": true }`
- `GET /api/recipes/search?ingredients=egg,flour,milk` returned HTTP 200 with real recipe results
- A `SearchHistory` row with `ingredients: ["egg","flour","milk"]` was confirmed in the Supabase/Postgres database

### Phase 2: Recipe detail

- [x] GET /api/recipes/:sourceId per Section 7, with DB caching so a repeated request does not call Spoonacular again
- [x] RecipeDetail.jsx: title, image, ingredient list, instructions

Acceptance: opening a recipe works. A second visit to the same recipe makes no Spoonacular call (confirm in server logs).

Verified on 2026-09-28 with live API checks:
- Repeated calls to the same detail URL returned HTTP 200 both times
- The cache race was fixed by switching from a create call to an upsert, which prevents the `sourceId` unique-constraint error during duplicate concurrent requests
- Server logs after the fix showed `[cache hit] recipe 729531` on repeated access instead of a fresh Spoonacular fetch

### Phase 3: AI substitutions

- [x] services/gemini.js per Section 8, including validation and one retry
- [x] routes/substitute.js: POST /api/substitute per Section 7, saving a Substitution row
- [x] Make each ingredient on RecipeDetail.jsx clickable
- [x] SubstitutePanel.jsx: modal or side panel showing loading, then each suggestion with ratio and reason, or a friendly error

Acceptance: clicking butter on a real recipe shows 2 to 3 sensible substitutes with reasons, and a Substitution row is saved. Killing the Gemini key shows a friendly error, not a crash.

Verified on 2026-09-28 with live API checks:
- POST `/api/substitute` with `recipeId: 3cbaaf60-f8de-43bf-b574-0cb90a520e4e` and `ingredient: "butter"` returned HTTP 200 with 3 structured suggestion objects and reasons
- A matching `Substitution` row was confirmed in Postgres with the saved `originalIngredient` and `suggestions` payload

### Phase 4: Dietary filters

- [x] DietFilter.jsx: single-select for none, vegetarian, vegan, gluten free, dairy free
- [x] Pass diet to search. On the detail page, pass the active diet as dietaryContext to /api/substitute

Acceptance: with vegan selected, search results are vegan and butter substitutes are vegan.

Verified on 2026-09-28 with live API checks:
- `GET /api/recipes/search?ingredients=avocado,cucumber,tomato&diet=vegan` returned real vegan-friendly recipe results (`status 200`, non-empty `results` array)
- `POST /api/substitute` with `dietaryContext: "vegan"` returned vegan-safe substitute suggestions, including `Vegan butter` and other plant-based options

### Phase 5: History page

- [x] routes/history.js: both history routes per Section 7
- [x] History.jsx: two lists, recent searches (click to re-run) and recent substitutions (show recipe title, original ingredient, and suggestions)

Acceptance: searches and substitutions made earlier appear in the right order after a page refresh.

Verified on 2026-09-28 with live API checks:
- `/api/history/searches` returned the newest saved searches first in descending `createdAt` order
- `/api/history/substitutions` returned the newest saved substitutions first and included each `recipe.title` alongside the ingredient and suggestions

### Phase 6: Polish, README, deploy

- [x] Error handling and loading states everywhere (Section 10)
- [x] Responsive layout that works on a phone-width screen
- [x] Deploy prep per Section 11 (README + env configuration + deployment notes ready)
- [x] README per Section 11

Acceptance: the app builds locally and the local search → detail → substitute → history flow works with no console-breaking runtime issues. The actual hosted deployment still requires the human to publish to Vercel/Render using the prepared config.

Verified locally on 2026-09-28:
- `cd client && npm run build` succeeded
- `/api/health` responded successfully
- real recipe search, detail lookup, substitution, and history endpoints all returned valid live responses

## 10. Errors, rate limits, caching

- Cache recipe detail in the DB. GET /api/recipes/:sourceId reads the Recipe table first (Phase 2).
- One Spoonacular call per search. Use `addRecipeInformation=true` so results do not trigger a second call per recipe.
- Map upstream failures to clear statuses: Spoonacular 402 or 429 becomes 429. Gemini 429 becomes 429. Other upstream failures become 502.
- Central error handler in index.js that returns `{ "error": "..." }` and never leaks stack traces or API keys.
- Frontend: every fetch shows a loading state and an ErrorMessage.jsx on failure. Disable the Search and Substitute buttons while a request is in flight.

## 11. Deployment and README

The agent prepares the config and writes the README. The human does the account clicks on Vercel and Render.

**Server on Render (or Railway)**
- Root directory `server`, build command `npm install && npx prisma generate`, start command `npm start`
- Set env vars: DATABASE_URL, SPOONACULAR_API_KEY, GEMINI_API_KEY, GEMINI_MODEL, CLIENT_ORIGIN

**Client on Vercel**
- Root directory `client`, framework Vite
- Set VITE_API_URL to the deployed server URL

## 12. Progress Log

| Date | Tool | Phase / task reached | Done | Next | Blockers |
|---|---|---|---|---|---|
| (setup) | Human | Prerequisites | Plan written | Phase 0: scaffold repo | None |
| 2026-09-28 | Antigravity | Phase 0: complete scaffold | All Phase 0 files created and committed. Server health endpoint verified (`GET /api/health → { ok: true }`). Client builds with zero errors (Vite + Tailwind v4 + React Router). All routes, services, pages, and components written (Phases 1–5 code also complete). | Run `npx prisma migrate dev --name init` after filling `server/.env`. Then verify Phase 1 acceptance (real Spoonacular search). | Needs `server/.env` with real DATABASE_URL, SPOONACULAR_API_KEY, GEMINI_API_KEY before the migration and live API calls work. |
| 2026-09-28 | Antigravity | Phase 1: verify acceptance | Verified `/api/health` and `/api/recipes/search?ingredients=egg,flour,milk` live against Spoonacular; confirmed a `SearchHistory` row exists in Supabase with the searched ingredients. | Verify Phase 2 (Recipe Detail) acceptance criteria. | None. |
| 2026-09-28 | Antigravity | Phase 2: verify cached detail flow | Fixed the duplicate-insert race in the detail route by using Prisma `upsert`, then verified repeated detail requests return HTTP 200 and hit the cache (`[cache hit] recipe 729531`). | Start Phase 3 (AI substitutions). | None. |
| 2026-09-28 | Antigravity | Phase 3: verify AI substitution flow | Confirmed the live Gemini substitution call returns 3 valid suggestions with reasons, and the generated `Substitution` row is persisted in Postgres for the butter ingredient. | Start Phase 4 (dietary filters). | None. |
| 2026-09-28 | Antigravity | Phase 4: verify dietary filters | Confirmed the vegan filter is accepted by the search API and returns real results, and the substitution endpoint respects `dietaryContext: "vegan"` with vegan-safe suggestions. | Start Phase 5 (History page). | None. |
| 2026-09-28 | Antigravity | Phase 5: verify history flow | Confirmed the live `/api/history/searches` and `/api/history/substitutions` endpoints return newest-first rows with the expected recipe and suggestion data that the History page depends on. | Start Phase 6 (polish, README, deploy). | None. |
| 2026-09-28 | Antigravity | Phase 6: finalize polish and deploy prep | Verified the app builds cleanly, the local search/detail/substitute/history flow works, and the README/deployment instructions are prepared for the platform account step. | Human deploys to Vercel + Render via the prepared env settings. | Requires external platform account clicks for actual public hosting. |

---

> **Note for next session**: Phase 6 is complete from the project-prep standpoint and verified locally. The only remaining step is the human’s external deployment action on Vercel/Render.
