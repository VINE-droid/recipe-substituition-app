import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// GET /api/history/searches — latest 50, newest first
router.get('/searches', async (_req, res, next) => {
  try {
    const rows = await prisma.searchHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ searches: rows });
  } catch (err) {
    return next(err);
  }
});

// GET /api/history/substitutions — latest 50 with recipe title
router.get('/substitutions', async (_req, res, next) => {
  try {
    const rows = await prisma.substitution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { recipe: { select: { title: true, sourceId: true } } },
    });
    return res.json({ substitutions: rows });
  } catch (err) {
    return next(err);
  }
});

export default router;
