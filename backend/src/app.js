const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const contactsRoutes  = require('./routes/contacts.routes');
const incidentsRoutes = require('./routes/incidents.routes');
const devicesRoutes   = require('./routes/devices.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  contactsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/devices',   devicesRoutes);
app.use('/api/telemetry', telemetryRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'SENTINEL API', ts: new Date().toISOString() })
);

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
