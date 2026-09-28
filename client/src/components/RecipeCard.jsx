import { Link } from 'react-router-dom';

/**
 * RecipeCard — grid card for a recipe search result.
 * @param {{ recipe: object }} props
 */
export default function RecipeCard({ recipe }) {
  const { sourceId, title, imageUrl, usedIngredientCount, missedIngredientCount } = recipe;

  return (
    <Link
      to={`/recipe/${sourceId}`}
      style={{ textDecoration: 'none' }}
      aria-label={`View recipe: ${title}`}
    >
      <article className="card" id={`recipe-card-${sourceId}`}>
        {imageUrl ? (
          <img
            className="recipe-card-img"
            src={imageUrl}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div
            className="recipe-card-img"
            style={{
              background: 'linear-gradient(135deg, #1c2430 0%, #0d1117 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
            aria-hidden="true"
          >
            🍽️
          </div>
        )}
        <div className="recipe-card-body">
          <h2 className="recipe-card-title">{title}</h2>
          <div className="recipe-card-meta">
            <span className="meta-used">✓ {usedIngredientCount} used</span>
            <span className="meta-missing">✗ {missedIngredientCount} missing</span>
          </div>
          <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
            View Recipe →
          </span>
        </div>
      </article>
    </Link>
  );
}
