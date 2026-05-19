import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '/');

/**
 * Connects to the SENTINEL Socket.IO server with JWT auth.
 * Returns a function to register event listeners.
 *
 * @param {string|null} userId — pass null when logged out to skip connection
 * @returns {{ on: (event, cb) => () => void }}
 */
export default function useSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('sentinel_token');
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 2000,
    });

    socketRef.current.on('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  /** Subscribe to a socket event. Returns an unsubscribe function. */
  const on = useCallback((event, callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  return { on };
}
