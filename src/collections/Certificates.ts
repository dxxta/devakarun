import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/users'

export const Certificates: CollectionConfig = {
  slug: 'certificates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'issuer', 'issueDate', 'expiryDate', 'order'],
    group: 'About',
    description: 'Manage certificates and credentials shown on the About page.',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'issuer',
      type: 'text',
      required: true,
    },
    {
      name: 'issueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'expiryDate',
      type: 'date',
    },
    {
      name: 'credentialUrl',
      type: 'text',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'highlighted',
      type: 'checkbox',
      defaultValue: false,
      label: 'Highlight',
      admin: {
        position: 'sidebar',
        description: 'Highlighted certificates are shown first on the About page. Maximum 4.',
      },
      validate: async (value, { req, id }) => {
        if (value !== true) return true

        const result = await req.payload.count({
          collection: 'certificates',
          where: {
            and: [
              { highlighted: { equals: true } },
              ...(id === undefined ? [] : [{ id: { not_equals: id } }]),
            ],
          },
        })

        return result.totalDocs >= 4 ? 'You can highlight at most 4 certificates.' : true
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
