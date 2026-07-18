import { PrismaClient } from '../prisma/generated-client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaInstance: PrismaClient | null = null;

const getPrismaInstance = (): PrismaClient => {
  if (prismaInstance) return prismaInstance;

  let dbBinding: any = null;
  try {
    // Retrieve the binding dynamically from the Cloudflare request context
    const context = require("@opennextjs/cloudflare").getCloudflareContext();
    const envKeys = context?.env ? Object.keys(context.env) : [];
    console.log('[Prisma] Cloudflare env keys available:', envKeys);
    dbBinding = context?.env?.TYPAMINE_DB;
  } catch (e) {
    // Fail silently in environments without Cloudflare context (e.g. CLI seed scripts)
    console.warn("[Prisma] Error reading Cloudflare context:", e);
  }

  console.log('[Prisma] Initializing client... TYPAMINE_DB is present:', !!dbBinding);

  if (dbBinding) {
    console.log('[Prisma] Using Cloudflare D1 adapter');
    const adapter = new PrismaD1(dbBinding);
    prismaInstance = new PrismaClient({ adapter });
  } else {
    console.log('[Prisma] Falling back to Local SQLite');
    prismaInstance = new PrismaClient();
  }

  return prismaInstance;
}

// Use a Proxy to lazily delegate queries to the Prisma instance when they are actually called
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export const getDatabaseSource = () => {
  let dbBinding: any = null;
  try {
    const { env } = require("@opennextjs/cloudflare").getCloudflareContext();
    dbBinding = env?.TYPAMINE_DB;
  } catch (e) {}

  console.log('[Prisma] getDatabaseSource called. TYPAMINE_DB is present:', !!dbBinding);
  if (dbBinding) {
    return "Cloudflare D1 (Production/Remote)"
  }
  return "Local SQLite (dev.db)"
}

export default prisma

if (process.env.NODE_ENV !== 'production') {
  // We can't assign proxy directly to global because global is expected to be PrismaClient, but it works
  (globalThis as any).prisma = prisma;
}
