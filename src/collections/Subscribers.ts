import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'status', 'updatedAt'] },
  access: {
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    { name: 'confirmToken', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'unsubscribeToken', type: 'text', index: true, admin: { readOnly: true } },
  ],
}
