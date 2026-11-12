// @vitest-environment node

import { getPayload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedContent } from '@/seed/content'
import { seedContentIfEmpty } from '@/seed/bootstrap'

let payload: Awaited<ReturnType<typeof getPayload>>

const emptyRichText = {
  root: {
    type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [{
      type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
      children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: 'Legacy entry.' }],
    }],
  },
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('real portfolio seed', () => {
  it('replaces legacy sample records and stays idempotent', async () => {
    for (const name of ['TypeScript', 'Next.js', 'Docker']) {
      const existing = await payload.find({ collection: 'tech-stack', where: { name: { equals: name } }, limit: 1, overrideAccess: true })
      if (!existing.docs[0]) {
        await payload.create({ collection: 'tech-stack', overrideAccess: true, data: { name, category: 'other', order: 999 } })
      }
    }

    for (const [title, slug] of [
      ['Portfolio Starter', 'portfolio-starter'],
      ['Content Hub', 'content-hub'],
      ['Delivery Toolkit', 'delivery-toolkit'],
    ]) {
      const existing = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
      if (!existing.docs[0]) {
        await payload.create({
          collection: 'projects', overrideAccess: true,
          data: { title, slug, summary: 'Legacy entry.', description: emptyRichText as never, source: 'manual' },
        })
      }
    }

    for (const title of ['Sample Certificate in Web Development', 'Sample Certificate in Cloud Fundamentals']) {
      const existing = await payload.find({ collection: 'certificates', where: { title: { equals: title } }, limit: 1, overrideAccess: true })
      if (!existing.docs[0]) {
        await payload.create({
          collection: 'certificates', overrideAccess: true,
          data: { title, issuer: 'Legacy issuer', issueDate: '2024-01-01T00:00:00.000Z', order: 999 },
        })
      }
    }

    await seedContent(payload)
    await seedContent(payload)

    const [technologies, certificates, projects, profile] = await Promise.all([
      payload.find({ collection: 'tech-stack', limit: 1000, overrideAccess: true }),
      payload.find({ collection: 'certificates', limit: 1000, overrideAccess: true }),
      payload.find({ collection: 'projects', limit: 1000, overrideAccess: true }),
      payload.findGlobal({ slug: 'profile', overrideAccess: true }),
    ])
    expect(technologies.docs).toHaveLength(26)
    expect(certificates.docs).toHaveLength(15)
    expect(projects.docs).toHaveLength(7)
    expect(profile.name).toBe('Dinta Syaifuddin')
    expect(technologies.docs.map(({ name }) => name)).not.toEqual(expect.arrayContaining(['TypeScript', 'Next.js', 'Docker']))
    expect(certificates.docs.map(({ title }) => title)).not.toEqual(expect.arrayContaining([
      'Sample Certificate in Web Development', 'Sample Certificate in Cloud Fundamentals',
    ]))
    expect(projects.docs.map(({ slug }) => slug)).not.toEqual(expect.arrayContaining([
      'portfolio-starter', 'content-hub', 'delivery-toolkit',
    ]))
  })

  it('does not seed over existing tech stack content', async () => {
    const before = await payload.findGlobal({ slug: 'profile', overrideAccess: true })
    await expect(seedContentIfEmpty(payload)).resolves.toBe(false)
    const after = await payload.findGlobal({ slug: 'profile', overrideAccess: true })
    expect(after.name).toBe(before.name)
  })
})
