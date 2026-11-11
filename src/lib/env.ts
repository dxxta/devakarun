import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URI: z
    .string()
    .url()
    .refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), {
      message: 'must be a PostgreSQL connection URL',
    }),
  PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ADMIN_EMAIL: z.string().email('must be a valid email address'),
  ADMIN_PASSWORD: z.string().min(12, 'must be at least 12 characters'),
  NEXT_PUBLIC_SITE_URL: z.string().url('must be a valid URL'),
  SMTP_HOST: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  SMTP_PORT: z.preprocess((value) => value === '' ? undefined : value, z.coerce.number().int().min(1).max(65535).optional()),
  SMTP_USER: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  SMTP_PASS: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  SMTP_FROM: z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional()),
  CONTACT_TO: z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional()),
  TURNSTILE_SITE_KEY: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  TURNSTILE_SECRET_KEY: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  AUTH_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  AUTH_GOOGLE_ID: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  AUTH_GOOGLE_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  GITHUB_TOKEN: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  CRON_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
  SEED_CONTENT: z.preprocess((value) => value === '' ? undefined : value, z.string().optional()),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(input: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(input)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const variable = issue.path[0] ?? 'environment'
      return `${String(variable)}: ${issue.message}`
    })

    throw new Error(`Invalid environment configuration:\n${errors.map((error) => `- ${error}`).join('\n')}`)
  }

  return result.data
}

export const env = parseEnv(process.env)
