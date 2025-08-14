const errorHandler = (err, req, res, next) => {
  // Parfois, une erreur peut arriver avec un code de succès (200), on le change en 500.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };