const { Server } = require('socket.io');
const { verify } = require('../utils/jwt');
const logger = require('../utils/logger');

let _io = null;

/**
 * Initialise Socket.IO on the HTTP server.
 * Each authenticated socket joins a private room: `user:<id>`.
 */
function init(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // JWT auth handshake
  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('authentication_error'));
    try {
      const payload = verify(token);
      socket.user = { id: payload.sub, username: payload.username };
      next();
    } catch {
      next(new Error('authentication_error'));
    }
  });

  _io.on('connection', (socket) => {
    const { id, username } = socket.user;
    socket.join(`user:${id}`);
    logger.info(`Socket connected: ${username} (${socket.id})`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${username} (${socket.id})`);
    });
  });

  logger.info('Socket.IO initialised');
  return _io;
}

function getIO() {
  if (!_io) throw new Error('Socket.IO has not been initialised — call init() first');
  return _io;
}

/** Emit an event to all sockets belonging to a user. */
function emitToUser(userId, event, data) {
  if (!_io) return;
  _io.to(`user:${userId}`).emit(event, data);
}

module.exports = { init, getIO, emitToUser };
