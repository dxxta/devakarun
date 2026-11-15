import type { Payload } from 'payload'
import type { Post } from '@/payload-types'
import { upsertSeedMedia } from './content'

type BlogSeedBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; tag: 'h2' | 'h3'; text: string }
  | { type: 'unordered-list'; items: BlogSeedListItem[] }
  | { type: 'ordered-list'; items: BlogSeedListItem[] }
  | { type: 'code'; language: string; code: string; blockName?: string }
  | { type: 'image'; filename: string; alt: string; caption: string }
  | { type: 'link'; label: string; url: string }

type BlogSeedInline =
  | { type: 'text'; text: string }
  | { type: 'link'; label: string; url: string }
type BlogSeedListItem = string | BlogSeedInline[]

type SeedLexicalNode = { type: string; version: number; [key: string]: unknown }

type BlogSeedPost = {
  title: string
  slug: string
  excerpt: string
  blocks: BlogSeedBlock[]
  categories: string[]
  tags: string[]
  published: boolean
  publishedAt?: string
  coverImageFile?: string | null
}

const categories = [
  { name: 'Engineering', slug: 'engineering' },
  { name: 'Infrastructure', slug: 'infrastructure' },
  { name: 'Lifestyle', slug: 'lifestyle' },
  { name: 'Networking', slug: 'networking' },
  { name: 'Notes', slug: 'notes' },
]

const tags = [
  { name: 'Process', slug: 'process' },
  { name: 'Cloudflare', slug: 'cloudflare' },
  { name: 'Performance', slug: 'performance' },
  { name: 'DNS', slug: 'dns' },
  { name: 'Testing', slug: 'testing' },
  { name: 'DevFest', slug: 'devfest' },
  { name: 'GDG', slug: 'gdg' },
  { name: 'Community', slug: 'community' },
]

const obsoleteSamplePostSlugs = [
  'building-a-steady-writing-habit',
  'a-simple-content-model-for-a-blog',
  'designing-a-fast-page-with-server-components',
]

const posts: BlogSeedPost[] = [
  {
    title: 'A draft about search quality',
    slug: 'a-draft-about-search-quality',
    excerpt: 'An unpublished note for testing draft access.',
    blocks: [{ type: 'paragraph', text: 'This draft stays private until it is ready to publish.' }],
    categories: ['notes'],
    tags: ['process'],
    published: false,
  },
  {
    title: 'Why Cloudflare DNS important for your website',
    slug: 'why-cloudflare-dns-important-for-your-website',
    excerpt: 'DNS helps browsers find a website but Cloudflare can add more tools like a proxy, protection, caching, and image tools in front of it',
    blocks: [
      { type: 'heading', tag: 'h2', text: 'What DNS does' },
      { type: 'paragraph', text: 'Before a browser can open a site, it needs to find the server for that site. DNS means Domain Name System. It works like an address book, it maps a name such as dev.akarun.site to an IP address. The browser asks a DNS resolver for this address. A resolver is a service that looks up DNS records and returns the answer. A slow resolver adds time before the browser can connect. If the resolver cannot answer, the site may look offline even when its server is working.' },
      { type: 'heading', tag: 'h2', text: 'Why use Cloudflare?' },
      { type: 'paragraph', text: 'Cloudflare can host a site authoritative DNS. Authoritative DNS is the trusted set of records for a domain. Cloudflare can also act as a proxy, a server between a visitor and the website origin, which is the server that stores the site. When a supported DNS record uses the orange-cloud setting, web requests pass through Cloudflare. The public DNS answer then shows Cloudflares address instead of the origin address. This helps hide the origin IP and does not replace security settings on the origin but only applies to non DNS-only path.' },
      { type: 'paragraph', text: '-' },
      { type: 'paragraph', text: 'When traffic goes through the proxy, Cloudflare can provide free TLS. TLS encrypts data between the browser and the site. Cloudflare also provides DDOS protection, which helps handle large floods of unwanted requests. It can cache some responses too. A cache is a stored copy of a response. Cloudflare’s edge servers are its servers near visitors. A cached response can come from an edge server instead of the origin. Each feature depends on the record and zone settings. Some edge features only work when a record is proxied, so check which records need the orange cloud.' },
      { type: 'heading', tag: 'h2', text: 'Cloudflare Image Transformations' },
      { type: 'paragraph', text: 'Image Transformations are one example of an edge feature. They resize and convert images before sending them to a browser. The request path has this form: ' },
      { type: 'code', language: 'html', code: '/cdn-cgi/image/<options>/<source-path>', blockName: '' },
      { type: 'paragraph', text: 'Cloudflare gets the original image from the configured source, applies options such as width and quality, then stores the result in its cache.' },
      { type: 'paragraph', text: '-' },
      { type: 'paragraph', text: 'To turn on Image Transformations once for the zone. In the Cloudflare dashboard, open Images > Transformations and enable it. The Free plan allows 5,000 unique transformations each month. A unique transformation is a source image with a particular set of options. Cached transformations keep working after the limit. Requests for new transformations return error 9422. Use a small set of useful widths and quality values to avoid creating extra variants.' },
      { type: 'heading', tag: 'h3', text: 'Set it up in the Cloudflare dashboard' },
      { type: 'ordered-list', items: [
        'Make sure your domain is on Cloudflare and its DNS record is proxied (orange cloud). Transformations only work for proxied traffic.',
        'Open the Cloudflare dashboard and look for Transformations under Images. The menu name can differ slightly between dashboard versions.',
        'On the Transformations page, open the Zones tab, find your domain, and enable transformations. Its status changes to Enabled. The page also shows Unique transformations against the free limit of 5,000 per billing period. The screenshot shows 9 / 5,000 for November 1 to December 1.',
        'Click the domain to open its settings. Under Sources, choose who may use your zone. This zone only allows images from akarun.site or *.akarun.site and is the safest choice for a site that serves its own images; this website uses it. Specified origins allows only listed origins, and subdomains are not included automatically. Any origin allows images from any site and may let others transform media through your zone, so avoid it. Click Save.',
        'Preserve Content Credentials keeps C2PA authenticity metadata in optimized images and is off by default. The Settings, Automation, and Analytics tabs are next to it. The red Disable for zone button turns the feature off again.',
        'Test a transformed image URL and check its response headers, including cf-resized and content type. Use the curl example below with a real image path.',
      ] },
      { type: 'paragraph', text: '-' },
      { type: 'image', filename: 'cloudflare-transformations-overview.png', alt: 'Cloudflare dashboard Transformations page with the akarun.site zone enabled and usage 9 of 5,000', caption: 'Step 3: the Transformations page lists your zones and shows monthly usage.' },
      { type: 'image', filename: 'cloudflare-transformations-zone-settings.png', alt: 'Cloudflare Transformations settings for akarun.site showing the Sources options', caption: 'Step 4: choose which origins may be transformed; this site uses This zone only.' },
      { type: 'paragraph', text: 'Good to know: an error can mean that the zone setting or source rule blocks the image. A new transformation counts once, cached versions are free to serve again.' },
      { type: 'heading', tag: 'h3', text: 'The image URL loader' },
      { type: 'paragraph', text: 'This site uses a Next.js image loader to build the Cloudflare URL. It only changes paths that start with a slash. External image URLs pass through unchanged.' },
      { type: 'code', language: 'ts', code: "type LoaderArgs = { src: string; width: number; quality?: number }\n\nexport function cloudflareLoader({ src, width, quality }: LoaderArgs): string {\n  if (!src.startsWith('/')) return src\n  return `/cdn-cgi/image/width=${width},quality=${quality ?? 75},format=auto${src}`\n}" },
      { type: 'heading', tag: 'h3', text: 'Fallback and runtime setting' },
      { type: 'paragraph', text: 'CdnImage passes the loader to Next Image. If a Cloudflare image request fails, the component sets a module-level flag and updates its local state. The next render uses the default Next.js optimizer instead. MediaImage enables this path only when CLOUDFLARE_IMAGES=true at runtime.' },
      { type: 'code', language: 'tsx', code: "let cloudflareFailed = false\n\nconst useCloudflare = cloudflare && !failed && !cloudflareFailed && !unoptimized\n\n<Image\n  {...props}\n  loader={useCloudflare ? cloudflareLoader : undefined}\n  onError={(event) => {\n    if (useCloudflare) {\n      cloudflareFailed = true\n      setFailed(true)\n      return\n    }\n    onError?.(event)\n  }}\n/>" },
      { type: 'code', language: 'tsx', code: "<CdnImage\n  cloudflare={process.env.CLOUDFLARE_IMAGES === 'true'}\n  src={media.url}\n  alt={alt ?? media.alt}\n  width={media.width ?? 1200}\n  height={media.height ?? 800}\n  sizes={sizes}\n/>" },
      { type: 'paragraph', text: 'To check a transformed image, send a HEAD request to a real image URL on the proxied site. The response should include the cf-resized header. It can also include content-type: image/avif when the browser supports AVIF. The exact header values depend on the image and the request.' },
      { type: 'code', language: 'bash', code: 'curl -I "https://dev.akarun.site/cdn-cgi/image/width=800,quality=75,format=auto/path/to/image.jpg"' },
      { type: 'heading', tag: 'h2', text: 'How this website uses it' },
      { type: 'paragraph', text: 'The dev.akarun.site zone is proxied through Cloudflare. This showcase image is one example from the site’s portfolio. It is rendered through MediaImage, then CdnImage. If the request fails, it falls back to the Next.js optimizer. The Next.js image config sets minimumCacheTTL to one year. A Cloudflare Cache Rule caches /cdn-cgi/image/* and /_next/image* at the edge. This is the same image path the rest of the site uses.' },
      { type: 'paragraph', text: '-' },
      { type: 'image', filename: 'showcase-08-slipakar.png', alt: 'Slipakar create account screen from the dev.akarun gallery', caption: 'This Slipakar gallery image is served through the Cloudflare loader when CLOUDFLARE_IMAGES is enabled.' },
      { type: 'paragraph', text: 'Check DNS, TLS, and image response headers after changing these settings. Confirm which DNS records use the proxy. Then open a transformed image and inspect its response. These checks help show whether a problem is in DNS, the website, or image delivery.' },
      { type: 'paragraph', text: 'If you found this helpfull, please leave a reaction or even a comment and share this post to your friends 😄.' },
    ],
    categories: ['infrastructure', 'engineering', 'networking'],
    tags: ['cloudflare', 'dns', 'performance'],
    published: true,
    publishedAt: '2026-11-14T08:00:00.000Z',
    coverImageFile: null,
  },
  {
    title: 'My day at DevFest Jakarta 2026',
    slug: 'my-day-at-devfest-jakarta-2026',
    excerpt: 'My personal recap of attending GDG Jakarta DevFest to get the venue, dev talks, and a day to spend with another builders in this agentic era of software engineering 😁',
    blocks: [
      { type: 'paragraph', text: 'On Sunday, 1 November 2026, I attended DevFest Jakarta 2026 at Gedung Sasono Utomo in Taman Mini Indonesia Indah, East Jakarta. GDG Jakarta organised the event around developers and builders in this agentic era 🤖. I came to spend a day with the local developer community and to hear how people are approaching a fast-changing part of our work.' },
      { type: 'paragraph', text: '-' },
      { type: 'image', filename: 'devfest-jakarta-2026-01.jpg', alt: 'The DevFest Jakarta 26 Welcome home, Builders entrance with the author standing in front', caption: 'The entrance welcomed builders to DevFest Jakarta 26.' },
      { type: 'heading', tag: 'h2', text: 'A day with the Jakarta developer community' },
      { type: 'paragraph', text: 'The event ran on morning from 07:45 to 17:00 WIB. The schedule gave the day a clear shape, from an opening keynote through talks and panels. The event page listed about 1,146 RSVPs, so there was a large community gathering around the same theme. For me, the scale made the venue feel like a shared meeting place for people with different roles and interests in technology.' },
      { type: 'paragraph', text: 'I also appreciated the simple moments between sessions, start from arriving, finding the event space, and having a chance to meet other people (we called each other as builders) as in the badge in my hand carried the DevFest Jakarta mark and the word “Builders” xD. My beloved badge.' },
      { type: 'paragraph', text: '-' },
      { type: 'image', filename: 'devfest-jakarta-2026-02.jpg', alt: 'Green DevFest Jakarta Builders attendee badge showing GDG Jakarta and Women Techmakers', caption: 'My beloved badge.' },
      { type: 'heading', tag: 'h2', text: 'The agenda and sessions' },
      { type: 'paragraph', text: 'The agenda covered several questions that developers are facing as AI tools become part of engineering work. It included many dev talks where there is two of my favourites, “Building Secure, Modular AI Agent Systems with ADK, A2A, and Hermes Agent as the Front Door” and The final panel “Code Faster, Think Slower: Surviving the Transition from Pre-AI to Post-AI Engineering”. Surely i was came for the whole event not for spesific dev talks session 🤭.' },
      { type: 'paragraph', text: '-' },
      { type: 'image', filename: 'devfest-jakarta-2026-03.jpg', alt: 'Panelists on the DevFest Jakarta stage during the Builders in the Agentic Era panel', caption: 'The panel stage brought the event theme into view.' },
      { type: 'paragraph', text: 'Also there are many keynote speakers including Pak Ghifary from BitHealth, Pak Sandhika Galih (My Inspiration), Pak Alvin Prayuda Juniarta Dwiyantoro from Google Cloud, Pak Eko Kurniawan Khannedy (My Favourite xD) from Blibli.com, and Raymond Chin (IDK about this one 😉).' },
      { type: 'heading', tag: 'h2', text: 'What I took back to my own work' },
      { type: 'paragraph', text: 'My main reflection was about how these questions connect to ordinary engineering tasks. I build web and mobile projects, work with APIs and data, and maintain this site. In each case, a useful tool still needs a clear purpose, careful review, and a person who understands the result. This event made me think about where automation can help with routine steps and where a developer still needs to make decisions.' },
      { type: 'paragraph', text: 'This event reminded me that community is also includes as part of engineering as well. From this event i found it useful to compare perspectives, learn what other builders are exploring, and return to my own work with fresh questions. Looking back, the best parts were the people and the unplanned detours.' },
      { type: 'heading', tag: 'h2', text: 'Going with my dev friends' },
      { type: 'paragraph', text: 'I did not make the trip alone. I went to the event with my dev friends, and sharing the day made the event feel welcoming from the start. We travelled together, then registered and collected our badges together. Those small steps gave us time to settle in before the talks and enjoy the event as a group.' },
      { type: 'paragraph', text: 'Between sessions, we talked about what we had heard and took photos during the day. I liked having people to compare notes with and each of us noticed different things, also a short conversation helped an idea stay with me. After the event, we shared what we had learned. The conversations around the schedule became part of the experience, alongside the stage talks themselves.' },
      { type: 'image', filename: 'devfest-jakarta-2026-05.jpg', alt: 'Two DevFest Jakarta photo booth strips showing me and my dev friends', caption: 'Our photo booth strips from the day.' },
      { type: 'heading', tag: 'h2', text: 'Sneaking into the MongoDB workshop' },
      { type: 'paragraph', text: 'One unplanned side trip was a quick look into a MongoDB workshop. Out of curiosity, I quietly peeked in and sat at the back for a while. It was only a short visit, not a full session that I attended, but I could feel a different atmosphere from the big stage talks. Laptops were open and the room had a hands-on feel.' },
      { type: 'paragraph', text: 'Im not claiming that I followed the workshop or learned specific technical details from it. The official speaker list includes Ajat Darojat from Hacktiv8 as i remember, a MongoDB User Group Leader.' },
      { type: 'heading', tag: 'h2', text: 'Event details' },
      { type: 'unordered-list', items: [
        'DevFest Jakarta 2026, organised by GDG Jakarta (Google Developer Groups).',
        'Sunday, 1 November 2026, 07:45–17:00 WIB.',
        'Gedung Sasono Utomo, TMII, Jalan Malaka, East Jakarta.',
        [
          { type: 'text', text: 'For more detail about the event, you could see at ' },
          { type: 'link', label: 'Official DevFest Jakarta 2026 event page', url: 'https://gdg.community.dev/events/details/google-gdg-jakarta-presents-devfest-jakarta-2026/' },
          { type: 'text', text: '.' },
        ],
      ] },
      { type: 'paragraph', text: '' },
    ],
    categories: ['lifestyle'],
    tags: ['devfest', 'gdg', 'community'],
    published: true,
    publishedAt: '2026-11-15T13:40:00.000Z',
    coverImageFile: 'devfest-jakarta-2026-01.jpg',
  },
  {
    title: 'Lorem ipsum: a post for testing',
    slug: 'lorem-ipsum-a-post-for-testing',
    excerpt: 'A published sample post with common rich text blocks for checking the blog layout.',
    blocks: [
      { type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem sed justo consequat aliquet. Curabitur at augue eu neque dictum fermentum. Sed non magna in erat feugiat tempor.' },
      { type: 'paragraph', text: 'Praesent sed lectus vitae mi aliquam luctus. Aenean sed dui vel neque dapibus commodo. Donec posuere, lectus a consequat convallis, lorem neque facilisis justo, ut porttitor est lacus sed mauris.' },
      { type: 'heading', tag: 'h2', text: 'A few useful checks' },
      { type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. A short checklist can make an otherwise routine review easier to repeat:' },
      { type: 'unordered-list', items: ['Confirm the page title and excerpt.', 'Check that headings and lists keep their spacing.', 'Read the published page on a narrow screen.'] },
      { type: 'paragraph', text: 'Integer posuere, augue sit amet facilisis convallis, nulla mauris tincidunt erat, vitae varius nisi mauris ac augue. The sample code below is intentionally brief.' },
      { type: 'code', language: 'js', code: "const status = 'ready'\nconsole.log(status)" },
      { type: 'paragraph', text: 'Donec in augue vel quam blandit luctus. Nam ac velit nec metus sodales dictum, sed at massa.' },
    ],
    categories: ['notes'],
    tags: ['testing'],
    published: true,
    publishedAt: '2026-11-13T09:00:00.000Z',
    coverImageFile: null,
  },
]

function lexicalContent(blocks: BlogSeedBlock[], mediaIDs: Map<string, number>, includeLexicalMetadata = false): Post['content'] {
  let codeBlockIndex = 0
  const textNode = (text: string): SeedLexicalNode => ({ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' })
  const element = (type: string, children: SeedLexicalNode[], extra: Record<string, unknown> = {}): SeedLexicalNode => ({
    type,
    version: 1,
    children,
    direction: null,
    format: '',
    indent: 0,
    ...extra,
  })
  return {
    root: {
      type: 'root',
      version: 1,
      children: blocks.flatMap((block) => {
        if (block.type === 'paragraph') {
          return [element('paragraph', block.text ? [textNode(block.text)] : [], includeLexicalMetadata ? { textStyle: '', textFormat: 0 } : {})]
        }
        if (block.type === 'heading') return [element('heading', [textNode(block.text)], { tag: block.tag })]
        if (block.type === 'unordered-list') {
          return [element('list', block.items.map((item, index) => element('listitem', inlineNodes(item), { value: index + 1 })), { listType: 'bullet', tag: 'ul', start: 1 })]
        }
        if (block.type === 'ordered-list') {
          return [element('list', block.items.map((item, index) => element('listitem', inlineNodes(item), { value: index + 1 })), { listType: 'number', tag: 'ol', start: 1 })]
        }
        if (block.type === 'code') {
          const codeNode: SeedLexicalNode = {
            type: 'block',
            version: 2,
            format: '',
            fields: {
              id: `seed-code-${codeBlockIndex++}`,
              blockName: block.blockName ?? 'Code block',
              blockType: 'code',
              language: block.language,
              code: block.code,
            },
          }
          return [codeNode]
        }
        if (block.type === 'link') {
          return [element('paragraph', [element('link', [textNode(block.label)], {
            version: 2,
            fields: { url: block.url, linkType: 'custom', newTab: true },
          })])]
        }
        const mediaID = mediaIDs.get(block.filename)
        if (mediaID === undefined) throw new Error(`Missing seeded blog image: ${block.filename}`)
        return [
          {
            type: 'upload',
            version: 3,
            ...(includeLexicalMetadata ? { format: '' } : {}),
            id: '66b8c1a30b8f4a2d6c91e7f1',
            relationTo: 'media',
            value: mediaID,
            fields: { alt: block.alt, caption: block.caption },
          },
        ]
      }),
      direction: null,
      format: '',
      indent: 0,
    },
  }

  function inlineNodes(item: BlogSeedListItem): SeedLexicalNode[] {
    if (typeof item === 'string') return [textNode(item)]
    return item.map((part) => part.type === 'text'
      ? textNode(part.text)
      : element('link', [textNode(part.label)], {
        version: 3,
        fields: { url: part.url, newTab: true, linkType: 'custom' },
      }))
  }
}

async function upsertSearchEntry(payload: Payload, relationTo: 'posts' | 'projects', id: number, title: string): Promise<void> {
  const existing = await payload.find({
    collection: 'search',
    where: {
      and: [
        { 'doc.relationTo': { equals: relationTo } },
        { 'doc.value': { equals: id } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  const doc = existing.docs[0]
  const relation = relationTo === 'posts' ? { relationTo: 'posts' as const, value: id } : { relationTo: 'projects' as const, value: id }
  const data = { title, doc: relation, priority: 0 }

  if (doc) {
    await payload.update({ collection: 'search', id: doc.id, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'search', data, overrideAccess: true })
  }
}

async function deleteSearchEntry(payload: Payload, relationTo: 'posts' | 'projects', id: number): Promise<void> {
  await payload.delete({
    collection: 'search',
    where: {
      and: [
        { 'doc.relationTo': { equals: relationTo } },
        { 'doc.value': { equals: id } },
      ],
    },
    overrideAccess: true,
  })
}

async function removeObsoleteSamplePosts(payload: Payload): Promise<void> {
  for (const slug of obsoleteSamplePostSlugs) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 100,
      overrideAccess: true,
    })
    for (const post of docs) {
      await deleteSearchEntry(payload, 'posts', post.id)
      await payload.delete({ collection: 'posts', id: post.id, overrideAccess: true })
    }
  }
}

function relationIDs(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item === 'number') return [item]
    if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'number') return [item.id]
    return []
  })
}

async function removeUnusedTaxonomy(payload: Payload): Promise<void> {
  const { docs: allPosts } = await payload.find({ collection: 'posts', draft: true, limit: 1000, pagination: false, overrideAccess: true })
  const usedCategories = new Set(allPosts.flatMap((post) => relationIDs(post.categories)))
  const usedTags = new Set(allPosts.flatMap((post) => relationIDs(post.tags)))
  const categoriesResult = await payload.find({ collection: 'categories', limit: 1000, pagination: false, overrideAccess: true })
  const tagsResult = await payload.find({ collection: 'tags', limit: 1000, pagination: false, overrideAccess: true })

  for (const category of categoriesResult.docs) {
    if (!usedCategories.has(category.id)) await payload.delete({ collection: 'categories', id: category.id, overrideAccess: true })
  }
  for (const tag of tagsResult.docs) {
    if (!usedTags.has(tag.id)) await payload.delete({ collection: 'tags', id: tag.id, overrideAccess: true })
  }
}

export async function seedBlog(payload: Payload): Promise<void> {
  const categoryIDs = new Map<string, number>()
  const tagIDs = new Map<string, number>()
  await removeObsoleteSamplePosts(payload)
  const mediaIDs = new Map<string, number>()
  for (const image of [
    { filename: 'showcase-08-slipakar.png', alt: 'Slipakar create account screen from the dev.akarun gallery', relativePath: 'showcases/showcase-08-slipakar.png' },
    { filename: 'cloudflare-transformations-overview.png', alt: 'Cloudflare dashboard Transformations page with the akarun.site zone enabled and usage 9 of 5,000', relativePath: 'blog/cloudflare-transformations-overview.png' },
    { filename: 'cloudflare-transformations-zone-settings.png', alt: 'Cloudflare Transformations settings for akarun.site showing the Sources options', relativePath: 'blog/cloudflare-transformations-zone-settings.png' },
    { filename: 'devfest-jakarta-2026-01.jpg', alt: 'Welcome home, Builders entrance at DevFest Jakarta 26', relativePath: 'gallery/devfest-jakarta-2026-01.jpg' },
    { filename: 'devfest-jakarta-2026-02.jpg', alt: 'DevFest Jakarta Builders attendee badge', relativePath: 'gallery/devfest-jakarta-2026-02.jpg' },
    { filename: 'devfest-jakarta-2026-03.jpg', alt: 'Builders in the Agentic Era panel at DevFest Jakarta', relativePath: 'gallery/devfest-jakarta-2026-03.jpg' },
    { filename: 'devfest-jakarta-2026-05.jpg', alt: 'DevFest Jakarta photo strips', relativePath: 'gallery/devfest-jakarta-2026-05.jpg' },
  ]) {
    const media = await upsertSeedMedia(payload, image.filename, image.alt, image.relativePath)
    mediaIDs.set(image.filename, media.id)
  }

  for (const category of categories) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: category.slug } }, limit: 1, overrideAccess: true })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'categories', id: existing.docs[0].id, data: category, overrideAccess: true })
      : await payload.create({ collection: 'categories', data: category, overrideAccess: true })
    categoryIDs.set(category.slug, doc.id)
  }

  for (const tag of tags) {
    const existing = await payload.find({ collection: 'tags', where: { slug: { equals: tag.slug } }, limit: 1, overrideAccess: true })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'tags', id: existing.docs[0].id, data: tag, overrideAccess: true })
      : await payload.create({ collection: 'tags', data: tag, overrideAccess: true })
    tagIDs.set(tag.slug, doc.id)
  }

  for (const post of posts) {
    const existing = await payload.find({ collection: 'posts', where: { slug: { equals: post.slug } }, limit: 1, overrideAccess: true })
    const coverImageID = post.coverImageFile ? mediaIDs.get(post.coverImageFile) : undefined
    if (post.coverImageFile && coverImageID === undefined) throw new Error(`Missing seeded post cover: ${post.coverImageFile}`)
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: lexicalContent(post.blocks, mediaIDs, post.slug === 'my-day-at-devfest-jakarta-2026' || post.slug === 'why-cloudflare-dns-important-for-your-website'),
      categories: post.categories.map((slug) => categoryIDs.get(slug)).filter((id): id is number => id !== undefined),
      tags: post.tags.map((slug) => tagIDs.get(slug)).filter((id): id is number => id !== undefined),
      publishedAt: post.publishedAt,
      _status: post.published ? 'published' as const : 'draft' as const,
      ...(post.coverImageFile !== undefined ? { coverImage: coverImageID ?? null } : {}),
    }
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'posts', id: existing.docs[0].id, data, overrideAccess: true })
      : await payload.create({ collection: 'posts', data, overrideAccess: true })

    if (post.published) {
      await upsertSearchEntry(payload, 'posts', doc.id, doc.title)
    } else {
      await deleteSearchEntry(payload, 'posts', doc.id)
    }
  }

  await removeUnusedTaxonomy(payload)

  const { docs: projects } = await payload.find({ collection: 'projects', limit: 1000, pagination: false, overrideAccess: true })
  for (const project of projects) {
    await upsertSearchEntry(payload, 'projects', project.id, project.title)
  }
}
