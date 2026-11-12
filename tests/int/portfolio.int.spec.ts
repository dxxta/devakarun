import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type PortfolioCollection = 'tech-stack' | 'certificates' | 'projects'
type PortfolioDocument = { id: number | string; slug?: string }
type AccessTestAPI = {
  find(args: {
    collection: PortfolioCollection
    where: { id: { equals: number | string } }
    overrideAccess?: boolean
  }): Promise<{ docs: PortfolioDocument[] }>
  create(args: {
    collection: PortfolioCollection
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<PortfolioDocument>
  update(args: {
    collection: PortfolioCollection
    id: number | string
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<unknown>
  delete(args: {
    collection: PortfolioCollection
    id: number | string
    overrideAccess?: boolean
  }): Promise<unknown>
}

type CollectionCase = {
  collection: PortfolioCollection
  createData: (suffix: string) => Record<string, unknown>
  updateData: Record<string, unknown>
}

const cases: CollectionCase[] = [
  {
    collection: 'tech-stack',
    createData: (suffix) => ({ name: `Access Test ${suffix}`, category: 'frontend', order: 900 }),
    updateData: { name: 'Updated access test', category: 'backend', order: 901 },
  },
  {
    collection: 'certificates',
    createData: (suffix) => ({
      title: `Access Test ${suffix}`,
      issuer: 'Integration Test Issuer',
      issueDate: '2025-01-01T00:00:00.000Z',
      order: 900,
    }),
    updateData: { title: 'Updated access test', issuer: 'Updated issuer' },
  },
  {
    collection: 'projects',
    createData: (suffix) => ({
      title: `Access Test ${suffix}`,
      slug: `access-test-${suffix.toLowerCase()}`,
      summary: 'A temporary project used to verify access rules.',
      description: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              direction: 'ltr',
              format: '',
              indent: 0,
              children: [
                {
                  type: 'text',
                  version: 1,
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Access test project description.',
                },
              ],
            },
          ],
        },
      },
      order: 900,
    }),
    updateData: { title: 'Updated access test', summary: 'Updated summary' },
  },
]

let api: AccessTestAPI
let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  api = payload as unknown as AccessTestAPI
})

afterAll(async () => {
  await payload?.destroy()
})

describe.each(cases)('$collection access', ({ collection, createData, updateData }) => {
  it('allows anonymous reads', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const created = await api.create({
      collection,
      data: createData(suffix),
      overrideAccess: true,
    })

    try {
      const result = await api.find({
        collection,
        where: { id: { equals: created.id } },
        overrideAccess: false,
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]?.id).toBe(created.id)
    } finally {
      await api.delete({ collection, id: created.id, overrideAccess: true })
    }
  })

  it('denies anonymous creation, update, and delete', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const data = createData(suffix)

    await expect(api.create({ collection, data, overrideAccess: false })).rejects.toMatchObject({
      status: 403,
    })

    const existing = await api.create({ collection, data, overrideAccess: true })

    try {
      await expect(
        api.update({ collection, id: existing.id, data: updateData, overrideAccess: false }),
      ).rejects.toMatchObject({ status: 403 })
      await expect(
        api.delete({ collection, id: existing.id, overrideAccess: false }),
      ).rejects.toMatchObject({ status: 403 })
    } finally {
      await api.delete({ collection, id: existing.id, overrideAccess: true })
    }
  })
})

describe('project slug generation', () => {
  it('creates a URL-safe slug from the project title', async () => {
    const title = `Tést Project ${Date.now()}`
    const created = await api.create({
      collection: 'projects',
      overrideAccess: true,
      data: {
        title,
        summary: 'Slug generation integration fixture.',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Slug generation fixture.',
                  },
                ],
              },
            ],
          },
        },
      },
    })

    try {
      const result = await api.find({
        collection: 'projects',
        where: { id: { equals: created.id } },
        overrideAccess: true,
      })

      expect(result.docs[0]?.slug).toBe(`test-project-${title.split(' ').at(-1)}`)
    } finally {
      await api.delete({ collection: 'projects', id: created.id, overrideAccess: true })
    }
  })
})

describe('seeded portfolio data', () => {
  it("contains the owner's resume profile and real project", async () => {
    const [profile, edusign, notakar, technologies, certificates, projects, showcases] = await Promise.all([
      payload.findGlobal({ slug: 'profile', overrideAccess: true }),
      payload.find({ collection: 'projects', where: { slug: { equals: 'edusign' } }, limit: 1, overrideAccess: true }),
      payload.find({ collection: 'projects', where: { slug: { equals: 'notakar' } }, limit: 1, overrideAccess: true }),
      payload.find({ collection: 'tech-stack', limit: 1000, overrideAccess: true }),
      payload.find({ collection: 'certificates', limit: 1000, overrideAccess: true }),
      payload.find({ collection: 'projects', limit: 1000, overrideAccess: true }),
      payload.find({ collection: 'portfolio-showcases', limit: 1000, overrideAccess: true }),
    ])

    expect(profile.name).toBe('Dinta Syaifuddin')
    expect(edusign.docs).toHaveLength(1)
    expect(edusign.docs[0]?.title).toBe('Edusign: American Sign Language App')
    expect(notakar.docs).toHaveLength(1)
    expect(notakar.docs[0]?.featured).toBe(false)
    expect(technologies.docs).toHaveLength(28)
    expect(certificates.docs).toHaveLength(16)
    expect(projects.docs).toHaveLength(9)
    expect(projects.docs.filter(({ featured }) => featured)).toHaveLength(4)
    expect(showcases.docs).toHaveLength(8)
  })
})
