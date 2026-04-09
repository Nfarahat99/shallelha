import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "شعللها <noreply@shallelha.com>",
    }),
  ],
  // JWT strategy: Vercel cannot reach postgres.railway.internal (private network).
  // JWT sessions avoid a DB read on every session check.
  // Prisma adapter still required for OAuth account linking + magic link tokens.
  session: { strategy: 'jwt' },
  callbacks: {
    // ⚠️ JWT strategy uses {token, user} — NOT {session, user} (that's database strategy)
    jwt({ token, user }) {
      if (user) token.id = user.id
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
