import type { GlobalConfig } from 'payload'

import { isAdmin } from '../access/users'

export const Profile: GlobalConfig = {
  slug: 'profile',
  admin: {
    group: 'About',
    description: 'Set the profile content shown on the homepage and About page.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'richText',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'resumeFile',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'portfolioPdf',
      type: 'upload',
      relationTo: 'media',
      label: 'Portfolio PDF (merged)',
    },
    {
      name: 'listPreviews',
      type: 'array',
      label: 'Bio previews',
      admin: {
        description: 'Shows a mini image preview next to a bio list item whose text contains the keyword; images come from the gallery',
      },
      fields: [
        { name: 'keyword', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'contactLinks',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
