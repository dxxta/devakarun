import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const PageVisits: CollectionConfig = {
  slug: 'page-visits',
  admin: {
    useAsTitle: 'path',
    defaultColumns: ['path', 'country', 'day', 'referrerHost', 'createdAt'],
    group: 'Analytics',
    description: 'Read-only anonymous page visit records.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  indexes: [{ fields: ['path', 'visitorHash', 'day'], unique: true }],
  fields: [
    { name: 'path', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'country', type: 'text', required: true, defaultValue: 'XX', index: true, admin: { readOnly: true } },
    { name: 'visitorHash', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'day', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'referrerHost', type: 'text', admin: { readOnly: true } },
  ],
}
