export function paginateResponse({ data, total, page, limit }) {
  return {
    results: data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}