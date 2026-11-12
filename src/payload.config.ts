import { postgresAdapter } from '@payloadcms/db-postgres'
import { searchPlugin } from '@payloadcms/plugin-search'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { portfolioCollections, portfolioGlobals } from './collections/portfolio'
import { blogCollections } from './collections/blog'
import { engagementCollections } from './collections/engagement'
import { migrations } from './migrations'
import { env } from './lib/env'
import { createPayloadEmailAdapter } from './lib/email'
import { logFeatureStatus } from './lib/feature-status'
import { seedAdmin } from './seed/admin'
import { seedContentIfEmpty } from './seed/bootstrap'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- dev.akarun',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
      openGraph: { siteName: 'dev.akarun' },
    },
    components: {
      graphics: {
        Logo: '/components/admin/admin-logo#AdminLogo',
        Icon: '/components/admin/admin-icon#AdminIcon',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, ...portfolioCollections, ...blogCollections, ...engagementCollections],
  globals: [...portfolioGlobals],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  email: createPayloadEmailAdapter(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    prodMigrations: migrations,
    pool: {
      connectionString: env.DATABASE_URI,
    },
  }),
  sharp,
  plugins: [searchPlugin({ collections: ['posts', 'projects'] })],
  onInit: async (payload) => {
    logFeatureStatus(payload)
    await seedAdmin(payload)
    try {
      await seedContentIfEmpty(payload)
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Could not seed the initial portfolio content.' })
    }
  },
})
