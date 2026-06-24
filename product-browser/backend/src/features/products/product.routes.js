const express = require('express');
const { listProducts, listCategories } = require('./product.controller');

const router = express.Router();

router.get('/products', listProducts);
router.get('/categories', listCategories);

module.exports = router;
