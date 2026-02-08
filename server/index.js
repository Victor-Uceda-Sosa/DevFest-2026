const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { expressRouter } = require('@flowglad/server/express');
const { flowglad } = require('./flowglad');

const app = express();
const PORT = process.env.FLOWGLAD_SERVER_PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Log 500s so you can see the real error in the terminal
app.use('/api/flowglad', (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 500 && body?.error) {
      console.error('[Flowglad] 500 error:', JSON.stringify(body.error, null, 2));
    }
    return originalJson(body);
  };
  next();
});

app.use(
  '/api/flowglad',
  expressRouter({
    flowglad,
    getCustomerExternalId: async (req) => {
      const id = req.headers['x-customer-id'];
      if (!id) {
        throw new Error('User not authenticated');
      }
      return id;
    },
  })
);

// Catch async errors from the router (Express 4 doesn't await route handlers)
app.use('/api/flowglad', (err, req, res, next) => {
  console.error('[Flowglad] Unhandled error:', err?.message || err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', json: { message: err?.message || 'Internal server error' } },
    data: null,
  });
});

app.listen(PORT, () => {
  console.log(`Flowglad API server running at http://localhost:${PORT}`);
  if (!process.env.FLOWGLAD_SECRET_KEY) {
    console.warn('Warning: FLOWGLAD_SECRET_KEY is not set. Set it in .env for checkout to work.');
  }
});
