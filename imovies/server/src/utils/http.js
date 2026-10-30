export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500, message = err.message || 'Something went wrong';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid ID or value'; }
  else if (err.code === 11000) { status = 409; message = 'That value already exists'; }
  else if (status === 500) console.error(err);
  res.status(status).json({ message });
};
