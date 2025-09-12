import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';




console.log('NEXTAUTH_URL in route.ts:', process.env.NEXTAUTH_URL);

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };