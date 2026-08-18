const isProduction = () => process.env.NODE_ENV === 'production';

export const errorHandler = (err, req, res, _next) => {
  console.error('SERVER ERROR:', err.message, isProduction() ? '' : err.stack);

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Multer surfaces upload problems with its own codes.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Image exceeds the 10 MB upload limit.' });
  }

  // Postgres unique-violation — usually a duplicate slug, SKU or coupon code.
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }

  const body = {
    success: false,
    // Never leak internal failure detail to clients in production.
    message: isProduction() && statusCode >= 500 ? 'Something went wrong. Please try again.' : err.message,
  };

  if (!isProduction()) body.stack = err.stack;

  res.status(statusCode).json(body);
};
