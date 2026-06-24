/**
 * Seed script — generates 200,000 products in batches via insertMany.
 *
 * Run:  npm run seed
 *
 * Strategy:
 * 1. Drop the existing collection (clean slate).
 * 2. Generate products in memory in batches of 5,000.
 * 3. Insert each batch with insertMany({ ordered: false }) for max throughput.
 * 4. After all inserts, drop and recreate indexes (faster than incremental build).
 * 5. Log progress and index confirmation.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('../src/features/products/product.model');
const CATEGORIES = require('../src/constants/categories');

const TOTAL_PRODUCTS = 200_000;
const BATCH_SIZE = 5_000;

// Two-year window for randomizing createdAt
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

function generateBatch(size) {
  const batch = [];
  for (let i = 0; i < size; i++) {
    const createdAt = new Date(NOW - Math.random() * TWO_YEARS_MS);
    batch.push({
      name: faker.commerce.productName(),
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      price: parseFloat(faker.commerce.price({ min: 1, max: 2000, dec: 2 })),
      createdAt,
      updatedAt: createdAt, // equal to createdAt at seed time
    });
  }
  return batch;
}

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set. Check your .env file.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  // --- Clean slate ---
  console.log('Dropping existing products collection...');
  try {
    await mongoose.connection.db.dropCollection('products');
    console.log('Collection dropped.\n');
  } catch (err) {
    if (err.codeName === 'NamespaceNotFound') {
      console.log('Collection did not exist — starting fresh.\n');
    } else {
      throw err;
    }
  }

  // --- Bulk insert ---
  const startTime = Date.now();
  let inserted = 0;

  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);
    const batch = generateBatch(batchSize);

    await Product.insertMany(batch, { ordered: false });

    inserted += batchSize;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Inserted ${inserted.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()}  (${elapsed}s)`);
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nAll ${TOTAL_PRODUCTS.toLocaleString()} products inserted in ${totalElapsed}s.\n`);

  // --- Rebuild indexes ---
  console.log('Dropping and recreating indexes...');
  await Product.collection.dropIndexes();
  await Product.syncIndexes();

  const indexes = await Product.collection.indexes();
  console.log('Indexes confirmed:');
  indexes.forEach((idx) => {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  // --- Done ---
  const count = await Product.estimatedDocumentCount();
  console.log(`\nFinal document count: ${count.toLocaleString()}`);
  console.log('Seed complete!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
