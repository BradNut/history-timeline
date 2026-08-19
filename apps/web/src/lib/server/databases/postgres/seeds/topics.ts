import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle-schema';
import topics from './data/topics.json';

export default async function seed(db: NodePgDatabase<typeof schema>) {
  console.log('Creating topics ...');
  for (const topic of topics) {
    const [inserted] = await db
      .insert(schema.topics)
      .values({ name: topic.name, slug: topic.slug })
      .onConflictDoNothing()
      .returning();

    const topicRow = inserted ?? (await db.query.topics.findFirst({ where: eq(schema.topics.slug, topic.slug) }));
    if (!topicRow) {
      throw new Error(`Failed to find or insert topic: ${topic.name}`);
    }

    for (const subName of topic.subtopics) {
      const subSlug = subName.toLowerCase().replace(/\s+/g, '-');
      await db
        .insert(schema.subtopics)
        .values({ topicId: topicRow.id, name: subName, slug: subSlug })
        .onConflictDoNothing();
    }

    console.log(`  ✓ ${topic.name} (${topic.subtopics.length} subtopics)`);
  }
}
