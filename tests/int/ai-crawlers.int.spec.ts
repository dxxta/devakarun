import { describe, expect, it } from 'vitest'

import { isAiCrawler } from '@/lib/ai-crawlers'

describe('isAiCrawler', () => {
  it('matches crawler tokens case-insensitively within user-agent strings', () => {
    expect(isAiCrawler('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')).toBe(true)
    expect(isAiCrawler('ChatGPT-User/1.0')).toBe(true)
  })

  it('does not match regular browsers or standard search crawlers', () => {
    expect(isAiCrawler('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36')).toBe(false)
    expect(isAiCrawler('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15')).toBe(false)
    expect(isAiCrawler('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(false)
    expect(isAiCrawler(null)).toBe(false)
  })
})
