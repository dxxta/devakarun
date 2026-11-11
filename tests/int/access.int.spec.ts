import { describe, expect, it, vi } from 'vitest'

import { canCreateFirstUser, isAdmin } from '../../src/access/users'

describe('user access control', () => {
  it('denies anonymous user creation after the initial seed user exists', async () => {
    const req = {
      payload: {
        count: vi.fn().mockResolvedValue({ totalDocs: 1 }),
      },
    }

    await expect(canCreateFirstUser({ req } as never)).resolves.toBe(false)
  })

  it('denies anonymous reads', () => {
    expect(isAdmin({ req: { user: null } } as never)).toBe(false)
  })
})
