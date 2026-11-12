export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'meta-externalfetcher',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'ImagesiftBot',
  'omgili',
  'omgilibot',
  'Timpibot',
  'YouBot',
  'DuckAssistBot',
  'MistralAI-User',
  'PetalBot',
  'AI2Bot',
  'Ai2Bot-Dolma',
  'Kangaroo Bot',
  'Webzio-Extended',
  'SemrushBot-OCOBOT',
  'img2dataset',
] as const

export function isAiCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false
  const normalizedUserAgent = userAgent.toLowerCase()
  return AI_CRAWLER_USER_AGENTS.some((token) => normalizedUserAgent.includes(token.toLowerCase()))
}
