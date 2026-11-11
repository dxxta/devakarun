import type { Profile } from '@/payload-types'

type Bio = NonNullable<Profile['bio']>
type BioNode = Bio['root']['children'][number]

export type BioSection = {
  title: string
  content: Bio
}

function textContent(node: unknown): string {
  if (typeof node !== 'object' || node === null) return ''
  if ('text' in node && typeof node.text === 'string') return node.text
  if (!('children' in node) || !Array.isArray(node.children)) return ''
  return node.children.map(textContent).join('')
}

export function splitBio(bio: Profile['bio'] | null | undefined): {
  intro: Bio | null
  sections: BioSection[]
} {
  if (!bio) return { intro: null, sections: [] }

  const introNodes: BioNode[] = []
  const sections: BioSection[] = []
  let activeSection: { title: string; nodes: BioNode[] } | undefined

  const saveActiveSection = () => {
    if (!activeSection) return
    sections.push({
      title: activeSection.title,
      content: {
        ...bio,
        root: { ...bio.root, children: activeSection.nodes },
      },
    })
  }

  for (const node of bio.root.children) {
    if (node.type === 'heading') {
      saveActiveSection()
      activeSection = { title: textContent(node).trim(), nodes: [] }
    } else if (activeSection) {
      activeSection.nodes.push(node)
    } else {
      introNodes.push(node)
    }
  }

  saveActiveSection()

  return {
    intro: { ...bio, root: { ...bio.root, children: introNodes } },
    sections,
  }
}
