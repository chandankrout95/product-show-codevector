/**
 * Fixed list of product categories.
 * Shared by the seed script and the /api/categories endpoint.
 * Never derived via an expensive distinct() query against the collection.
 */
const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
  'Automotive',
  'Garden & Outdoor',
  'Pet Supplies',
  'Office Products',
  'Musical Instruments',
  'Grocery',
  'Baby Products',
  'Tools & Hardware',
  'Jewelry',
  'Shoes',
  'Furniture',
];

module.exports = CATEGORIES;
