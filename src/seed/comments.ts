import type { Payload } from 'payload'

export async function seedComments(payload: Payload): Promise<void> {
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'building-a-steady-writing-habit' } },
    limit: 1,
    overrideAccess: true,
  })
  const post = posts[0]
  if (!post) return

  const googleId = 'seeded-commenter-example'
  const existingCommenter = await payload.find({
    collection: 'commenters',
    where: { googleId: { equals: googleId } },
    limit: 1,
    overrideAccess: true,
  })
  const commenter = existingCommenter.docs[0] ?? await payload.create({
    collection: 'commenters',
    overrideAccess: true,
    data: { googleId, name: 'Sample Reader', email: 'sample-reader@example.invalid' },
  })

  const existingComment = await payload.find({
    collection: 'comments',
    where: { and: [{ post: { equals: post.id } }, { body: { equals: 'A steady habit makes the work easier to return to.' } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (!existingComment.docs[0]) {
    await payload.create({
      collection: 'comments',
      overrideAccess: true,
      data: {
        post: post.id,
        commenter: commenter.id,
        authorName: commenter.name,
        body: 'A steady habit makes the work easier to return to.',
        status: 'approved',
      },
    })
  }
}
