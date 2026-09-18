import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    // Azure AD (Entra ID) - Primary authentication for admins
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
      ? [AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          authorization: {
            params: {
              scope: 'openid email profile',
            },
          },
        })]
      : []),
    // Credentials provider as fallback
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaCode: { label: 'MFA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email as string });

        if (!user || user.type !== 'local' || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) {
          return null;
        }

        // Auth check (intentionally no logging in production)

        // Check if MFA is enabled
        if (user.mfaEnabled && user.mfaSecret) {
          // If MFA is enabled but no code provided, return null to prevent login
          if (!credentials.mfaCode || credentials.mfaCode === 'undefined') {
            // MFA required - no code provided
            // Return null to prevent session creation, NextAuth will show CredentialsSignin error
            return null;
          }

          // Verify MFA code
          const totp = new TOTP({ 
            secret: user.mfaSecret,
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
          });
          try {
            const mfaToken = String(credentials.mfaCode ?? '').trim();
            if (!/^[0-9]{6}$/.test(mfaToken)) {
              return null;
            }

            const isValidMfa = await totp.verify(mfaToken);

            if (!isValidMfa) {
              return null;
            }
          } catch (err) {
            console.error('MFA verification error:', err);
            return null;
          }
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account?.provider === 'azure-ad') {
        // First-login registration: an Entra ID sign-in has no local User
        // document yet, so provision one here (role always defaults to
        // 'user' — admin must be granted explicitly, never auto-assigned).
        await connectDB();
        const email = (user.email || (profile as any)?.email || '').toLowerCase();
        let dbUser = await User.findOne({ email });
        if (!dbUser) {
          dbUser = await User.create({
            email,
            name: user.name || (profile as any)?.name || email,
            type: 'entraId',
            role: 'user',
          });
        }
        token.id = dbUser._id.toString();
        token.role = dbUser.role;
      } else if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
