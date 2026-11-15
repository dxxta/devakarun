import type { Block } from 'payload'

const languageOptions = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'bash',
  'css',
  'html',
  'sql',
  'yaml',
  'diff',
  'markdown',
  'http',
  'dockerfile',
  'plaintext',
]

export const CodeBlock: Block = {
  slug: 'code',
  labels: { singular: 'Code block', plural: 'Code blocks' },
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'ts',
      options: languageOptions,
    },
    {
      name: 'code',
      type: 'code',
      required: true,
      admin: { language: 'plaintext' },
    },
  ],
}
