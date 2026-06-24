import { useState, useEffect } from 'react';
import { fetchCategories } from '../api/productApi';

/**
 * Category filter dropdown.
 * Populates from /api/categories endpoint.
 * Selecting a category calls onCategoryChange which resets cursor and refetches.
 */
function CategoryFilter({ currentCategory, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const displayLabel = currentCategory || 'All Categories';

  return (
    <div className="relative">
      <button
        id="category-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-surface-600 bg-surface-800 px-4 py-2.5 text-sm font-medium text-text-primary transition-all duration-200 hover:border-accent-500/50 hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
      >
        <svg className="h-4 w-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>{displayLabel}</span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute left-0 z-20 mt-2 max-h-72 w-56 overflow-auto rounded-xl border border-surface-600 bg-surface-800 py-1 shadow-xl shadow-black/30 animate-fade-in-up">
            {/* All categories option */}
            <button
              id="category-option-all"
              onClick={() => { onCategoryChange(null); setIsOpen(false); }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                !currentCategory
                  ? 'bg-accent-500/15 text-accent-300 font-medium'
                  : 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'
              }`}
            >
              All Categories
            </button>

            <div className="mx-3 my-1 h-px bg-surface-600" />

            {categories.map((cat) => (
              <button
                key={cat}
                id={`category-option-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => { onCategoryChange(cat); setIsOpen(false); }}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                  currentCategory === cat
                    ? 'bg-accent-500/15 text-accent-300 font-medium'
                    : 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CategoryFilter;
