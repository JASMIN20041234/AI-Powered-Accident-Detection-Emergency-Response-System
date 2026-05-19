const logger = require('../utils/logger');

const PG_UNIQUE    = '23505';
const PG_FK        = '23503';
const PG_NOT_NULL  = '23502';

function errorMiddleware(err, req, res, next) {
  logger.error(`${req.method} ${req.path} —`, err.message);

  if (err.code === PG_UNIQUE)   return res.status(409).json({ error: 'A record with that value already exists' });
  if (err.code === PG_FK)       return res.status(400).json({ error: 'Referenced record does not exist' });
  if (err.code === PG_NOT_NULL) return res.status(400).json({ error: 'A required field is missing' });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorMiddleware;
