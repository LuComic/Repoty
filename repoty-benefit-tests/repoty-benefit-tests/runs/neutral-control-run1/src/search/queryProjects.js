import { normalizeProjectSearchFilters } from './filters.js';

export function queryProjects(projects, filters = {}) {
  const normalized = normalizeProjectSearchFilters(filters);
  return projects.filter((project) => {
    if (normalized.text && !project.name.toLowerCase().includes(normalized.text)) {
      return false;
    }
    if (normalized.archived !== 'all' && project.archived) {
      return false;
    }
    return true;
  });
}
