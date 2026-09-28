# Recipe Substitution App

> A web app that lets you search for recipes by ingredients and get AI-powered ingredient substitutions powered by Google Gemini.

**Live Demo:** _coming soon after deployment_

<!-- Add screenshot or GIF here -->

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router |
| Backend | Node.js 18 + Express |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Recipe Data | Spoonacular API |
| AI Substitutions | Google Gemini API (`@google/genai`) |
| Hosting | Vercel (client) + Render (server) |

## Local Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd recipe-substitution-app
   ```

2. **Fill in environment variables**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   # Edit both files with your keys
   ```

3. **Run the database migration**
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```

4. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

5. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

## How the AI Substitution Works

When you click an ingredient on a recipe detail page, the server calls the **Spoonacular API** to retrieve the full recipe context (title, all ingredients). It then sends a structured prompt to **Google Gemini**, asking for 2–3 substitutes that keep the dish working — respecting any active dietary filter. Gemini returns a JSON array with each substitute, a usage ratio (e.g., "1:1"), and a one-sentence reason. The result is saved to **PostgreSQL via Prisma** so it appears in your History page.

## Known Limitations

- **Spoonacular free tier:** ~150 API points per day. Repeated searches for the same recipe use the DB cache and don't cost points.
- **Gemini free tier:** Subject to rate limits. If you see "AI is busy", wait a minute and try again.
- **No user accounts (MVP):** History is global, not per-user.
