const express = require('express');
const cors = require('cors');
const productRoutes = require('./features/products/product.routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

const app = express();

// --- Middleware ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://product-show-codevector.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Product Browser API is running' });
});

// --- Feature routes ---
app.use('/api', productRoutes);

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
