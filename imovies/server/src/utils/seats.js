// Fixed auditorium layout: rows A-H, 10 seats per row.
export const ROWS = 'ABCDEFGH'.split('');
export const COLS = 10;
export const MAX_SEATS = 8;
export const categoryOf = (seat) => {
  const i = ROWS.indexOf(seat[0]);
  return i < 2 ? 'standard' : i < 6 ? 'premium' : 'recliner';
};
export const isValidSeat = (s) => /^[A-H](10|[1-9])$/.test(s);
export const priceOf = (show, seat) => show.prices[categoryOf(seat)];
