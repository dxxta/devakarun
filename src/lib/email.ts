import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { Payload } from 'payload'
import { env } from './env'

export function createPayloadEmailAdapter() {
  if (!env.SMTP_HOST) return undefined

  return nodemailerAdapter({
    defaultFromAddress: env.SMTP_FROM ?? 'no-reply@localhost',
    defaultFromName: 'dev.akarun',
    transportOptions: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    },
  })
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character)
}

export async function sendContactNotice(
  payload: Pick<Payload, 'sendEmail'>,
  input: { name: string; email: string; subject: string; message: string },
): Promise<void> {
  const to = env.CONTACT_TO
  if (!to) {
    console.info('Contact message received:', input.subject)
    return
  }
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const subject = escapeHtml(input.subject)
  const message = escapeHtml(input.message)
  await payload.sendEmail({
    to,
    subject: `Contact: ${input.subject}`,
    text: `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`,
    html: `<h1>New contact message</h1><p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Subject:</strong> ${subject}</p><p>${message.replace(/\n/g, '<br>')}</p>`,
  })
}

export async function sendNewsletterConfirmation(
  payload: Pick<Payload, 'sendEmail'>,
  email: string,
  confirmationURL: string,
  unsubscribeURL: string,
): Promise<void> {
  const escapedEmail = escapeHtml(email)
  const escapedURL = escapeHtml(confirmationURL)
  const escapedUnsubscribeURL = escapeHtml(unsubscribeURL)
  await payload.sendEmail({
    to: email,
    subject: 'Confirm your newsletter subscription',
    text: `Confirm your subscription for ${email}: ${confirmationURL}`,
    html: `<p>Confirm your subscription for ${escapedEmail}:</p><p><a href="${escapedURL}">Confirm subscription</a></p><p><a href="${escapedUnsubscribeURL}">Unsubscribe</a></p>`,
  })
}
