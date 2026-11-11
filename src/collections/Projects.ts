import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { isAdmin } from '../access/users'

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const generateSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data.title !== 'string' || data.slug) {
    return data
  }

  return {
    ...data,
    slug: slugify(data.title),
  }
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'featured', 'source', 'order', 'updatedAt'],
    group: 'About',
    description: 'Manage the project cards and case studies shown on the About page.',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [generateSlug],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'features',
      type: 'array',
      admin: {
        description: 'Synced from the GitHub README. Add “features” to Locked Fields to preserve manual edits.',
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'text', type: 'textarea' },
      ],
    },
    {
      name: 'architecture',
      type: 'group',
      admin: {
        description: 'Synced from the GitHub README. Add “architecture” to Locked Fields to preserve manual edits.',
      },
      fields: [
        { name: 'summary', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'name', type: 'text' },
            { name: 'purpose', type: 'text' },
            { name: 'detail', type: 'textarea' },
          ],
        },
        { name: 'architectureDiagram', type: 'textarea' },
      ],
    },
    {
      name: 'techStack',
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'repoUrl',
      type: 'text',
    },
    {
      name: 'liveUrl',
      type: 'text',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Highlight',
      admin: {
        position: 'sidebar',
        description: 'Highlighted projects are shown first. Maximum 4.',
      },
      validate: async (value, { req, id }) => {
        if (value !== true) return true

        const result = await req.payload.count({
          collection: 'projects',
          where: {
            and: [
              { featured: { equals: true } },
              ...(id === undefined ? [] : [{ id: { not_equals: id } }]),
            ],
          },
        })

        return result.totalDocs >= 4 ? 'You can highlight at most 4 projects.' : true
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'GitHub', value: 'github' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'githubRepo',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
    {
      name: 'syncFromGitHub',
      type: 'ui',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.githubRepo),
        components: {
          Field: '/components/admin/sync-button#SyncButton',
        },
      },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
    {
      name: 'stars',
      type: 'number',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
    {
      name: 'language',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
    {
      name: 'previewSource',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
    {
      name: 'previewImageUrl',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'importedImageUrls',
      type: 'text',
      hasMany: true,
      admin: { hidden: true },
    },
    {
      name: 'lockedFields',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Title', value: 'title' },
        { label: 'Summary', value: 'summary' },
        { label: 'Description', value: 'description' },
        { label: 'Features', value: 'features' },
        { label: 'Architecture', value: 'architecture' },
        { label: 'Cover image', value: 'coverImage' },
        { label: 'Gallery', value: 'gallery' },
      ],
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.source === 'github',
      },
    },
  ],
}
