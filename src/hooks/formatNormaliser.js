export function normaliseFormat(items) {
  return items
    .filter((item) => typeof item.title === 'string' && item.title.length > 0)
    .map((item) => ({
      ...item,
      title: item.title,
      notes: typeof item.notes === 'string' ? item.notes : '',
    }));
}
