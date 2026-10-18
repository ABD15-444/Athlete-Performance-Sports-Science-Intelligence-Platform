/**
 * server.js
 *
 * Entry point for the Athlete Performance & Sports Science Intelligence Platform API.
 *
 * Architecture decisions:
 *   • dotenv is loaded first — before any other module — so that DATABASE_URL
 *     is available when db/pool.js initialises the connection pool.
 *   • All routes are mounted under /api for clean namespacing.
 *   • CORS is enabled for all origins in development; tighten this in production
 *     by setting origin to your frontend domain.
 *   • A global error handler catches any unhandled Express errors.
 */

require('dotenv').config(); // Must be the very first statement

const express      = require('express');
const cors         = require('cors');

// Route modules
const athleteRoutes   = require('./routes/athletes');
const teamRoutes      = require('./routes/teams');
const sessionRoutes   = require('./routes/sessions');
const injuryRoutes    = require('./routes/injuries');
const biometricRoutes = require('./routes/biometrics');

const app  = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Parse JSON request bodies
app.use(express.json());

// Allow cross-origin requests from the React frontend (localhost:3000 in dev)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logger — prints method, path, and response time for every request
app.use((req, _res, next) => {
  req._startTime = Date.now();
  next();
});

// ---------------------------------------------------------------------------
// Health check
// GET /api/health
// Used by load balancers, CI pipelines, and the frontend to confirm the API
// is reachable before attempting data fetches.
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Athlete Performance API',
    version: '1.0.0',
  });
});

// ---------------------------------------------------------------------------
// Route mounting
// ---------------------------------------------------------------------------

// Athlete CRUD
app.use('/api/athletes', athleteRoutes);

// Biometric logging (nested under athletes)
// e.g. POST /api/athletes/:id/biometrics
app.use('/api/athletes/:id/biometrics', biometricRoutes);

// Team routes
app.use('/api/teams', teamRoutes);

// Training sessions
app.use('/api/sessions', sessionRoutes);

// Injury routes — both /api/injuries/:id/status and /api/athletes/:id/injury
app.use('/api/injuries', injuryRoutes);
app.use('/api', injuryRoutes);  // catches /api/athletes/:id/injury and /api/athletes/:id/injuries

// ---------------------------------------------------------------------------
// 404 handler — catches any request that didn't match a route above
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---------------------------------------------------------------------------
// Global error handler
// Catches errors thrown inside route handlers (in addition to try/catch blocks).
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🏋️  Athlete Performance API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Database    : ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);
});

module.exports = app; // exported for testing
