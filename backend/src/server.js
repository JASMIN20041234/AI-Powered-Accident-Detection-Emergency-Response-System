require('dotenv').config();
const http   = require('http');
const app    = require('./app');
const socket = require('./sockets');
const logger = require('./utils/logger');
const { validateEnv } = require('./config/env');

validateEnv();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
socket.init(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`SENTINEL API   → http://localhost:${PORT}`);
  logger.info(`Health check   → http://localhost:${PORT}/api/health`);
  logger.info(`Environment    → ${process.env.NODE_ENV || 'development'}`);
  logger.info(`SMS provider   → ${process.env.SMS_PROVIDER || 'callmebot'}`);
});
