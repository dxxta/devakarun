export type BlogHeading = {
  id: string
  level: 2 | 3
  text: string
}

function nodeText(value: unknown): string {
  if (Array.isArray(value)) return value.map(nodeText).join('')
  if (typeof value !== 'object' || value === null) return ''
  const node = value as Record<string, unknown>
    const fields = typeof node.fields === 'object' && node.fields !== null ? node.fields as Record<string, unknown> : {}
    const blockText = node.type === 'block' && fields.blockType === 'code' && typeof fields.code === 'string' ? fields.code : ''
    return `${typeof node.text === 'string' ? node.text : ''}${blockText}${nodeText(node.children)}`
}

function slugBase(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

export function getBlogHeadings(content: unknown): BlogHeading[] {
  const headings: BlogHeading[] = []
  const usedIDs = new Set<string>()

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof value !== 'object' || value === null) return

    const node = value as Record<string, unknown>
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      const text = nodeText(node.children).trim()
      const base = slugBase(text)
      let id = base
      let suffix = 2
      while (usedIDs.has(id)) id = `${base}-${suffix++}`
      usedIDs.add(id)
      headings.push({ id, level: node.tag === 'h2' ? 2 : 3, text })
    }
    visit(node.children)
  }

  const editorState = typeof content === 'object' && content !== null && 'root' in content
    ? (content as Record<string, unknown>).root
    : content
  visit(editorState)
  return headings
}
