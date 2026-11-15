import type { GlobalConfig } from 'payload'

import { isAdmin } from '../access/users'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'About',
    description: 'Set the site title, description, and public social links.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'announcement',
      type: 'group',
      label: 'Top marquee',
      admin: {
        description:
          'Scrolling bar fixed at the top of every page. Leave the text empty to keep the default message that points visitors to the contact page.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Show marquee' },
        { name: 'text', type: 'text', label: 'Message' },
        { name: 'linkLabel', type: 'text', label: 'Link label' },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Link URL',
          admin: { description: 'Defaults to /contact when a message is set without a link.' },
        },
      ],
    },
    {
      name: 'siteTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'socialLinks',
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
