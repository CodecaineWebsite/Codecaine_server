export function validateSortParam(req, res, next) {
  const allowed = ['recent', 'top'];
  const sort = req.query.sort || 'recent';

  if (!allowed.includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort parameter' });
  }

  req.sort = sort;
  next();
}