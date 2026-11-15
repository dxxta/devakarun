import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const PostViews: CollectionConfig = {
  slug: 'post-views',
  admin: {
    useAsTitle: 'day',
    defaultColumns: ['post', 'country', 'day', 'createdAt'],
    group: 'Engagement',
    description: 'Read-only list of deduplicated post views.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'posts', required: true, index: true },
    { name: 'visitorHash', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'day', type: 'text', required: true, index: true },
    { name: 'country', type: 'text', required: true, defaultValue: 'XX', index: true, admin: { readOnly: true } },
  ],
}
