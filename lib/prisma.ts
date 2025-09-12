import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma Client instance.
// This is done to prevent creating new connections on every hot reload in development.
declare global {
  // eslint-disable-next-line no-var
var prisma: PrismaClient | undefined;
}

// Check if the prisma instance already exists in the global scope.
// If not, create a new one.
const client = globalThis.prisma || new PrismaClient();

// In development, set the global prisma instance to the newly created client.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = client;
}

export default client;
