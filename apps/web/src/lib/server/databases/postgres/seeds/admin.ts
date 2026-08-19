import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle-schema';

export default async function seed(db: NodePgDatabase<typeof schema>) {
  console.log('Creating admin user ...');

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@historytimeline.local';
  const password = process.env.ADMIN_SEED_PASSWORD || 'changeme-admin-2025';
  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set');
  }

  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (existing) {
    console.log('  ℹ Admin user already exists, skipping.');
    return;
  }

  const hash = await hashPassword(password);
  const userId = randomUUID();
  const now = new Date();

  await db.insert(schema.user).values({
    id: userId,
    email,
    name: 'Admin',
    role: 'admin',
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.account).values({
    id: randomUUID(),
    userId,
    accountId: userId,
    providerId: 'credential',
    password: hash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  ✓ Admin user created: ${email}`);
}
