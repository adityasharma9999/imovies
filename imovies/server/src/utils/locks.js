// Temporary seat holds (in memory). showId -> Map(seat -> { userId, until })
export const TTL_MS = 5 * 60 * 1000;
const holds = new Map();
const room = (showId) => { if (!holds.has(showId)) holds.set(showId, new Map()); return holds.get(showId); };

export function prune() {
  const changed = new Set(), now = Date.now();
  for (const [showId, m] of holds) {
    for (const [seat, l] of m) if (l.until <= now) { m.delete(seat); changed.add(showId); }
    if (!m.size) holds.delete(showId);
  }
  return [...changed];
}
export const snapshot = (showId) =>
  [...(holds.get(showId) || [])].map(([seat, l]) => ({ seat, userId: l.userId, until: l.until }));

export function lock(showId, seat, userId, max) {
  prune();
  const m = room(showId), cur = m.get(seat);
  if (cur && cur.userId !== userId) return { ok: false, error: 'Someone else is holding that seat right now.' };
  const mine = [...m.values()].filter((l) => l.userId === userId).length;
  if (!cur && mine >= max) return { ok: false, error: `You can book up to ${max} seats at a time.` };
  m.set(seat, { userId, until: Date.now() + TTL_MS });
  return { ok: true };
}
export function unlock(showId, seat, userId) {
  const m = holds.get(showId);
  if (m?.get(seat)?.userId === userId) m.delete(seat);
}
export function releaseUser(showId, userId) {
  const m = holds.get(showId);
  if (!m) return;
  for (const [seat, l] of m) if (l.userId === userId) m.delete(seat);
}
export function release(showId, seats) { const m = holds.get(showId); seats.forEach((s) => m?.delete(s)); }
export function heldByOthers(showId, seats, userId) {
  prune();
  const m = holds.get(showId);
  return seats.filter((s) => m?.get(s) && m.get(s).userId !== userId);
}
export function heldByUser(showId, seats, userId) {
  const m = holds.get(showId);
  return seats.every((s) => m?.get(s)?.userId === userId);
}
