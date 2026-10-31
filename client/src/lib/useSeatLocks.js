import { useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { getSocket } from './socket';

// Live seat state for one show: booked seats (DB) + temporary holds (Socket.IO).
export function useSeatLocks(showId, userId) {
  const [booked, setBooked] = useState([]);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(!!showId);

  useEffect(() => {
    if (!showId) { setBooked([]); setLocks([]); return; }
    const s = getSocket();
    let alive = true;
    setLoading(true);
    api(`/shows/${showId}`).then((d) => alive && setBooked(d.bookedSeats)).finally(() => alive && setLoading(false));
    const onLocks = (p) => p.showId === showId && setLocks(p.locks);
    const onBooked = (p) => p.showId === showId && setBooked((b) => [...new Set([...b, ...p.seats])]);
    const onFreed = (p) => p.showId === showId && setBooked((b) => b.filter((x) => !p.seats.includes(x)));
    const join = () => s.emit('show:join', showId);
    s.on('show:locks', onLocks); s.on('show:booked', onBooked); s.on('show:freed', onFreed); s.on('connect', join);
    join();
    return () => {
      alive = false;
      s.emit('show:leave', showId);
      s.off('show:locks', onLocks); s.off('show:booked', onBooked); s.off('show:freed', onFreed); s.off('connect', join);
    };
  }, [showId]);

  const mine = locks.filter((l) => l.userId === userId);
  const othersHeld = new Set(locks.filter((l) => l.userId !== userId).map((l) => l.seat));
  const selected = mine.map((l) => l.seat);
  const expiresAt = mine.length ? Math.min(...mine.map((l) => l.until)) : null;

  const toggle = useCallback((seat) => new Promise((resolve) => {
    const s = getSocket();
    if (selected.includes(seat)) { s.emit('seat:unlock', { showId, seat }); resolve({ ok: true }); }
    else s.timeout(5000).emit('seat:lock', { showId, seat }, (err, res) => resolve(err ? { ok: false, error: 'Server did not respond. Try again.' } : res));
  }), [showId, selected.join(',')]); // eslint-disable-line

  return { booked: new Set(booked), othersHeld, selected, expiresAt, loading, toggle };
}
