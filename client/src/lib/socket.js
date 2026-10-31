import { io } from 'socket.io-client';
let socket;
export function getSocket() {
  if (!socket) socket = io(import.meta.env.VITE_SERVER_URL || '/', { auth: (cb) => cb({ token: localStorage.getItem('imovies_token') }) });
  return socket;
}
export function resetSocket() { socket?.disconnect(); socket = null; }
