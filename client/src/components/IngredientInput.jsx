import { useState, useRef, useId } from 'react';

/**
 * IngredientInput — tag-style ingredient entry.
 * Press Enter or comma to add a tag; click ✕ to remove.
 * @param {{ ingredients: string[], onChange: (list: string[]) => void }} props
 */
export default function IngredientInput({ ingredients, onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const labelId = useId();

  function add(raw) {
    const value = raw.trim().toLowerCase();
    if (!value || ingredients.includes(value)) return;
    onChange([...ingredients, value]);
    setInput('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && input === '' && ingredients.length > 0) {
      onChange(ingredients.slice(0, -1));
    }
  }

  function remove(ing) {
    onChange(ingredients.filter((i) => i !== ing));
  }

  return (
    <div>
      {ingredients.length > 0 && (
        <div className="tag-row" aria-label="Added ingredients">
          {ingredients.map((ing) => (
            <span key={ing} className="chip">
              {ing}
              <button
                className="chip-remove"
                onClick={() => remove(ing)}
                aria-label={`Remove ${ing}`}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="input-row">
        <label id={labelId} className="sr-only">Add ingredient</label>
        <input
          id="ingredient-input"
          ref={inputRef}
          className="input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => input && add(input)}
          placeholder={
            ingredients.length === 0
              ? 'Type an ingredient and press Enter…'
              : 'Add another ingredient…'
          }
          aria-labelledby={labelId}
          aria-describedby="ingredient-hint"
          autoComplete="off"
        />
      </div>
      <p id="ingredient-hint" style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
        Press Enter or comma to add each ingredient
      </p>
    </div>
  );
}
