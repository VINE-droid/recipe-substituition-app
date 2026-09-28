import { PrismaClient } from '@prisma/client';

// Singleton pattern — reuse the same client across hot reloads in dev
const prisma = new PrismaClient();

export default prisma;
