import type { Access } from 'payload'

export const isAdmin: Access = ({ req }) => Boolean(req.user)

export const canCreateFirstUser: Access = async ({ req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
  })

  return totalDocs === 0
}
