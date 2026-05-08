export function createProject(id, name, archived = false, tags = []) {
  return { id, name, archived, tags };
}
