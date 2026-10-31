export const ROWS = 'ABCDEFGH'.split('');
export const COLS = 10;
export const MAX_SEATS = 8;
export const categoryOf = (seat) => { const i = ROWS.indexOf(seat[0]); return i < 2 ? 'standard' : i < 6 ? 'premium' : 'recliner'; };
export const CATEGORY_LABEL = { standard: 'Standard', premium: 'Premium', recliner: 'Recliner' };
export const priceOf = (show, seat) => show.prices[categoryOf(seat)];
export const sortSeats = (a) => [...a].sort((x, y) => x[0].localeCompare(y[0]) || parseInt(x.slice(1)) - parseInt(y.slice(1)));
