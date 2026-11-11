import type { Payload } from 'payload'

import { env } from '../lib/env'

export async function seedAdmin(payload: Payload): Promise<void> {
  const { docs } = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  })

  const admin = docs[0]
  const data = {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  }

  if (admin) {
    await payload.update({
      collection: 'users',
      id: admin.id,
      data,
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: 'users',
    data,
    overrideAccess: true,
  })
}
