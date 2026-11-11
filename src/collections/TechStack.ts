import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/users'

export const TechStack: CollectionConfig = {
  slug: 'tech-stack',
  labels: {
    singular: 'Technology',
    plural: 'Tech Stack',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'order', 'updatedAt'],
    group: 'About',
    description: 'Manage the technologies shown on the About page.',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Frontend', value: 'frontend' },
        { label: 'Backend', value: 'backend' },
        { label: 'DevOps', value: 'devops' },
        { label: 'Tools', value: 'tools' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
