import { useRef, useEffect, useState, forwardRef, memo } from 'react';
import { List } from 'react-window';
import ProductCard from './ProductCard';
import LoadMoreSentinel from './LoadMoreSentinel';
import Skeleton from '../../../shared/components/Skeleton';

/**
 * Virtualized product grid using react-window v2.
 *
 * react-window v2 API:
 * - `rowProps` object is spread onto each row as top-level props
 * - Each row receives: { ...rowProps, index, style, ariaAttributes, key }
 * - `style` contains position:absolute + translateY for virtual positioning
 */
const CARD_HEIGHT = 130;

/**
 * Individual row rendered by react-window.
 * Props from rowProps are spread directly (products, columns, etc.)
 * plus index, style, ariaAttributes from react-window itself.
 */
const ProductRow = memo(forwardRef(function ProductRow(props, ref) {
  const {
    index,
    style,
    ariaAttributes,
    products,
    columns,
    hasMore,
    isLoading,
    onLoadMore,
  } = props;

  const startIdx = index * columns;
  const rowProducts = products.slice(startIdx, startIdx + columns);

  // Sentinel row at the bottom (no products in this row index)
  if (rowProducts.length === 0 && hasMore) {
    return (
      <div ref={ref} style={style} {...ariaAttributes} className="flex items-center justify-center">
        <LoadMoreSentinel onIntersect={onLoadMore} isLoading={isLoading} />
      </div>
    );
  }

  const isLastDataRow = startIdx + columns >= products.length;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
      {...ariaAttributes}
    >
      {rowProducts.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}

      {/* Include sentinel in the last data row if more is available */}
      {isLastDataRow && hasMore && rowProducts.length > 0 && (
        <div className="col-span-full flex items-center justify-center">
          <LoadMoreSentinel onIntersect={onLoadMore} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}));

function ProductGrid({ products, hasMore, isLoading, isInitialLoad, onLoadMore }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [columns, setColumns] = useState(3);

  // Responsive column calculation
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });

        if (width < 640) setColumns(1);
        else if (width < 1024) setColumns(2);
        else setColumns(3);
      }
    }

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(products.length / columns) + (hasMore ? 1 : 0);

  // rowProps are spread directly onto each row component as top-level props
  const rowProps = {
    products,
    columns,
    hasMore,
    isLoading,
    onLoadMore,
  };

  const renderContent = () => {
    // Skeleton loading state
    if (isInitialLoad) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      );
    }

    // Empty state
    if (!isLoading && products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 text-6xl">📦</div>
          <h3 className="mb-2 text-xl font-semibold text-text-primary">No products found</h3>
          <p className="text-text-secondary">Try a different category or check back later.</p>
        </div>
      );
    }

    return (
      dimensions.width > 0 && (
        <List
          rowComponent={ProductRow}
          rowCount={rowCount}
          rowHeight={CARD_HEIGHT}
          rowProps={rowProps}
          overscanCount={5}
          style={{ height: dimensions.height || 600, width: dimensions.width, overflow: 'auto' }}
        />
      )
    );
  };

  return (
    <div ref={containerRef} className="h-[calc(100vh-200px)] w-full">
      {renderContent()}
    </div>
  );
}

export default ProductGrid;
