import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getSearchHistory, getSubstitutionHistory } from '../api.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function History() {
  const navigate = useNavigate();

  const [searches, setSearches] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [errorSearches, setErrorSearches] = useState(null);
  const [errorSubs, setErrorSubs] = useState(null);

  useEffect(() => {
    getSearchHistory()
      .then((d) => setSearches(d.searches || []))
      .catch((e) => setErrorSearches(e.message))
      .finally(() => setLoadingSearches(false));

    getSubstitutionHistory()
      .then((d) => setSubstitutions(d.substitutions || []))
      .catch((e) => setErrorSubs(e.message))
      .finally(() => setLoadingSubs(false));
  }, []);

  function rerunSearch(search) {
    const params = new URLSearchParams();
    params.set('ingredients', (search.ingredients || []).join(','));
    if (search.diet) params.set('diet', search.diet);
    navigate(`/?${params}`);
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" id="history-heading">
          📜 <span>History</span>
        </h1>

        <div className="two-col">
          {/* Recent searches */}
          <section aria-labelledby="searches-heading" className="history-section">
            <h2 id="searches-heading" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Searches
            </h2>

            {loadingSearches && (
              <div className="spinner-center" style={{ padding: '2rem' }}>
                <div className="spinner" aria-hidden="true" />
              </div>
            )}

            <ErrorMessage message={errorSearches} />

            {!loadingSearches && !errorSearches && searches.length === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-icon" style={{ fontSize: '2rem' }}>🔍</span>
                <h3>No searches yet</h3>
                <p>Your ingredient searches will appear here.</p>
              </div>
            )}

            <div className="history-list" id="search-history-list">
              {searches.map((s) => (
                <div key={s.id} className="history-row" id={`search-${s.id}`}>
                  <span className="history-row-icon">🔍</span>
                  <div className="history-row-body">
                    <div className="history-row-title">
                      {(s.ingredients || []).join(', ')}
                    </div>
                    <div className="history-row-sub">
                      {s.diet && <span style={{ marginRight: '0.5rem' }}>🥗 {s.diet}</span>}
                      {formatDate(s.createdAt)}
                    </div>
                  </div>
                  <div className="history-row-action">
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => rerunSearch(s)}
                      aria-label={`Re-run search for ${(s.ingredients || []).join(', ')}`}
                    >
                      Re-run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent substitutions */}
          <section aria-labelledby="subs-heading" className="history-section">
            <h2 id="subs-heading" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Substitutions
            </h2>

            {loadingSubs && (
              <div className="spinner-center" style={{ padding: '2rem' }}>
                <div className="spinner" aria-hidden="true" />
              </div>
            )}

            <ErrorMessage message={errorSubs} />

            {!loadingSubs && !errorSubs && substitutions.length === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-icon" style={{ fontSize: '2rem' }}>🔀</span>
                <h3>No substitutions yet</h3>
                <p>Click an ingredient on a recipe to get AI suggestions.</p>
              </div>
            )}

            <div className="history-list" id="substitution-history-list">
              {substitutions.map((sub) => {
                const suggestions = Array.isArray(sub.suggestions) ? sub.suggestions : [];
                return (
                  <div key={sub.id} className="history-row" id={`sub-${sub.id}`}>
                    <span className="history-row-icon">🔀</span>
                    <div className="history-row-body">
                      <div className="history-row-title">
                        <span style={{ color: 'var(--color-accent)' }}>{sub.originalIngredient}</span>
                        {' '}in {sub.recipe?.title || 'Unknown recipe'}
                      </div>
                      <div className="history-row-sub" style={{ marginTop: '0.25rem' }}>
                        {suggestions.slice(0, 2).map((s, i) => (
                          <span key={i} style={{ marginRight: '0.5rem' }}>
                            → {s.substitute}
                          </span>
                        ))}
                        {suggestions.length > 2 && <span>+{suggestions.length - 2} more</span>}
                      </div>
                      <div className="history-row-sub">{formatDate(sub.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
