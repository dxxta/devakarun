import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('Media collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('requires alt text and configures image upload sizes', async () => {
    const mediaCollection = payload.collections.media
    const altField = mediaCollection.config.fields.find(
      (field) => 'name' in field && field.name === 'alt',
    )
    const upload = mediaCollection.config.upload

    expect(altField).toMatchObject({ name: 'alt', type: 'text', required: true })
    expect(upload).toMatchObject({
      staticDir: 'media',
      mimeTypes: ['image/*'],
      imageSizes: [{ name: 'thumbnail', width: 400 }, { name: 'card', width: 800 }],
    })
  })
})
