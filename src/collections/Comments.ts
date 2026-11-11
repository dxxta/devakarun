import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: { useAsTitle: 'body', defaultColumns: ['authorName', 'post', 'status', 'createdAt'] },
  access: {
    read: ({ req }) => req.user ? true : { status: { equals: 'approved' } },
    create: () => false,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'posts', required: true, index: true },
    { name: 'parent', type: 'relationship', relationTo: 'comments', index: true },
    { name: 'commenter', type: 'relationship', relationTo: 'commenters', required: true },
    { name: 'authorName', type: 'text', required: true, maxLength: 120 },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Spam', value: 'spam' },
      ],
    },
  ],
}
