/**
 * ErrorMessage — shows a friendly error banner.
 * @param {{ message: string }} props
 */
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-msg" role="alert" aria-live="assertive">
      <span className="error-icon">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
