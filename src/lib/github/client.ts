import { env } from '@/lib/env'

const API_ROOT = 'https://api.github.com'
const etagCache = new Map<string, { etag: string; body: unknown }>()

export type GitHubRepo = {
  name: string
  description: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  homepage: string | null
  html_url: string
}

export type GitHubDemoImage = { name: string; download_url: string }

export class GitHubApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor() {
    super('GitHub API rate limit exceeded.', 403)
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubNotFoundError extends GitHubApiError {
  constructor() {
    super('GitHub resource not found.', 404)
    this.name = 'GitHubNotFoundError'
  }
}

export function clearGitHubCache(): void {
  etagCache.clear()
}

function repoPath(fullName: string): string {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) {
    throw new Error('GitHub repository must be in owner/name format.')
  }
  return fullName.split('/').map(encodeURIComponent).join('/')
}

async function getJson<T>(url: string): Promise<T> {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'akarun-site',
    'X-GitHub-Api-Version': '2022-11-28',
  })
  if (env.GITHUB_TOKEN) headers.set('Authorization', `Bearer ${env.GITHUB_TOKEN}`)
  const cached = etagCache.get(url)
  if (cached) headers.set('If-None-Match', cached.etag)

  const response = await fetch(url, { headers, cache: 'no-store' })
  if (response.status === 304) {
    if (!cached) throw new Error('GitHub returned 304 without a cached response.')
    return cached.body as T
  }
  if (response.status === 403) throw new GitHubRateLimitError()
  if (response.status === 404) throw new GitHubNotFoundError()
  if (!response.ok) throw new GitHubApiError(`GitHub API request failed with status ${response.status}.`, response.status)

  const body = await response.json() as T
  const etag = response.headers.get('etag')
  if (etag) etagCache.set(url, { etag, body })
  return body
}

export async function getRepo(fullName: string): Promise<GitHubRepo> {
  return getJson<GitHubRepo>(`${API_ROOT}/repos/${repoPath(fullName)}`)
}

export async function getReadme(fullName: string): Promise<string | null> {
  try {
    const response = await getJson<{ content?: string; encoding?: string }>(
      `${API_ROOT}/repos/${repoPath(fullName)}/readme`,
    )
    if (response.encoding !== 'base64' || typeof response.content !== 'string') return null
    return Buffer.from(response.content, 'base64').toString('utf8')
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return null
    throw error
  }
}

export async function listDemoImages(fullName: string): Promise<GitHubDemoImage[]> {
  try {
    const files = await getJson<Array<{ name?: string; download_url?: string | null }>>(
      `${API_ROOT}/repos/${repoPath(fullName)}/contents/docs/demos`,
    )
    if (!Array.isArray(files)) return []
    return files
      .filter((file): file is { name: string; download_url: string } => {
        if (typeof file.name !== 'string' || typeof file.download_url !== 'string') return false
        return /\.(?:png|jpe?g|webp|gif)$/i.test(file.name)
      })
      .map(({ name, download_url }) => ({ name, download_url }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return []
    throw error
  }
}
