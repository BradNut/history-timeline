import { Redis } from 'ioredis';
import { env } from '$env/dynamic/private';

const NAMESPACE = 'history-timeline';

export const REDIS_PREFIXES = {
	EVENTS: 'events'
} as const;

class RedisService {
	public readonly redis: Redis | null;
	private readonly namespace: string;

	constructor() {
		this.redis =
			env.USE_REDIS_CACHE === 'true' && env.REDIS_URI ? new Redis(env.REDIS_URI) : null;
		this.namespace = NAMESPACE;
	}

	private buildKey(prefix: string, key: string): string {
		return `${this.namespace}:${prefix}:${key}`;
	}

	async get(data: { prefix: string; key: string }): Promise<string | null> {
		if (!this.redis) return null;
		return this.redis.get(this.buildKey(data.prefix, data.key));
	}

	async set(data: { prefix: string; key: string; value: string }): Promise<void> {
		if (!this.redis) return;
		await this.redis.set(this.buildKey(data.prefix, data.key), data.value);
	}

	async delete(data: { prefix: string; key: string }): Promise<void> {
		if (!this.redis) return;
		await this.redis.del(this.buildKey(data.prefix, data.key));
	}

	async setWithExpiry(data: {
		prefix: string;
		key: string;
		value: string;
		expiry: number;
	}): Promise<void> {
		if (!this.redis) return;
		await this.redis.set(
			this.buildKey(data.prefix, data.key),
			data.value,
			'EX',
			Math.floor(data.expiry)
		);
	}

	async scan(data: { prefix: string; pattern: string }): Promise<string[]> {
		if (!this.redis) return [];

		const keys: string[] = [];
		const scanPattern = `${this.namespace}:${data.prefix}:${data.pattern}`;
		let cursor = '0';

		do {
			const result = await this.redis.scan(cursor, 'MATCH', scanPattern, 'COUNT', 100);
			cursor = result[0];
			const foundKeys = result[1];
			const cleanKeys = foundKeys.map((key: string) =>
				key.replace(`${this.namespace}:${data.prefix}:`, '')
			);
			keys.push(...cleanKeys);
		} while (cursor !== '0');

		return keys;
	}

	async ttl(data: { prefix: string; key: string }): Promise<number> {
		if (!this.redis) return 0;
		return this.redis.ttl(this.buildKey(data.prefix, data.key));
	}
}

export const redisService = new RedisService();
