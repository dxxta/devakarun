import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  admin: { useAsTitle: 'subject', defaultColumns: ['name', 'email', 'subject', 'handled', 'createdAt'] },
  access: {
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true, maxLength: 180 },
    { name: 'message', type: 'textarea', required: true, maxLength: 10000 },
    { name: 'handled', type: 'checkbox', defaultValue: false },
  ],
}
