import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const PostReactions: CollectionConfig = {
  slug: 'post-reactions',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['post', 'type', 'createdAt'],
    group: 'Engagement',
    description: 'Read-only list of anonymous post reactions.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'posts', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Love', value: 'love' },
        { label: 'Fire', value: 'fire' },
        { label: 'Idea', value: 'idea' },
        { label: 'Clap', value: 'clap' },
      ],
    },
    { name: 'visitorHash', type: 'text', required: true, index: true, admin: { readOnly: true } },
  ],
}
