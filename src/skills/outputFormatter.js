const GROUP_ORDER = ['Today', 'This Week', 'Next Week', 'Upcoming'];

export function formatOutput(items) {
  const groups = {};
  for (const item of items) {
    const key = GROUP_ORDER.includes(item.group) ? item.group : 'Upcoming';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return GROUP_ORDER
    .filter((g) => groups[g])
    .map((group) => {
      const sorted = [...groups[group]].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const lines = sorted.flatMap((item) => {
        const when   = item.when   ? ` [${item.when}]` : '';
        const urgent = item.urgent ? ' [urgent]'       : '';
        const line   = `- ${item.title}${when}${urgent}`;
        return item.notes ? [line, `  ↳ ${item.notes}`] : [line];
      });
      return `## ${group}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}
