export function normalizeProjectSearchFilters(filters = {}) {
  return {
    text: typeof filters.text === 'string' ? filters.text.trim().toLowerCase() : '',
    archived: filters.archived === 'all' ? 'all' : 'active',
  };
}
