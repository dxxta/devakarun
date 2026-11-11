import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config.js'
import { seedContent } from './content.js'

const payload = await getPayload({ config: await config })

try {
  await seedContent(payload)
  console.log('Portfolio content seed complete.')
} finally {
  await payload.destroy()
}
