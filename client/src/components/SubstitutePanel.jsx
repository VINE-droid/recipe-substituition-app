/**
 * SubstitutePanel — modal that shows AI-generated substitutes for an ingredient.
 * @param {{
 *   ingredient: string,
 *   loading: boolean,
 *   suggestions: Array<{substitute:string, ratio:string, reason:string}>,
 *   error: string|null,
 *   onClose: () => void,
 * }} props
 */
export default function SubstitutePanel({ ingredient, loading, suggestions, error, onClose }) {
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Substitutes for ${ingredient}`}
      onClick={handleOverlayClick}
    >
      <div className="modal" id="substitute-panel">
        <div className="modal-header">
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Substitutes for
            </p>
            <h2 className="modal-title">
              🔀 <span style={{ color: 'var(--color-accent)' }}>{ingredient}</span>
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close substitutes panel" type="button">
            ✕
          </button>
        </div>

        {loading && (
          <div className="spinner-center">
            <div className="spinner" aria-hidden="true" />
            <p>Asking Gemini AI…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-msg" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && suggestions.length === 0 && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>No suggestions returned.</p>
        )}

        {!loading && suggestions.length > 0 && (
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
              Click any ingredient in the recipe to get AI-powered substitutes.
            </p>
            {suggestions.map((s, i) => (
              <div key={i} className="suggestion-card">
                <div className="suggestion-name">{s.substitute}</div>
                <div className="suggestion-ratio">{s.ratio}</div>
                <div className="suggestion-reason">{s.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
