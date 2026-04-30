import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        if (user.isSuspended) throw new Error('Account suspended. Contact admin.');
        return {
          id:          user._id.toString(),
          name:        user.name,
          email:       user.email,
          role:        user.role,
          isApproved:  user.isApproved,
          isSuspended: user.isSuspended,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = user.role;
        token.isApproved  = user.isApproved;
        token.isSuspended = user.isSuspended;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id          = token.id;
      session.user.role        = token.role;
      session.user.isApproved  = token.isApproved;
      session.user.isSuspended = token.isSuspended;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
