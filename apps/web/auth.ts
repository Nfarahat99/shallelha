import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required on Vercel — sits behind a proxy, headers include x-forwarded-host
  // No Prisma adapter — Vercel cannot reach postgres.railway.internal.
  // JWT sessions are self-contained; no DB read needed per request.
  // Google sub ID is used as the stable userId (unique per Google account).
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, trigger }) {
      // On first sign-in, capture the Google sub ID as stable userId
      if (account?.providerAccountId) {
        token.id = account.providerAccountId
      }
      // Load display name and avatar from DB on sign-in, session update, or when not yet cached
      if (trigger === 'signIn' || trigger === 'update' || !token.displayName) {
        const userId = (token.id ?? token.sub) as string | undefined
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { displayName: true, avatarEmoji: true },
          })
          if (dbUser) {
            token.displayName = dbUser.displayName ?? undefined
            token.avatarEmoji = dbUser.avatarEmoji ?? undefined
          }
        }
      }
      return token
    },
    session({ session, token }) {
      session.user.id = (token.id ?? token.sub) as string
      session.user.displayName = token.displayName as string | undefined
      session.user.avatarEmoji = token.avatarEmoji as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
