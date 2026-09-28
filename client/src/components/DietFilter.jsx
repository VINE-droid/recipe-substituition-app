const DIET_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten free', label: 'Gluten-Free' },
  { value: 'dairy free', label: 'Dairy-Free' },
];

/**
 * DietFilter — single-select pill row for dietary preferences.
 * @param {{ value: string, onChange: (val: string) => void }} props
 */
export default function DietFilter({ value, onChange }) {
  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0 0.25rem' }}
      role="group"
      aria-label="Dietary filter"
    >
      {DIET_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          id={`diet-${opt.value || 'any'}`}
          className={`diet-pill${value === opt.value ? ' active' : ''}`}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
