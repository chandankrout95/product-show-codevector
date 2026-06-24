/**
 * Simulate concurrent writes that happen while a user is actively browsing.
 *
 * What it does:
 * 1. Inserts 50 new products with recent createdAt values (simulating new arrivals).
 * 2. Updates 50 random existing products (bumps updatedAt, leaves createdAt/_id untouched).
 *
 * This script can be:
 *   - Run standalone:  npm run simulate-writes
 *   - Imported as a function:  const { simulateConcurrentWrites } = require('./simulateConcurrentWrites');
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('../src/features/products/product.model');
const CATEGORIES = require('../src/constants/categories');

const INSERT_COUNT = 50;
const UPDATE_COUNT = 50;

async function simulateConcurrentWrites() {
  console.log(`\n--- Simulating concurrent writes ---`);

  // --- Insert 50 new products with very recent createdAt ---
  const newProducts = [];
  for (let i = 0; i < INSERT_COUNT; i++) {
    const createdAt = new Date(); // "just now" — lands above any existing cursor
    newProducts.push({
      name: `[NEW] ${faker.commerce.productName()}`,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      price: parseFloat(faker.commerce.price({ min: 1, max: 2000, dec: 2 })),
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Product.insertMany(newProducts, { ordered: false });
  console.log(`Inserted ${INSERT_COUNT} new products (recent createdAt).`);

  // --- Update 50 random existing products ---
  // Fetch 50 random _ids using $sample
  const randomDocs = await Product.aggregate([
    { $sample: { size: UPDATE_COUNT } },
    { $project: { _id: 1 } },
  ]);

  const bulkOps = randomDocs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { updatedAt: new Date() } }, // only updatedAt changes
    },
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { ordered: false });
  }

  console.log(`Updated ${randomDocs.length} existing products (bumped updatedAt only).`);
  console.log('--- Concurrent writes complete ---\n');

  return { insertedCount: INSERT_COUNT, updatedCount: randomDocs.length };
}

// --- Standalone execution ---
if (require.main === module) {
  (async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not set.');
      process.exit(1);
    }
    await mongoose.connect(uri);
    await simulateConcurrentWrites();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('Simulation failed:', err);
    process.exit(1);
  });
}

module.exports = { simulateConcurrentWrites };
