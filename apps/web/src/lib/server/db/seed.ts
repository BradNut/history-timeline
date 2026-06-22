import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { topics, subtopics, user, account } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

const SEED_TOPICS: Array<{ name: string; slug: string; subtopics: string[] }> = [
	{
		name: 'Historical',
		slug: 'historical',
		subtopics: ['Wars', 'Politics', 'Exploration', 'Revolution']
	},
	{
		name: 'Musical',
		slug: 'musical',
		subtopics: ['Jazz', 'Classical', 'Rock', 'Pop']
	},
	{
		name: 'Scientific',
		slug: 'scientific',
		subtopics: ['Physics', 'Biology', 'Chemistry', 'Astronomy']
	},
	{
		name: 'Cultural',
		slug: 'cultural',
		subtopics: ['Art', 'Literature', 'Film', 'Theatre']
	},
	{
		name: 'Political',
		slug: 'political',
		subtopics: ['Elections', 'Treaties', 'Legislation', 'Diplomacy']
	},
	{
		name: 'Sporting',
		slug: 'sporting',
		subtopics: ['Football', 'Athletics', 'Tennis', 'Olympics']
	}
];

async function seedTopics() {
	console.log('Seeding topics and subtopics...');
	for (const topicData of SEED_TOPICS) {
		const [inserted] = await db
			.insert(topics)
			.values({ name: topicData.name, slug: topicData.slug })
			.onConflictDoNothing()
			.returning();

		const topicRow = inserted ?? (await db.query.topics.findFirst({ where: eq(topics.slug, topicData.slug) }));
		if (!topicRow) throw new Error(`Failed to find or insert topic: ${topicData.name}`);

		for (const subName of topicData.subtopics) {
			const subSlug = subName.toLowerCase().replace(/\s+/g, '-');
			await db
				.insert(subtopics)
				.values({ topicId: topicRow.id, name: subName, slug: subSlug })
				.onConflictDoNothing();
		}
		console.log(`  ✓ ${topicData.name} (${topicData.subtopics.length} subtopics)`);
	}
}

async function seedAdminUser() {
	console.log('Creating admin user...');

	const email = 'admin@historytimeline.local';
	const password = 'changeme-admin-2025';

	const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
	if (existing) {
		console.log('  ℹ Admin user already exists, skipping.');
		return;
	}

	const hash = await hashPassword(password);

	const userId = randomUUID();
	const now = new Date();

	await db.insert(user).values({
		id: userId,
		email,
		name: 'Admin',
		role: 'admin',
		emailVerified: true,
		createdAt: now,
		updatedAt: now
	});

	await db.insert(account).values({
		id: randomUUID(),
		userId,
		accountId: userId,
		providerId: 'credential',
		password: hash,
		createdAt: now,
		updatedAt: now
	});

	console.log(`  ✓ Admin user created: ${email}`);
	console.log(`  ⚠ Change the default password before deploying!`);
}

async function main() {
	try {
		await seedTopics();
		await seedAdminUser();
		console.log('\nSeed complete.');
	} catch (err) {
		console.error('Seed failed:', err);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
