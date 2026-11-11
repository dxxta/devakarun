import { beforeEach, describe, expect, it, vi } from 'vitest'

const { count, getPayload } = vi.hoisted(() => ({
  count: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPayload.mockResolvedValue({ count })
    count.mockResolvedValue({ totalDocs: 1 })
  })

  it('returns healthy after the database responds', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
    expect(count).toHaveBeenCalledWith({ collection: 'users' })
  })

  it('returns unavailable when the database check fails', async () => {
    count.mockRejectedValue(new Error('database unavailable'))

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: 'error' })
  })
})
