export function validatePaginationParams(req, res, next) {
  const rawPage = parseInt(req.query.page, 10);
  const rawLimit = parseInt(req.query.limit, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 4;
  const offset = (page - 1) * limit;

  if (Number.isNaN(rawPage) || Number.isNaN(rawLimit)) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  // 把結果掛上 req 物件
  req.pagination = { page, limit, offset };

  next();
}