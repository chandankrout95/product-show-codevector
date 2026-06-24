# Product Browser — Scalable Cursor Pagination

A full-stack application to browse ~200,000 products with **cursor-based (keyset) pagination** and **virtualized rendering**. Designed for constant-time pagination at any depth and correctness under concurrent writes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | MongoDB + Mongoose |
| Backend | Node.js + Express |
| Frontend | React (Vite) |
| Styling | Tailwind CSS v4 |
| List rendering | react-window (virtualized) |
| HTTP client | Axios |
| Data generation | @faker-js/faker |

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB running locally on port 27017

### 1. Backend
```bash
cd product-browser/backend
cp .env.example .env        # adjust MONGO_URI if needed
npm install
npm run seed                # generates 200,000 products (~30–50 seconds)
npm run dev                 # starts API on http://localhost:5000
```

### 2. Frontend
```bash
cd product-browser/frontend
cp .env.example .env
npm install
npm run dev                 # starts UI on http://localhost:5173
```

### 3. Run Correctness Test
```bash
cd product-browser/backend
npm test                    # proves zero duplicates/no missing products under concurrent writes
```

---

## How Keyset (Cursor) Pagination Works

### The Mechanism

Instead of `OFFSET`/`SKIP` (which says "skip N rows from the start"), cursor pagination says **"give me everything after this specific point in the sort order."**

Our sort key is `(createdAt DESC, _id DESC)`. A cursor is a base64-encoded snapshot of the last product the client saw:

```json
{ "createdAt": "2025-03-15T08:30:00.000Z", "id": "6651a2f3..." }
```

The next-page query becomes:
```js
{
  $or: [
    { createdAt: { $lt: cursor.createdAt } },
    { createdAt: cursor.createdAt, _id: { $lt: cursor.id } }
  ]
}
```

MongoDB resolves this as a **direct B-tree range scan**: `O(log n)` to seek to the cursor position, then `O(limit)` to read the next batch. **Page 1 and page 5000 are equally fast.**

### Why Offset Pagination Breaks Under Concurrent Writes

With offset pagination (`SKIP 1000, LIMIT 20`), the database counts rows from the beginning each time. If 50 new products are inserted while you're on page 50, every row shifts forward by 50 positions. This means:
- **Duplicates**: Products you already saw shift into the range of your next page and appear again.
- **Skipped products**: Products you haven't seen yet shift past your current position and are never returned.
- **Performance degrades with depth**: `SKIP 100000` must walk and discard 100,000 rows before returning the ones you want.

### Why Keyset Pagination Doesn't Break

The cursor is a **fixed point in the sort order**, not a row count. When 50 new products are inserted with `createdAt` newer than anything already fetched:
- They land **above** the cursor in the sort order.
- The meaning of "everything after this cursor" is unchanged — no products shift, no duplicates, no gaps.

When existing products are updated (e.g., `updatedAt` bumped):
- `createdAt` and `_id` are immutable after creation, so the product's position in the sort order doesn't change.
- The cursor still points to the same boundary.

### What the `_id` Tiebreaker Protects Against

Many products can share the same `createdAt` timestamp (e.g., batch inserts). Without a tiebreaker, the cursor `{ createdAt: "2025-03-15T08:30:00Z" }` is ambiguous — it could point to any of dozens of products at that timestamp, causing some to be duplicated and others skipped across pages. The `_id` field (a globally unique ObjectId) breaks all ties, giving every product a **strictly unique position** in the sort order. The pair `(createdAt, _id)` is a total order with no ties, so no product can ever be duplicated or skipped.

> **Note on filtered views**: Changing a product's category mid-browse may cause it to enter/leave a *filtered* view — that's expected behavior, not a bug. The ordering and no-dup/no-skip guarantees apply to the unfiltered sort key `(createdAt, _id)`.

---

## Indexing Strategy

Two compound indexes power the pagination:

```js
// Unfiltered cursor pagination
{ createdAt: -1, _id: -1 }

// Filtered cursor pagination (by category)
{ category: 1, createdAt: -1, _id: -1 }
```

The second index is critical: it allows MongoDB to satisfy both the category equality filter **and** the sort order from a single index scan (`IXSCAN`), avoiding a costly in-memory sort (`SORT` stage). Without it, filtering by category would fall back to a collection scan followed by an in-memory sort — catastrophically slow at 200k documents.

### Verifying Index Usage

You can verify index usage with `explain()`:

```js
// In mongo shell:
db.products.find({
  category: "Electronics",
  $or: [
    { createdAt: { $lt: ISODate("2025-06-01") } },
    { createdAt: ISODate("2025-06-01"), _id: { $lt: ObjectId("...") } }
  ]
}).sort({ createdAt: -1, _id: -1 }).limit(20).explain("executionStats")

// Look for:
//   winningPlan.stage: "IXSCAN" (not "COLLSCAN")
//   executionStats.totalDocsExamined ≈ limit (not 200,000)
```

---

## API Endpoints

### `GET /api/products`

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `cursor` | string (base64) | null | Opaque cursor from previous response |
| `limit` | number | 20 | Max 100, clamped server-side |
| `category` | string | null | Must be from the fixed category list |

**Response:**
```json
{
  "success": true,
  "data": [{ "_id": "...", "name": "...", "category": "...", "price": 0, "createdAt": "..." }],
  "nextCursor": "base64string-or-null",
  "hasMore": true,
  "estimatedTotal": 200000
}
```

### `GET /api/categories`
Returns the fixed category list. No database query.

### `GET /api/health`
Health check endpoint.

---

## NPM Scripts (Backend)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the API server with nodemon |
| `npm run seed` | Generate 200,000 products (batched insertMany) |
| `npm run simulate-writes` | Insert 50 + update 50 products (for testing) |
| `npm test` | Run pagination correctness test |

---

## Project Structure

```
product-browser/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── constants/categories.js
│   │   ├── features/products/
│   │   │   ├── product.model.js
│   │   │   ├── product.service.js       # cursor encode/decode + query building
│   │   │   ├── product.controller.js
│   │   │   ├── product.validation.js
│   │   │   └── product.routes.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/
│   │   ├── seed.js
│   │   └── simulateConcurrentWrites.js
│   └── test/
│       └── paginationCorrectness.test.js
└── frontend/
    └── src/
        ├── features/products/
        │   ├── api/productApi.js
        │   ├── hooks/useProducts.js
        │   └── components/
        │       ├── ProductCard.jsx
        │       ├── ProductGrid.jsx       # react-window virtualized grid
        │       ├── CategoryFilter.jsx
        │       └── LoadMoreSentinel.jsx   # IntersectionObserver trigger
        ├── shared/components/
        │   ├── Skeleton.jsx
        │   └── ErrorState.jsx
        ├── App.jsx
        └── main.jsx
```

---

## License

MIT
