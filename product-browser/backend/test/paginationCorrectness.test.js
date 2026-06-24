/**
 * Pagination Correctness Test
 *
 * This test proves that cursor-based (keyset) pagination is correct even when
 * concurrent writes (inserts + updates) happen mid-browse.
 *
 * Steps:
 * 1. Snapshot all _ids currently in the database.
 * 2. Begin paginating from cursor=null with limit=20.
 * 3. Partway through (after ~5 pages), trigger concurrent writes (50 inserts + 50 updates).
 * 4. Continue paginating until hasMore=false.
 * 5. Assert:
 *    a. Zero duplicate _ids in the collected results.
 *    b. Every _id from the original snapshot appears exactly once.
 *
 * Run:  npm test
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Load env vars
require('dotenv').config();

const Product = require('../src/features/products/product.model');
const { getProducts } = require('../src/features/products/product.service');
const { simulateConcurrentWrites } = require('../scripts/simulateConcurrentWrites');

const PAGE_LIMIT = 20;
const TRIGGER_WRITES_AFTER_PAGES = 5; // trigger concurrent writes after this many pages

describe('Cursor Pagination Correctness Under Concurrent Writes', () => {
  let originalIds = new Set();

  before(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for testing.\n');
  });

  after(async () => {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  });

  it('should return every original product exactly once with zero duplicates, even after concurrent writes', async () => {
    // 1. Snapshot all existing _ids
    console.log('Step 1: Snapshotting all existing _ids...');
    const allDocs = await Product.find({}).select('_id').lean().exec();
    originalIds = new Set(allDocs.map((doc) => doc._id.toString()));
    const originalCount = originalIds.size;
    console.log(`  Snapshot contains ${originalCount.toLocaleString()} products.\n`);

    assert.ok(originalCount > 0, 'Database should contain products. Run `npm run seed` first.');

    // 2. Paginate through all products
    console.log('Step 2: Paginating through all products...');
    const collectedIds = [];
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;
    let writesTriggered = false;

    while (hasMore) {
      const result = await getProducts({ cursor, limit: PAGE_LIMIT });

      for (const product of result.data) {
        collectedIds.push(product._id.toString());
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore;
      pageCount++;

      // Log progress every 500 pages
      if (pageCount % 500 === 0) {
        console.log(`  Fetched ${pageCount} pages (${collectedIds.length.toLocaleString()} products)...`);
      }

      // 3. Trigger concurrent writes partway through
      if (!writesTriggered && pageCount === TRIGGER_WRITES_AFTER_PAGES) {
        console.log(`\nStep 3: Triggering concurrent writes after page ${pageCount}...`);
        await simulateConcurrentWrites();
        writesTriggered = true;
        console.log('  Continuing pagination after writes...\n');
      }
    }

    console.log(`\n  Pagination complete: ${pageCount.toLocaleString()} pages, ${collectedIds.length.toLocaleString()} products collected.`);
    assert.ok(writesTriggered, 'Concurrent writes should have been triggered during pagination.');

    // 4. Check for duplicates
    console.log('\nStep 4: Checking for duplicate _ids...');
    const idSet = new Set();
    const duplicates = [];

    for (const id of collectedIds) {
      if (idSet.has(id)) {
        duplicates.push(id);
      }
      idSet.add(id);
    }

    if (duplicates.length > 0) {
      console.log(`  FAIL: Found ${duplicates.length} duplicate _ids.`);
      console.log(`  First 5 duplicates: ${duplicates.slice(0, 5).join(', ')}`);
    } else {
      console.log('  PASS: Zero duplicate _ids.');
    }
    assert.equal(duplicates.length, 0, `Found ${duplicates.length} duplicate _ids`);

    // 5. Check that every original _id appears
    console.log('\nStep 5: Checking that every original _id appears in results...');
    const missingIds = [];
    for (const originalId of originalIds) {
      if (!idSet.has(originalId)) {
        missingIds.push(originalId);
      }
    }

    if (missingIds.length > 0) {
      console.log(`  FAIL: ${missingIds.length} original products missing from results.`);
      console.log(`  First 5 missing: ${missingIds.slice(0, 5).join(', ')}`);
    } else {
      console.log('  PASS: Every original product appeared exactly once.');
    }
    assert.equal(missingIds.length, 0, `${missingIds.length} original products missing from paginated results`);

    // 6. Summary
    const newProductsInResults = collectedIds.length - originalCount;
    console.log('\n========================================');
    console.log('  PAGINATION CORRECTNESS TEST: PASSED');
    console.log('========================================');
    console.log(`  Original products:     ${originalCount.toLocaleString()}`);
    console.log(`  Products in results:   ${collectedIds.length.toLocaleString()}`);
    console.log(`  New products picked up: ${newProductsInResults}`);
    console.log(`  Duplicates:            0`);
    console.log(`  Missing originals:     0`);
    console.log('========================================\n');
  });
});
