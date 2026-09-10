export default function Loading() {
  return (
    <div
      className="loading-surface"
      role="status"
      aria-label="Loading workspace"
    >
      <div
        className="skeleton"
        style={{ height: 48, maxWidth: 420, marginBottom: 30 }}
      />
      <div className="quote-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 380 }} />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
