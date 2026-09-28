import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import recipesRouter from './routes/recipes.js';
import substituteRouter from './routes/substitute.js';
import historyRouter from './routes/history.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — only allow requests from the configured client origin
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// Parse JSON bodies
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/recipes', recipesRouter);
app.use('/api/substitute', substituteRouter);
app.use('/api/history', historyRouter);

// ─── Central error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message ?? err);
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
