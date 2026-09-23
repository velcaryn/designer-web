import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';

/**
 * Google sign-in for the VelBiz Cloud admin area (/admin/cloud), and nothing
 * else: tenants sign in to the ERP with their own username and password
 * through /api/cloud/auth.
 *
 * Only the basic identity scopes are requested. The source repo also asked
 * for gmail.send and stored the tokens for its email outreach; none of that
 * belongs to Cloud administration, so no Google token is kept here.
 */
export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user }) {
            return ALLOWED_ADMIN_EMAILS.includes(user.email?.toLowerCase()) || '/admin/unauthorized';
        },
    },
    pages: {
        error: '/admin/unauthorized',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
