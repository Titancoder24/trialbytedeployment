// Backend removed: local DB pool is no longer used in this app.
export {}; // keep this module valid

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
