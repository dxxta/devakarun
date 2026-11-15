import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/users'

export const GalleryImages: CollectionConfig = {
  slug: 'gallery-images',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'takenAt', 'updatedAt'],
    group: 'Portfolio',
    description: 'Manage event and personal photos shown in the gallery.',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'takenAt', type: 'date' },
  ],
}
