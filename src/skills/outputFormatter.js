const MONTH_RE = /^\d{4}-\d{2}$/;

export function formatOutput(items) {
  const fallback = new Date().toISOString().slice(0, 7);
  const groups   = {};

  for (const item of items) {
    const key = item.group && MONTH_RE.test(item.group) ? item.group : fallback;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return Object.keys(groups)
    .sort()
    .map((month) => {
      const sorted = [...groups[month]].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const lines  = sorted.flatMap((item) => {
        const when   = item.when   ? ` [${item.when}]` : '';
        const urgent = item.urgent ? ' [urgent]'       : '';
        const line   = `- ${item.title}${when}${urgent}`;
        return item.notes ? [line, `  ↳ ${item.notes}`] : [line];
      });
      return `## ${month}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}
