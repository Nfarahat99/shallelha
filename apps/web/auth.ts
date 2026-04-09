import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

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
    jwt({ token, account, profile }) {
      // On first sign-in, capture the Google sub ID as stable userId
      if (account?.providerAccountId) {
        token.id = account.providerAccountId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
