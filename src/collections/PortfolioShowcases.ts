import { ValidationError, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { isAdmin } from '../access/users'

const enforceFeaturedLimit: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (data?.featured !== true) return data

  const result = await req.payload.count({
    collection: 'portfolio-showcases',
    where: {
      and: [
        { featured: { equals: true } },
        ...(originalDoc?.id === undefined ? [] : [{ id: { not_equals: originalDoc.id } }]),
      ],
    },
  })

  if (result.totalDocs >= 3) {
    throw new ValidationError({
      collection: 'portfolio-showcases',
      errors: [{ path: 'featured', message: 'You can feature at most 3 showcase pages.' }],
      req,
    })
  }

  return data
}

export const PortfolioShowcases: CollectionConfig = {
  slug: 'portfolio-showcases',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'featured', 'project', 'updatedAt'],
    group: 'Portfolio',
    description: 'Manage the portfolio showcase pages and featured selections.',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [enforceFeaturedLimit],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Shown in the Featured showcase on the home page',
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
