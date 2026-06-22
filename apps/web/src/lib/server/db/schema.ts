import {
	pgTable,
	serial,
	integer,
	text,
	date,
	boolean,
	timestamp,
	unique,
	index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const topics = pgTable('topics', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const subtopics = pgTable('subtopics', {
	id: serial('id').primaryKey(),
	topicId: integer('topic_id')
		.notNull()
		.references(() => topics.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => [unique().on(t.topicId, t.slug)]);

export const events = pgTable('events', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	eventDate: date('event_date').notNull(),
	endDate: date('end_date'),
	year: integer('year').notNull(),
	month: integer('month').notNull(),
	day: integer('day').notNull(),
	imageUrl: text('image_url'),
	sourceUrl: text('source_url'),
	sourceType: text('source_type'),
	rawCategories: text('raw_categories').array(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (t) => [
	index('events_month_day_idx').on(t.month, t.day),
	index('events_year_idx').on(t.year)
]);

export const eventTopics = pgTable('event_topics', {
	id: serial('id').primaryKey(),
	eventId: integer('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	topicId: integer('topic_id')
		.notNull()
		.references(() => topics.id, { onDelete: 'cascade' }),
	subtopicId: integer('subtopic_id').references(() => subtopics.id, { onDelete: 'set null' })
}, (t) => [unique().on(t.eventId, t.topicId, t.subtopicId)]);

export const taxonomyMappings = pgTable('taxonomy_mappings', {
	id: serial('id').primaryKey(),
	rawCategory: text('raw_category').notNull().unique(),
	topicId: integer('topic_id')
		.notNull()
		.references(() => topics.id, { onDelete: 'cascade' }),
	subtopicId: integer('subtopic_id').references(() => subtopics.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const unmappedCategories = pgTable('unmapped_categories', {
	id: serial('id').primaryKey(),
	rawCategory: text('raw_category').notNull().unique(),
	exampleEventId: integer('example_event_id').references(() => events.id, { onDelete: 'set null' }),
	resolved: boolean('resolved').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const importLogs = pgTable('import_logs', {
	id: serial('id').primaryKey(),
	type: text('type').notNull(),
	status: text('status').notNull(),
	eventsUpserted: integer('events_upserted').notNull().default(0),
	unmappedCount: integer('unmapped_count').notNull().default(0),
	errorMessage: text('error_message'),
	startedAt: timestamp('started_at').defaultNow().notNull(),
	finishedAt: timestamp('finished_at')
});

export const topicsRelations = relations(topics, ({ many }) => ({
	subtopics: many(subtopics),
	eventTopics: many(eventTopics),
	taxonomyMappings: many(taxonomyMappings)
}));

export const subtopicsRelations = relations(subtopics, ({ one, many }) => ({
	topic: one(topics, { fields: [subtopics.topicId], references: [topics.id] }),
	eventTopics: many(eventTopics)
}));

export const eventsRelations = relations(events, ({ many }) => ({
	eventTopics: many(eventTopics)
}));

export const eventTopicsRelations = relations(eventTopics, ({ one }) => ({
	event: one(events, { fields: [eventTopics.eventId], references: [events.id] }),
	topic: one(topics, { fields: [eventTopics.topicId], references: [topics.id] }),
	subtopic: one(subtopics, { fields: [eventTopics.subtopicId], references: [subtopics.id] })
}));

export * from './auth.schema';
