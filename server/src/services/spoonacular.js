const BASE_URL = 'https://api.spoonacular.com';

function apiKey() {
  return process.env.SPOONACULAR_API_KEY;
}

/**
 * Map Spoonacular HTTP errors to meaningful app errors.
 */
async function handleResponse(res) {
  if (res.ok) return res.json();

  if (res.status === 402 || res.status === 429) {
    const err = new Error('Daily recipe limit reached, try again tomorrow.');
    err.status = 429;
    throw err;
  }

  const err = new Error(`Spoonacular error: ${res.status}`);
  err.status = 502;
  throw err;
}

/**
 * Search recipes by a list of ingredients, with optional dietary filter.
 * Uses complexSearch so we get full info in one call.
 *
 * @param {string[]} ingredients
 * @param {string|null} diet
 * @returns {Promise<Array>}
 */
export async function searchByIngredients(ingredients, diet) {
  const params = new URLSearchParams({
    apiKey: apiKey(),
    includeIngredients: ingredients.join(','),
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    number: '12',
  });
  if (diet) params.set('diet', diet);

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
  const data = await handleResponse(res);

  return (data.results || []).map((r) => ({
    sourceId: r.id,
    title: r.title,
    imageUrl: r.image || null,
    usedIngredientCount: r.usedIngredientCount ?? 0,
    missedIngredientCount: r.missedIngredientCount ?? 0,
  }));
}

/**
 * Fetch full recipe information from Spoonacular.
 * Returns data shaped for DB storage (no id/createdAt — Prisma adds those).
 *
 * @param {number} id  Spoonacular recipe id
 */
export async function getRecipe(id) {
  const params = new URLSearchParams({ apiKey: apiKey() });
  const res = await fetch(`${BASE_URL}/recipes/${id}/information?${params}`);
  const data = await handleResponse(res);

  const ingredients = (data.extendedIngredients || []).map((ing) => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
  }));

  // Flatten HTML instructions if present, otherwise use step text
  let instructions = null;
  if (data.instructions) {
    instructions = data.instructions.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } else if (data.analyzedInstructions?.length > 0) {
    instructions = data.analyzedInstructions[0].steps
      .map((s) => `${s.number}. ${s.step}`)
      .join('\n');
  }

  return {
    sourceId: data.id,
    title: data.title,
    imageUrl: data.image || null,
    ingredients,
    instructions,
  };
}
