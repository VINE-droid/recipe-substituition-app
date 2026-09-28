import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IngredientInput from '../components/IngredientInput.jsx';
import DietFilter from '../components/DietFilter.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { searchRecipes } from '../api.js';

export default function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e?.preventDefault();
    if (ingredients.length === 0) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchRecipes(ingredients, diet);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <h1 className="hero-title">
            Cook smarter with<br />
            <span style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              AI substitutes
            </span>
          </h1>
          <p className="hero-subtitle">
            Enter what you have in your pantry, find matching recipes, and let Gemini AI suggest the perfect ingredient swaps.
          </p>

          {/* Search box */}
          <form className="search-box" onSubmit={handleSearch} role="search" aria-label="Recipe search">
            <IngredientInput ingredients={ingredients} onChange={setIngredients} />
            <DietFilter value={diet} onChange={setDiet} />
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="search-btn"
                className="btn btn-primary"
                type="submit"
                disabled={loading || ingredients.length === 0}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden="true" />
                    Searching…
                  </>
                ) : (
                  '🔍 Search Recipes'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Error */}
        <ErrorMessage message={error} />

        {/* Results */}
        {searched && !loading && !error && results.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🍽️</span>
            <h3>No recipes found</h3>
            <p>Try different ingredients or remove the dietary filter.</p>
          </div>
        )}

        {results.length > 0 && (
          <section aria-label="Search results">
            <h2 className="section-title">
              Found <span>{results.length}</span> recipes
            </h2>
            <div className="recipe-grid" id="recipe-grid">
              {results.map((recipe) => (
                <RecipeCard key={recipe.sourceId} recipe={recipe} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
