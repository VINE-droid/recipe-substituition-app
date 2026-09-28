import express from 'express';
import prisma from '../db.js';
import { searchByIngredients, getRecipe } from '../services/spoonacular.js';

const router = express.Router();

// GET /api/recipes/search?ingredients=egg,flour&diet=vegan
router.get('/search', async (req, res, next) => {
  try {
    const { ingredients, diet } = req.query;
    if (!ingredients) {
      return res.status(400).json({ error: 'ingredients query param is required' });
    }

    const ingredientList = ingredients.split(',').map((s) => s.trim()).filter(Boolean);
    if (ingredientList.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required' });
    }

    const results = await searchByIngredients(ingredientList, diet || null);

    // Save search history row (fire-and-forget, don't block the response)
    prisma.searchHistory.create({
      data: { ingredients: ingredientList, diet: diet || null },
    }).catch((err) => console.error('[history] Failed to save search:', err.message));

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});

// GET /api/recipes/:sourceId
router.get('/:sourceId', async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    if (isNaN(sourceId)) {
      return res.status(400).json({ error: 'Invalid sourceId' });
    }

    // Check DB cache first
    const cached = await prisma.recipe.findUnique({ where: { sourceId } });
    if (cached) {
      console.log(`[cache hit] recipe ${sourceId}`);
      return res.json(cached);
    }

    // Fetch from Spoonacular and cache
    console.log(`[spoonacular] fetching recipe ${sourceId}`);
    const data = await getRecipe(sourceId);
    const stored = await prisma.recipe.upsert({
      where: { sourceId },
      create: data,
      update: data,
    });
    return res.json(stored);
  } catch (err) {
    return next(err);
  }
});

export default router;
