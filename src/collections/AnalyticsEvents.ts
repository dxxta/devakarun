import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

export const AnalyticsEvents: CollectionConfig = {
  slug: 'analytics-events',
  admin: {
    useAsTitle: 'event',
    defaultColumns: ['event', 'label', 'path', 'country', 'day', 'createdAt'],
    group: 'Analytics',
    description: 'Read-only first-party click and rejected-contact events.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  indexes: [{ fields: ['event', 'day'] }],
  fields: [
    { name: 'event', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'path', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'label', type: 'text', admin: { readOnly: true } },
    { name: 'country', type: 'text', required: true, defaultValue: 'XX', index: true, admin: { readOnly: true } },
    { name: 'visitorHash', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'day', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'reason', type: 'text', admin: { readOnly: true } },
  ],
}
