import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import SubstitutePanel from '../components/SubstitutePanel.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getRecipe, getSubstitute } from '../api.js';

export default function RecipeDetail() {
  const { sourceId } = useParams();
  const [searchParams] = useSearchParams();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Substitution state
  const [subIngredient, setSubIngredient] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subSuggestions, setSubSuggestions] = useState([]);
  const [subError, setSubError] = useState(null);

  // Pass the active diet from the query string so the substitution is context-aware
  const dietaryContext = searchParams.get('diet') || null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecipe(sourceId)
      .then((data) => { if (!cancelled) { setRecipe(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [sourceId]);

  async function handleIngredientClick(ingredientName) {
    if (!recipe) return;
    setSubIngredient(ingredientName);
    setSubSuggestions([]);
    setSubError(null);
    setSubLoading(true);
    try {
      const data = await getSubstitute(recipe.id, ingredientName, dietaryContext);
      setSubSuggestions(data.suggestions || []);
    } catch (err) {
      setSubError(err.message);
    } finally {
      setSubLoading(false);
    }
  }

  function closePanel() {
    setSubIngredient(null);
    setSubSuggestions([]);
    setSubError(null);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="spinner-center">
            <div className="spinner" aria-hidden="true" />
            <p>Loading recipe…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>← Back</Link>
          <ErrorMessage message={error} />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return (
    <div className="page">
      <div className="container">
        <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          ← Back to search
        </Link>

        {/* Hero image */}
        {recipe.imageUrl ? (
          <div className="detail-hero">
            <img src={recipe.imageUrl} alt={recipe.title} />
            <div className="detail-hero-overlay">
              <h1 className="detail-title">{recipe.title}</h1>
            </div>
          </div>
        ) : (
          <h1 className="detail-title" style={{ marginBottom: '2rem' }}>{recipe.title}</h1>
        )}

        {/* Ingredients */}
        <section aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" className="section-title" style={{ fontSize: '1.25rem' }}>
            🧂 Ingredients
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
              (click any to get AI substitutes)
            </span>
          </h2>
          <div className="ingredients-grid" id="ingredients-list">
            {ingredients.map((ing, i) => (
              <button
                key={i}
                id={`ingredient-${ing.name?.replace(/\s+/g, '-').toLowerCase()}-${i}`}
                className="ingredient-btn"
                onClick={() => handleIngredientClick(ing.name)}
                type="button"
                aria-label={`Get substitutes for ${ing.name}`}
              >
                🔀 {ing.amount} {ing.unit} {ing.name}
              </button>
            ))}
          </div>
        </section>

        {/* Instructions */}
        {recipe.instructions && (
          <section aria-labelledby="instructions-heading">
            <h2 id="instructions-heading" className="section-title" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
              📋 Instructions
            </h2>
            <div className="instructions-block" id="instructions">
              {recipe.instructions}
            </div>
          </section>
        )}
      </div>

      {/* Substitute modal */}
      {subIngredient && (
        <SubstitutePanel
          ingredient={subIngredient}
          loading={subLoading}
          suggestions={subSuggestions}
          error={subError}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
