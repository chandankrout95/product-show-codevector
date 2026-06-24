/**
 * Error state display with retry button.
 */
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-text-primary">Something went wrong</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
        {message || 'An unexpected error occurred while loading products.'}
      </p>

      {onRetry && (
        <button
          id="retry-button"
          onClick={onRetry}
          className="rounded-xl bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-400 hover:shadow-lg hover:shadow-accent-500/25 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
