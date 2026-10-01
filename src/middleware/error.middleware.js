function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

function errorHandler(error, req, res, next) {
  const statusCode =
    error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }
  res
    .status(statusCode)
    .json({ error: error.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
