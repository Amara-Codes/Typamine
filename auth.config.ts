// auth.config.ts
import type { NextAuthOptions } from "next-auth";

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles || [];
        session.user.permissions = token.permissions || [];
      }
      return session;
    },
  },
  providers: [],
};