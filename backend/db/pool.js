/**
 * db/pool.js
 *
 * Single shared pg.Pool instance for the entire application.
 *
 * Why a single pool?
 *   PostgreSQL connections are expensive to create (~10-50ms each).
 *   A pool keeps a set of warm connections and hands them out on demand.
 *   Creating multiple pools in different files would exhaust the server's
 *   connection limit and cause subtle "too many clients" errors under load.
 *
 * The connection string is read from the DATABASE_URL environment variable,
 * which is loaded from the .env file by server.js before this module is
 * first imported.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Maximum number of clients the pool will hold open simultaneously.
  // Tune this based on your PostgreSQL max_connections setting.
  max: 10,
  // Milliseconds a client must sit idle in the pool before being released.
  idleTimeoutMillis: 30000,
  // Milliseconds to wait for a connection before throwing an error.
  connectionTimeoutMillis: 5000,
});

// Log any unexpected pool-level errors so they surface in server logs
// rather than silently crashing the process.
pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err.message);
  process.exit(1);
});

module.exports = pool;
