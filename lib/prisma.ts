import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient();
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export const getDatabaseSource = () => {
  return process.env.NODE_ENV === 'production' ? "Production Database" : "Local SQLite (dev.db)"
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
