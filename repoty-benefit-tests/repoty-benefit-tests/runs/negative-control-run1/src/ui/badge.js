const SIZE_CLASSES = {
  xs: 'h-4 px-1.5 text-[10px]',
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-2.5 text-sm',
  lg: 'h-7 px-3 text-sm'
};

export function badgeClass(size = 'md') {
  return SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
}

export function renderBadge(label, size = 'md') {
  return `<span class="badge ${badgeClass(size)}">${label}</span>`;
}
