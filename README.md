# Recipe Substitution App

A React + Express app that helps users search for recipes by ingredients, view recipe details, and request AI-generated ingredient substitutions with dietary awareness.

## Features

- Ingredient-based recipe search
- Dietary filter support: none, vegetarian, vegan, gluten free, dairy free
- Recipe detail page with ingredient list and instructions
- Clickable ingredients that open a Gemini-powered substitute panel
- Search and substitution history tracking in Postgres
- DB caching for repeat recipe detail requests to avoid extra Spoonacular calls

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma + Supabase |
| Recipe Data | Spoonacular API |
| AI | Google Gemini API via `@google/genai` |

## Local Setup

1. Install dependencies in both apps
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Copy environment files and fill in keys
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Required values:
   - `server/.env`: `PORT`, `DATABASE_URL`, `SPOONACULAR_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_ORIGIN`
   - `client/.env`: `VITE_API_URL=http://localhost:4000`

3. Run Prisma migration
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```

4. Start the backend
   ```bash
   cd server
   npm run dev
   ```

5. Start the frontend in a second terminal
   ```bash
   cd client
   npm run dev
   ```

6. Open the app at `http://localhost:5173`

## Project Flow

1. Search by ingredients on the home page
2. Open a recipe detail page
3. Click any ingredient to fetch AI substitutes
4. View recent searches and substitutions in the history page

## Deployment Preparation

The app is configured for a standard Vercel + Render deployment flow.

### Render / backend
- Root directory: `server`
- Build command: `npm install && npx prisma generate`
- Start command: `npm start`
- Required environment variables:
  - `DATABASE_URL`
  - `SPOONACULAR_API_KEY`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `CLIENT_ORIGIN`

### Vercel / frontend
- Root directory: `client`
- Framework preset: Vite
- Environment variable:
  - `VITE_API_URL` = deployed backend URL

> The actual hosted deployment still requires the human to complete the platform account setup and publish the app. The project code and env configuration are ready for that step.

## Notes

- The app stores a global history, not per-user history.
- Spoonacular rate limits apply to recipe lookups; repeated detail requests are cached in Prisma.
- Gemini errors are mapped to friendly app-level messages instead of crashing the client.
