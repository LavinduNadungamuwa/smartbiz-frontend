export default function PrimaryButton({ loading = false, loadingText, children }) {
  return (
    <button
      type="submit"
      className={`btn-primary${loading ? ' btn-primary--loading' : ''}`}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
