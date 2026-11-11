import { describe, expect, it } from 'vitest'

import { parseEnv } from '../../src/lib/env'

const validEnv = {
  DATABASE_URI: 'postgres://akarun:akarun@localhost:5432/akarun',
  PAYLOAD_SECRET: 'a-secure-secret-that-is-at-least-32-characters-long',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'a-long-admin-password',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
}

describe('environment validation', () => {
  it('accepts valid configuration', () => {
    expect(parseEnv(validEnv)).toEqual(validEnv)
  })

  it('lists every missing or invalid variable in the error', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        DATABASE_URI: 'invalid',
        PAYLOAD_SECRET: 'short',
        ADMIN_EMAIL: 'not-an-email',
        ADMIN_PASSWORD: 'short',
        NEXT_PUBLIC_SITE_URL: 'invalid',
      }),
    ).toThrow(/DATABASE_URI.*PAYLOAD_SECRET.*ADMIN_EMAIL.*ADMIN_PASSWORD.*NEXT_PUBLIC_SITE_URL/s)
  })
})
