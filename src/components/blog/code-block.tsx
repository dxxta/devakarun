import { createHighlighter } from 'shiki'
import { Badge } from '@/components/ui/badge'
import { CopyCodeButton } from '@/components/blog/copy-code-button'

const supportedLanguages = [
  'ts', 'tsx', 'js', 'jsx', 'json', 'bash', 'css', 'html', 'sql', 'yaml', 'diff', 'markdown', 'http', 'dockerfile', 'plaintext',
] as const

type CodeLanguage = (typeof supportedLanguages)[number]
type Highlighter = Awaited<ReturnType<typeof createHighlighter>>

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [...supportedLanguages],
  })
  return highlighterPromise
}

function normalizeLanguage(value?: string): CodeLanguage {
  const language = value?.trim().toLowerCase() ?? ''
  const aliases: Record<string, CodeLanguage> = {
    typescript: 'ts',
    javascript: 'js',
    console: 'bash',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    text: 'plaintext',
    txt: 'plaintext',
    plain: 'plaintext',
  }
  const normalized = aliases[language] ?? language
  return supportedLanguages.includes(normalized as CodeLanguage) ? normalized as CodeLanguage : 'plaintext'
}

function escapeHTML(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function CodeBlock({ code, language: sourceLanguage }: { code: string; language?: string }) {
  const language = normalizeLanguage(sourceLanguage)
  let html: string
  try {
    const highlighter = await getHighlighter()
    html = highlighter.codeToHtml(code, {
      lang: language,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    })
  } catch {
    html = `<pre class="shiki"><code>${escapeHTML(code)}</code></pre>`
  }

  return (
    <section aria-label={`${language} code`} className="not-prose my-6 overflow-hidden rounded-card border-2 border-ink-fixed bg-muted shadow-hard">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <Badge className="font-display text-xs uppercase" variant="secondary">{language}</Badge>
        <CopyCodeButton code={code} language={language} />
      </header>
      <div className="overflow-x-auto p-4 text-sm leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: html }} role="region" tabIndex={0} />
    </section>
  )
}
