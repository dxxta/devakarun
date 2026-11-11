import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const Commenters: CollectionConfig = {
  slug: 'commenters',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'createdAt'] },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'googleId', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'avatar', type: 'text' },
  ],
}
