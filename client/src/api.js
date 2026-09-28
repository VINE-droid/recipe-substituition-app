const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export function searchRecipes(ingredients, diet) {
  const params = new URLSearchParams({ ingredients: ingredients.join(',') });
  if (diet) params.set('diet', diet);
  return request(`/api/recipes/search?${params}`);
}

export function getRecipe(sourceId) {
  return request(`/api/recipes/${sourceId}`);
}

export function getSubstitute(recipeId, ingredient, dietaryContext) {
  return request('/api/substitute', {
    method: 'POST',
    body: JSON.stringify({ recipeId, ingredient, dietaryContext }),
  });
}

export function getSearchHistory() {
  return request('/api/history/searches');
}

export function getSubstitutionHistory() {
  return request('/api/history/substitutions');
}
