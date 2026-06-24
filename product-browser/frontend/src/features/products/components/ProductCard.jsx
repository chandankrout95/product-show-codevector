import { memo } from 'react';

/**
 * Individual product card with category badge, price, and date.
 * Memoized to avoid unnecessary re-renders in the virtualized list.
 */
const ProductCard = memo(function ProductCard({ product, style }) {
  const formattedDate = new Date(product.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  return (
    <div style={style} className="p-2">
      <div className="group h-full rounded-xl border border-surface-600 bg-surface-800 p-5 transition-all duration-300 hover:border-accent-500/50 hover:shadow-[0_0_24px_rgba(108,99,255,0.08)]">
        {/* Header: Name + Price */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-text-primary line-clamp-2 transition-colors duration-200 group-hover:text-accent-300">
            {product.name}
          </h3>
          <span className="shrink-0 text-lg font-bold text-mint-400">
            {formattedPrice}
          </span>
        </div>

        {/* Footer: Category badge + Date */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-accent-500/15 px-3 py-1 text-xs font-medium text-accent-300">
            {product.category}
          </span>
          <span className="text-xs text-text-muted">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
