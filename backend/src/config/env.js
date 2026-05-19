const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[ENV] Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
  }
}

module.exports = { validateEnv };
