import { fmtLong, fmtTime, money } from './format';

// Draws the ticket onto a canvas and saves it as a PNG (no extra libraries needed).
export async function downloadTicket(b) {
  const W = 900, H = 420, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#0B1226'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#7C5CFF'; x.fillRect(0, 0, 14, H);
  x.fillStyle = '#9DB4FF'; x.font = '600 22px sans-serif'; x.fillText('IMovies', 50, 56);
  x.fillStyle = '#fff'; x.font = '700 38px sans-serif';
  x.fillText(b.movie.title.slice(0, 28), 50, 112);
  const rows = [
    ['Theatre', `${b.theatre.name}, ${b.theatre.city}`],
    ['Date', fmtLong(b.show.startTime)],
    ['Time', `${fmtTime(b.show.startTime)}  (${b.show.format})`],
    ['Seats', b.seats.join(', ')],
    ['Amount (demo)', money(b.amount)],
  ];
  rows.forEach(([k, v], i) => {
    x.fillStyle = '#8F9BBF'; x.font = '500 15px sans-serif'; x.fillText(k, 50, 165 + i * 48);
    x.fillStyle = '#F2F4FB'; x.font = '600 20px sans-serif'; x.fillText(v.slice(0, 48), 50, 190 + i * 48);
  });
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = b.qr; });
  x.fillStyle = '#fff'; x.fillRect(W - 290, 70, 240, 240);
  x.drawImage(img, W - 290, 70, 240, 240);
  x.fillStyle = '#F2F4FB'; x.font = '600 20px sans-serif'; x.textAlign = 'center';
  x.fillText(b.reference, W - 170, 345);
  x.fillStyle = '#8F9BBF'; x.font = '13px sans-serif'; x.fillText('Demo ticket. No real payment was made.', W - 170, 372);
  const a = document.createElement('a');
  a.download = `IMovies-${b.reference}.png`; a.href = c.toDataURL('image/png'); a.click();
}
