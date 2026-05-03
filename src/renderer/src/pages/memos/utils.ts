export function extractTags(content: string): string[] {
  const matches = content.match(/#([\w/一-龥]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(1)))].sort()
}
