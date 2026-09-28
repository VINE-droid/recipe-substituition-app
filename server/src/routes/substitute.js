import express from 'express';
import prisma from '../db.js';
import { getSubstitutes } from '../services/gemini.js';

const router = express.Router();

// POST /api/substitute
router.post('/', async (req, res, next) => {
  try {
    const { recipeId, ingredient, dietaryContext } = req.body;

    if (!recipeId || !ingredient) {
      return res.status(400).json({ error: 'recipeId and ingredient are required' });
    }

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const ingredientNames = (recipe.ingredients || []).map((i) => i.name).filter(Boolean);

    const suggestions = await getSubstitutes({
      recipeTitle: recipe.title,
      ingredients: ingredientNames,
      target: ingredient,
      dietaryContext: dietaryContext || null,
    });

    const saved = await prisma.substitution.create({
      data: {
        recipeId,
        originalIngredient: ingredient,
        suggestions,
        dietaryContext: dietaryContext || null,
      },
    });

    return res.json({
      id: saved.id,
      originalIngredient: saved.originalIngredient,
      suggestions: saved.suggestions,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
