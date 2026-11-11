import type { Payload } from 'payload'
import type { Project } from '@/payload-types'
import { getReadme, getRepo, listDemoImages, type GitHubDemoImage } from './client'
import { getAndImportWebsitePreview } from './preview'

const MAX_DEMO_IMAGES = 10
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_README_LENGTH = 12_000
const MAX_INTRO_LENGTH = 1_500

function titleCaseRepoName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word ? `${word[0]!.toUpperCase()}${word.slice(1)}` : '')
    .join(' ')
}

function cleanReadme(markdown: string, title: string): string {
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '')
  const lines = withoutComments.split(/\r?\n/)
  const filtered: string[] = []
  let inHtmlBlock = false
  let inToc = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    const openingHtmlBlock = line.match(/^<(address|article|aside|details|div|footer|header|main|nav|p|section|table|ul|ol|h[1-6])\b/i)
    if (openingHtmlBlock && !new RegExp(`<\\/${openingHtmlBlock[1]}\\s*>`, 'i').test(line)) inHtmlBlock = true
    if (inHtmlBlock) {
      if (/^<\/(address|article|aside|details|div|footer|header|main|nav|p|section|table|ul|ol|h[1-6])\s*>/i.test(line) || /\/>$/.test(line)) inHtmlBlock = false
      continue
    }
    if (/^#+\s*(table of contents|contents)\s*#*$/i.test(line)) {
      inToc = true
      continue
    }
    if (inToc) {
      if (line && !/^(?:[-*+]\s+|\d+[.)]\s+)/.test(line) && !/^\[[^\]]+\]\(#[^)]+\)$/.test(line)) inToc = false
      else continue
    }
    if (!line || /^\[TOC\]$/i.test(line) || /^<[^>]+\s*\/?>$/.test(line)) continue
    if (/^(?:\[?!?\[[^\]]*\]\([^)]*(?:badge|shield|travis|coveralls|codecov|img\.shields)[^)]*\)\]?\s*)+$/i.test(line)) continue
    filtered.push(rawLine.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<\/?[a-z][^>]*>/gi, ''))
  }

  const cleaned = filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_README_LENGTH)
  const firstHeading = cleaned.match(/^#\s+(.+)\s*(?:\n|$)/)
  if (firstHeading?.[1]?.trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase()) {
    return cleaned.replace(/^#\s+.+(?:\n|$)/, '').trim()
  }
  return cleaned
}

type ReadmeFeature = { title: string; text: string }
type ArchitectureItem = { name: string; purpose: string; detail: string }
export type GithubReadmeSections = {
  intro: string
  features: ReadmeFeature[]
  architecture: { summary: string; items: ArchitectureItem[]; architectureDiagram: string }
}

function splitTableCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableCells(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function parseMarkdownTables(lines: string[]): ArchitectureItem[] {
  const items: ArchitectureItem[] = []
  for (let index = 0; index + 1 < lines.length; index += 1) {
    if (!lines[index]!.includes('|') || !isTableSeparator(lines[index + 1]!)) continue
    const width = splitTableCells(lines[index]!).length
    index += 2
    while (index < lines.length && lines[index]!.includes('|') && lines[index]!.trim()) {
      const cells = splitTableCells(lines[index]!)
      if (cells.length >= 2 && cells.some(Boolean)) {
        items.push({
          name: stripMarkdown(cells[0]!).replace(/`/g, '').trim(),
          purpose: stripMarkdown(cells[1]!).trim(),
          detail: cells.slice(2, Math.max(width, cells.length)).map((cell) => stripMarkdown(cell).trim()).filter(Boolean).join(' - '),
        })
      }
      index += 1
    }
    index -= 1
  }
  return items
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionForHeading(markdown: string, pattern: RegExp): string[] {
  const lines = markdown.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index]!.trim().match(/^(#{1,6})\s+(.+?)\s*#*$/)
    if (!heading || !pattern.test(heading[2]!)) continue
    const section: string[] = []
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const nextHeading = lines[cursor]!.trim().match(/^(#{1,6})\s+/)
      if (nextHeading && nextHeading[1]!.length <= heading[1]!.length) break
      section.push(lines[cursor]!)
    }
    return section
  }
  return []
}

function featureEntries(lines: string[]): ReadmeFeature[] {
  const entries: ReadmeFeature[] = []
  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '')
    if (!line || line.includes('|') || /^```|^~~~/.test(line)) continue
    const boldLead = line.match(/^\*\*(.+?)\*\*\s*[:\-–—]\s*(.*)$/)
    const plainLead = line.match(/^([^:]{1,80}):\s*(.*)$/)
    const separatorLead = !boldLead && !plainLead ? line.match(/^(.{1,80}?)\s+[–—-]\s+(.+)$/) : null
    const lead = boldLead ?? plainLead ?? separatorLead
    entries.push({
      title: lead ? stripMarkdown(lead[1]!) : '',
      text: stripMarkdown(lead ? lead[2]! : line).slice(0, 280),
    })
    if (entries.length >= 12) break
  }
  return entries
}

function architectureEntries(lines: string[]): ArchitectureItem[] {
  const tableItems = parseMarkdownTables(lines)
  if (tableItems.length) return tableItems.slice(0, 14)

  const items: ArchitectureItem[] = []
  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '')
    if (!line || line.includes('|') || /^#{1,6}\s|^```|^~~~/.test(line)) continue
    const boldLead = line.match(/^\*\*(.+?)\*\*\s*[:\-–—]\s*(.*)$/)
    const plainLead = line.match(/^([^:]{1,80}):\s*(.*)$/)
    const separatorLead = !boldLead && !plainLead ? line.match(/^(.{1,80}?)\s+[–—-]\s+(.+)$/) : null
    const lead = boldLead ?? plainLead ?? separatorLead
    items.push({
      name: lead ? stripMarkdown(lead[1]!) : stripMarkdown(line),
      purpose: lead ? stripMarkdown(lead[2]!) : '',
      detail: '',
    })
    if (items.length >= 14) break
  }
  return items
}

function architectureSummary(lines: string[]): string {
  const paragraphs: string[] = []
  let current: string[] = []
  const flush = () => {
    if (current.length) paragraphs.push(stripMarkdown(current.join(' ')))
    current = []
  }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flush()
      continue
    }
    if (/^#{1,6}\s|^[-*+]\s+|^\d+[.)]\s+|^```|^~~~|^\|/.test(line)) break
    current.push(line)
  }
  flush()
  return paragraphs.join(' ').slice(0, 600)
}

export function extractReadmeSections(markdown: string | null, title: string, fallback: string): GithubReadmeSections {
  const cleaned = markdown ? cleanReadme(markdown, title) : ''
  const lines = cleaned.split(/\r?\n/)
  const introLines: string[] = []
  for (const line of lines) {
    if (/^\s*#{1,6}\s+/.test(line)) break
    introLines.push(line)
  }
  const intro = introLines.join('\n').trim().slice(0, MAX_INTRO_LENGTH) || fallback || ''
  const features = featureEntries(sectionForHeading(cleaned, /^(features?|key features|highlights|capabilities)/i))
  const architectureLines = sectionForHeading(cleaned, /^(architecture|system design|how it works)/i)
  const architectureDiagram = architectureLines.join('\n').match(/```[^\n]*\n([\s\S]*?)\n```/)?.[1]?.trim().slice(0, 2_000) ?? ''
  const architecture = {
    summary: architectureSummary(architectureLines),
    items: architectureEntries(architectureLines),
    architectureDiagram,
  }
  return { intro, features, architecture }
}

type SerializedText = {
  type: 'text'
  version: 1
  detail: 0
  format: number
  mode: 'normal'
  style: ''
  text: string
}

type SerializedParagraphChild = SerializedText | { type: 'linebreak'; version: 1 }

function textNode(text: string, format = 0): SerializedText {
  return { type: 'text', version: 1, detail: 0, format, mode: 'normal', style: '', text }
}

function inlineNodes(source: string, allowLinks = true): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = []
  const pattern = allowLinks
    ? /\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)|`([^`]+)`/g
    : /\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)|`([^`]+)`/g
  let lastIndex = 0
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(textNode(source.slice(lastIndex, index)))
    if (allowLinks && match[1] && match[2]) {
      nodes.push({
        type: 'link', version: 2, direction: 'ltr', format: '', indent: 0,
        fields: { url: match[2], linkType: 'custom', newTab: true },
        children: inlineNodes(match[1], false),
      })
    } else {
      const token = match[0]
      const text = allowLinks ? (match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7]) : (match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5])
      if (text !== undefined) {
        if (token.startsWith('`')) nodes.push(textNode(text, 16))
        else if (token.startsWith('**') || token.startsWith('__')) nodes.push(textNode(text, 1))
        else nodes.push(textNode(text, 2))
      }
    }
    lastIndex = index + match[0].length
  }
  if (lastIndex < source.length) nodes.push(textNode(source.slice(lastIndex)))
  return nodes.length ? nodes : [textNode(source)]
}

function paragraphNode(source: string): Record<string, unknown> {
  return {
    type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
    children: inlineNodes(source),
  }
}

export function markdownToLexical(markdown: string): Project['description'] {
  const lines = markdown.split(/\r?\n/)
  const children: Array<Record<string, unknown>> = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]!.trim()
    if (!line || /^(?:---+|\*\*\*+|___+)$/.test(line)) {
      index += 1
      continue
    }

    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1]!.trim())) {
      index += 2
      while (index < lines.length && lines[index]!.trim().includes('|')) index += 1
      continue
    }

    const fence = line.match(/^(```+|~~~+)(.*)$/)
    if (fence) {
      const marker = fence[1]![0]!
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !new RegExp(`^\\s*${marker}{3,}\\s*$`).test(lines[index]!)) {
        codeLines.push(lines[index]!)
        index += 1
      }
      if (index < lines.length) index += 1
      const codeChildren: SerializedParagraphChild[] = []
      codeLines.forEach((codeLine, lineIndex) => {
        if (lineIndex) codeChildren.push({ type: 'linebreak', version: 1 })
        codeChildren.push(textNode(codeLine, 16))
      })
      if (codeChildren.length) children.push({
        type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
        children: codeChildren,
      })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/)
    if (heading) {
      const level = heading[1]!.length
      children.push({
        type: 'heading', tag: `h${level}`, version: 1, direction: 'ltr', format: '', indent: 0,
        children: inlineNodes(heading[2]!),
      })
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^\s*>/.test(lines[index]!)) {
        quoteLines.push(lines[index]!.replace(/^\s*>\s?/, '').trim())
        index += 1
      }
      children.push({
        type: 'quote', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [paragraphNode(quoteLines.join(' '))],
      })
      continue
    }

    const listMatch = line.match(/^(?:([-*+])\s+|(\d+)[.)]\s+)(.*)$/)
    if (listMatch) {
      const ordered = Boolean(listMatch[2])
      const items: Array<Record<string, unknown>> = []
      while (index < lines.length) {
        const itemMatch = lines[index]!.trim().match(/^(?:([-*+])\s+|(\d+)[.)]\s+)(.*)$/)
        if (!itemMatch || Boolean(itemMatch[2]) !== ordered) break
        items.push({
          type: 'listitem', version: 1, direction: 'ltr', format: '', indent: 0,
          value: items.length + 1,
          children: inlineNodes(itemMatch[3]!),
        })
        index += 1
      }
      children.push({
        type: 'list', listType: ordered ? 'number' : 'bullet', tag: ordered ? 'ol' : 'ul', start: 1,
        version: 1, direction: 'ltr', format: '', indent: 0, children: items,
      })
      continue
    }

    const paragraphLines = [line]
    index += 1
    while (index < lines.length) {
      const next = lines[index]!.trim()
      if (!next || /^(?:#{1,6}\s|>\s?|[-*+]\s+|\d+[.)]\s+|---+$|\*\*\*+$|___+$|```|~~~)/.test(next)) break
      paragraphLines.push(next)
      index += 1
    }
    children.push(paragraphNode(paragraphLines.join(' ')))
  }

  return {
    root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
  } as Project['description']
}

function fallbackDescription(fallback: string): Project['description'] {
  return {
    root: {
      type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
      children: [paragraphNode(fallback || 'Project details are available in the repository.')],
    },
  } as Project['description']
}

function readmeToLexical(markdown: string | null, title: string, fallback: string): Project['description'] {
  const cleaned = markdown ? cleanReadme(markdown, title).slice(0, MAX_INTRO_LENGTH) : ''
  if (cleaned) {
    try {
      const converted = markdownToLexical(cleaned)
      const containsText = (value: unknown): boolean => {
        if (!value || typeof value !== 'object') return false
        if ('text' in value && typeof value.text === 'string' && value.text.trim()) return true
        return 'children' in value && Array.isArray(value.children) && value.children.some(containsText)
      }
      if (converted.root.children.some(containsText)) return converted
    } catch {
      return fallbackDescription(fallback)
    }
  }
  return fallbackDescription(fallback)
}

function mimeTypeFor(filename: string): string | undefined {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'
  return undefined
}

async function importDemoImage(
  payload: Payload,
  image: GitHubDemoImage,
  repoName: string,
  index: number,
): Promise<number> {
  const expectedMimeType = mimeTypeFor(image.name)
  if (!expectedMimeType) throw new Error(`Unsupported demo image type: ${image.name}`)
  const imageURL = new URL(image.download_url)
  if (imageURL.protocol !== 'https:' || imageURL.hostname !== 'raw.githubusercontent.com') {
    throw new Error('GitHub demo image URL is not on the official raw content host.')
  }
  const response = await fetch(imageURL, { cache: 'no-store', redirect: 'error' })
  if (!response.ok) throw new Error(`Failed to download demo image (${response.status}).`)
  const declaredSize = Number(response.headers.get('content-length') ?? 0)
  if (declaredSize > MAX_IMAGE_BYTES) throw new Error('Demo image exceeds the 8 MB limit.')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Demo image exceeds the 8 MB limit.')
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType && contentType !== expectedMimeType) throw new Error('Demo image content type does not match its file name.')

  const media = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt: `Demo screenshot ${index + 1} of ${repoName}` },
    file: {
      data: buffer,
      mimetype: expectedMimeType,
      name: image.name,
      size: buffer.byteLength,
    },
  })
  return media.id
}

export async function syncProject(payload: Payload, githubRepo: string): Promise<Project> {
  const [repo, readme, demoImages] = await Promise.all([
    getRepo(githubRepo),
    getReadme(githubRepo),
    listDemoImages(githubRepo),
  ])
  const title = titleCaseRepoName(repo.name)
  const existingResult = await payload.find({
    collection: 'projects',
    overrideAccess: true,
    showHiddenFields: true,
    limit: 1,
    where: { githubRepo: { equals: githubRepo } },
  })
  const existing = existingResult.docs[0] as (Project & {
    importedImageUrls?: string[] | null
    previewSource?: 'live' | 'demo' | 'none' | null
    previewImageUrl?: string | null
  }) | undefined
  const lockedFields = new Set(existing?.lockedFields ?? [])
  const data: Record<string, unknown> = {
    source: 'github',
    githubRepo,
    repoUrl: repo.html_url,
    liveUrl: repo.homepage || null,
    lastSyncedAt: new Date().toISOString(),
    stars: repo.stargazers_count,
    language: repo.language,
  }

  if (!lockedFields.has('title')) {
    data.title = title
    data.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  const summary = repo.description?.trim() || 'No description provided.'
  if (!lockedFields.has('summary')) data.summary = summary
  let readmeSections: GithubReadmeSections
  try {
    readmeSections = extractReadmeSections(readme, title, repo.description?.trim() || summary)
  } catch {
    readmeSections = {
      intro: repo.description?.trim() || summary,
      features: [],
      architecture: { summary: '', items: [], architectureDiagram: '' },
    }
  }
  if (!lockedFields.has('description')) data.description = readmeToLexical(readmeSections.intro, title, repo.description?.trim() || summary)
  if (!lockedFields.has('features')) data.features = readmeSections.features
  if (!lockedFields.has('architecture')) data.architecture = readmeSections.architecture

  let livePreview: Awaited<ReturnType<typeof getAndImportWebsitePreview>> = null
  if (!lockedFields.has('coverImage') && repo.homepage?.trim()) {
    try {
      const slug = existing?.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      livePreview = await getAndImportWebsitePreview(payload, repo.homepage.trim(), title, slug, existing)
    } catch (error) {
      payload.logger.warn({ err: error, githubRepo, msg: 'Could not import live website preview; falling back to repository demo images.' })
    }
  }

  const topicNames = new Set((repo.topics ?? []).map((topic) => topic.toLocaleLowerCase()))
  const techStackResult = await payload.find({
    collection: 'tech-stack',
    overrideAccess: true,
    limit: 1000,
  })
  const existingTechStackIDs = (existing?.techStack ?? []).map((technology) =>
    typeof technology === 'number' ? technology : technology.id,
  )
  const matchedTechStackIDs = techStackResult.docs
    .filter((technology) => topicNames.has(technology.name.toLocaleLowerCase()))
    .map((technology) => technology.id)
  data.techStack = [...new Set([...existingTechStackIDs, ...matchedTechStackIDs])]

  const importedURLs = new Set(existing?.importedImageUrls ?? [])
  const currentGallery = (existing?.gallery ?? []).map((item) => typeof item === 'object' ? item.id : item)
  const newGallery = [...currentGallery]
  const existingCover = existing?.coverImage
  const existingCoverID = typeof existingCover === 'number'
    ? existingCover
    : existingCover && typeof existingCover === 'object'
      ? existingCover.id
      : undefined
  let coverImage: number | undefined = livePreview?.mediaID
  let selectedDemoCover = false
  const allowedImages = demoImages.slice(0, MAX_DEMO_IMAGES)
  for (const [index, image] of allowedImages.entries()) {
    if (importedURLs.has(image.download_url)) {
      if (index === 0 && livePreview && !lockedFields.has('gallery') && existing?.previewSource !== 'live' && existingCoverID !== undefined && !newGallery.includes(existingCoverID)) {
        newGallery.push(existingCoverID)
      }
      if (index === 0 && !livePreview && !lockedFields.has('coverImage')) {
        const priorDemoCover = existing?.previewSource === 'live' ? currentGallery[0] : existingCoverID
        if (priorDemoCover !== undefined) {
          coverImage = priorDemoCover
          selectedDemoCover = true
        }
      }
      continue
    }
    const destination = livePreview
      ? !lockedFields.has('gallery') ? 'gallery' : undefined
      : index === 0 && !lockedFields.has('coverImage')
        ? 'cover'
        : !lockedFields.has('gallery')
          ? 'gallery'
          : undefined
    if (!destination) continue
    const mediaID = await importDemoImage(payload, image, repo.name, index)
    importedURLs.add(image.download_url)
    if (destination === 'cover') {
      coverImage = mediaID
      selectedDemoCover = true
    }
    else newGallery.push(mediaID)
  }

  if (!lockedFields.has('coverImage')) {
    data.coverImage = coverImage ?? null
    data.previewSource = livePreview ? 'live' : selectedDemoCover ? 'demo' : 'none'
    data.previewImageUrl = livePreview?.imageURL ?? null
  }
  if (!lockedFields.has('gallery')) data.gallery = newGallery
  data.importedImageUrls = [...importedURLs]

  if (existing) {
    const updated = await payload.update({
      collection: 'projects',
      id: existing.id,
      overrideAccess: true,
      data: data as never,
    }) as Project
    const obsoletePreviewID = livePreview?.obsoleteMediaID
      ?? (!lockedFields.has('coverImage') && existing.previewSource === 'live' && !livePreview && existingCoverID !== undefined && existingCoverID !== coverImage
        ? existingCoverID
        : undefined)
    if (obsoletePreviewID !== undefined) {
      try {
        await payload.delete({ collection: 'media', id: obsoletePreviewID, overrideAccess: true })
      } catch (error) {
        payload.logger.warn({ err: error, obsoletePreviewID, msg: 'Could not remove the replaced live preview image.' })
      }
    }
    return updated
  }

  return await payload.create({
    collection: 'projects',
    overrideAccess: true,
    data: {
      ...data,
      title: title,
      summary,
      description: readmeToLexical(readmeSections.intro, title, repo.description?.trim() || summary),
      features: readmeSections.features,
      architecture: readmeSections.architecture,
    } as never,
  }) as Project
}
