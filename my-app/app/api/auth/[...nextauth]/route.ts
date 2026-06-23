import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import OktaProvider from 'next-auth/providers/okta';

/**
 * NextAuth Configuration
 * 
 * IMPORTANT: This is a FRAMEWORK ONLY implementation.
 * - Okta provider is stubbed with placeholder credentials
 * - Local development bypass is handled in middleware.ts
 * - Production authentication to be configured later
 */

export const authOptions: NextAuthOptions = {
  providers: [
    OktaProvider({
      clientId: process.env.OKTA_CLIENT_ID || 'placeholder-client-id',
      clientSecret: process.env.OKTA_CLIENT_SECRET || 'placeholder-client-secret',
      issuer: process.env.OKTA_ISSUER || 'https://placeholder.okta.com',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Future: Attach user metadata from agency_users table
      // For now, pass through the session as-is
      return session;
    },
    async jwt({ token, user }) {
      // Future: Add custom claims from database
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
