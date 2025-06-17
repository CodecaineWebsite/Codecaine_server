export function validatePaginationParams(req, res, next) {
  const rawPage = parseInt(req.query.page, 10);
  const rawLimit = parseInt(req.query.limit, 10);


  if (!Number.isInteger(rawPage) || rawPage < 1 ) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  if (req.query.limit !== undefined && (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50)) {
    return res.status(400).json({ error: "Invalid pagination parameter: limit" });
  }

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 4;
  // 把結果掛上 req 物件
  req.pagination = { page: rawPage, limit: rawLimit, offset: 0 };

  next();
}