import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { getPayload } from 'payload'
import config from '@payload-config'

const googleClientID = process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
export const googleSignInEnabled = Boolean(googleClientID && googleClientSecret)

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & NonNullable<DefaultSession['user']>
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.PAYLOAD_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: googleSignInEnabled && googleClientID && googleClientSecret
    ? [Google({ clientId: googleClientID, clientSecret: googleClientSecret })]
    : [],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider !== 'google') return token

      const googleId = account.providerAccountId
      const email = user.email?.trim().toLowerCase()
      if (!googleId || !email) throw new Error('Google account is missing required profile details.')

      const payload = await getPayload({ config })
      const existing = await payload.find({
        collection: 'commenters',
        where: { googleId: { equals: googleId } },
        limit: 1,
        overrideAccess: true,
      })
      const data = {
        googleId,
        email,
        name: user.name?.trim() || email,
        avatar: user.image || undefined,
      }
      const commenter = existing.docs[0]
        ? await payload.update({ collection: 'commenters', id: existing.docs[0].id, data, overrideAccess: true })
        : await payload.create({ collection: 'commenters', data, overrideAccess: true })

      token.sub = String(commenter.id)
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
  },
})
