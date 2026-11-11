// @vitest-environment node

import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearGitHubCache, getReadme, getRepo, GitHubRateLimitError, listDemoImages } from '@/lib/github/client'
import { syncProject } from '@/lib/github/sync'
import { POST } from '@/app/api/github-sync/route'

let payload: Payload
const createdProjectIDs: (number | string)[] = []
const createdTechIDs: (number | string)[] = []

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  for (const id of createdProjectIDs) {
    await payload.delete({ collection: 'projects', id, overrideAccess: true }).catch(() => undefined)
  }
  for (const id of createdTechIDs) {
    await payload.delete({ collection: 'tech-stack', id, overrideAccess: true }).catch(() => undefined)
  }
  await payload?.destroy()
})

beforeEach(() => {
  vi.unstubAllGlobals()
  clearGitHubCache()
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

describe('GitHub client', () => {
  it('parses repository metadata, decoded README markdown, and sorted demo images', async () => {
    let repoRequests = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/repos/example/demo')) {
        repoRequests += 1
        if (repoRequests > 1) return new Response(null, { status: 304 })
        return jsonResponse({ name: 'demo', description: 'A demo repo', topics: ['typescript'], stargazers_count: 7, homepage: 'https://demo.example', html_url: 'https://github.com/example/demo' }, 200, { etag: 'repo-v1' })
      }
      if (url.endsWith('/repos/example/demo/readme')) {
        return jsonResponse({ content: Buffer.from('# README').toString('base64'), encoding: 'base64' })
      }
      return jsonResponse([
        { name: 'z.webp', download_url: 'https://raw.example/z.webp' },
        { name: 'notes.txt', download_url: 'https://raw.example/notes.txt' },
        { name: 'a.PNG', download_url: 'https://raw.example/a.PNG' },
      ])
    })
    vi.stubGlobal('fetch', fetchMock)

    const repo = await getRepo('example/demo')
    expect((await getRepo('example/demo')).name).toBe(repo.name)
    expect(repo.stargazers_count).toBe(7)
    expect(await getReadme('example/demo')).toBe('# README')
    expect((await listDemoImages('example/demo')).map((image) => image.name)).toEqual(['a.PNG', 'z.webp'])
    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers
    expect(requestHeaders instanceof Headers ? requestHeaders.get('User-Agent') : new Headers(requestHeaders).get('User-Agent')).toBe('akarun-site')
    const cachedRequestHeaders = fetchMock.mock.calls[1]?.[1]?.headers
    expect(cachedRequestHeaders instanceof Headers ? cachedRequestHeaders.get('If-None-Match') : new Headers(cachedRequestHeaders).get('If-None-Match')).toBe('repo-v1')
  })

  it('returns empty optional resources for 404 and a typed error for 403', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/readme') || url.endsWith('/contents/docs/demos')) return jsonResponse({}, 404)
      return jsonResponse({ message: 'API rate limit exceeded' }, 403)
    }))
    await expect(getReadme('example/missing')).resolves.toBeNull()
    await expect(listDemoImages('example/missing')).resolves.toEqual([])
    await expect(getRepo('example/limited')).rejects.toBeInstanceOf(GitHubRateLimitError)
  })
})

describe('GitHub project sync', () => {
  it('creates, updates, respects locked fields, and imports each demo image only once', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const githubRepo = `akarun-test-${suffix}/portfolio-demo`
    const tech = await payload.create({
      collection: 'tech-stack', overrideAccess: true,
      data: { name: 'TypeScript', category: 'frontend', order: 999 },
    })
    createdTechIDs.push(tech.id)
    let revision = 1
    let imageDownloads = 0
    const imageBytes = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#ffffff' } }).png().toBuffer()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith(`/repos/${githubRepo}`)) {
        return jsonResponse({
          name: 'portfolio-demo', description: revision === 1 ? 'First summary' : 'Updated summary',
          topics: ['typescript'], stargazers_count: 4, homepage: 'https://live.example',
          html_url: `https://github.com/${githubRepo}`,
        })
      }
      if (url.endsWith(`/repos/${githubRepo}/readme`)) {
        return jsonResponse({ content: Buffer.from(revision === 1 ? 'First README' : 'Updated README').toString('base64'), encoding: 'base64' })
      }
      if (url.endsWith(`/repos/${githubRepo}/contents/docs/demos`)) {
        return jsonResponse([{ name: 'demo.png', download_url: `https://raw.githubusercontent.com/${suffix}/demo.png` }])
      }
      if (url === `https://raw.githubusercontent.com/${suffix}/demo.png`) {
        imageDownloads += 1
        return new Response(imageBytes, { status: 200, headers: { 'content-type': 'image/png', 'content-length': String(imageBytes.length) } })
      }
      throw new Error(`Unexpected mocked URL: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await syncProject(payload, githubRepo)
    createdProjectIDs.push(first.id)
    expect(first.title).toBe('Portfolio Demo')
    expect(first.summary).toBe('First summary')
    expect(first.stars).toBe(4)
    expect((first.techStack ?? []).map((item) => typeof item === 'object' ? item.id : item)).toContain(tech.id)
    expect(first.coverImage).toBeTruthy()
    const firstWithHiddenFields = await payload.findByID({
      collection: 'projects', id: first.id, overrideAccess: true, showHiddenFields: true,
    })
    expect(firstWithHiddenFields.importedImageUrls).toContain(`https://raw.githubusercontent.com/${suffix}/demo.png`)

    await payload.update({
      collection: 'projects', id: first.id, overrideAccess: true,
      data: { summary: 'Owner summary', lockedFields: ['summary', 'description'] },
    })
    revision = 2
    clearGitHubCache()
    const second = await syncProject(payload, githubRepo)
    expect(second.id).toBe(first.id)
    expect(second.summary).toBe('Owner summary')
    expect(second.stars).toBe(4)
    const secondWithHiddenFields = await payload.findByID({
      collection: 'projects', id: second.id, overrideAccess: true, showHiddenFields: true,
    })
    expect(secondWithHiddenFields.importedImageUrls).toHaveLength(1)
    expect(imageDownloads).toBe(1)
  })
})

describe('GitHub sync endpoint access', () => {
  it('returns 401 for an unauthenticated request without the cron secret', async () => {
    const response = await POST(new Request('http://localhost/api/github-sync', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
    }))
    expect(response.status).toBe(401)
  })
})
