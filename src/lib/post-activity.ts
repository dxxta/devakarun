import type { Payload } from 'payload'
import type { Post } from '@/payload-types'

export const reactionTypes = ['like', 'love', 'fire', 'idea', 'clap'] as const
export type ReactionType = (typeof reactionTypes)[number]

export async function findPublishedPost(payload: Payload, slug: string): Promise<Post | null> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

export async function getReactionState(payload: Payload, postID: number, visitorHash: string) {
  const counts = Object.fromEntries(await Promise.all(reactionTypes.map(async (type) => {
    const result = await payload.count({
      collection: 'post-reactions',
      where: { and: [{ post: { equals: postID } }, { type: { equals: type } }] },
      overrideAccess: true,
    })
    return [type, result.totalDocs] as const
  }))) as Record<ReactionType, number>

  const mineResult = await payload.find({
    collection: 'post-reactions',
    where: { and: [{ post: { equals: postID } }, { visitorHash: { equals: visitorHash } }] },
    limit: reactionTypes.length,
    depth: 0,
    overrideAccess: true,
  })

  return {
    counts,
    mine: mineResult.docs.map(({ type }) => type).filter((type): type is ReactionType => reactionTypes.includes(type as ReactionType)),
  }
}

export async function countPostViews(payload: Payload, postID: number): Promise<number> {
  const result = await payload.count({ collection: 'post-views', where: { post: { equals: postID } }, overrideAccess: true })
  return result.totalDocs
}

export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'object' || current === null) return false
    if ('code' in current && current.code === '23505') return true
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}
