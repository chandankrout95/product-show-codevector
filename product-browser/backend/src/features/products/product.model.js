const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    // Disable Mongoose's automatic timestamp management — we control these fields
    // explicitly so that createdAt is never mutated after creation (critical for
    // cursor pagination correctness under concurrent writes).
    timestamps: false,
  }
);

/**
 * Compound indexes for cursor-based pagination.
 *
 * 1. Unfiltered pagination: sort by (createdAt DESC, _id DESC).
 *    This is a direct B-tree range scan — O(log n) seek + O(limit) read,
 *    regardless of how deep the user has paged.
 *
 * 2. Filtered pagination (by category): the category prefix lets MongoDB
 *    satisfy both the equality filter and the sort order from a single index,
 *    avoiding an in-memory sort.
 */
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ category: 1, createdAt: -1, _id: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
