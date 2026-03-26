const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => console.log('[Listing Service] Redis connected'));
redis.on('error', (err) => console.error('[Listing Service] Redis error:', err.message));

redis.connect().catch(() => {});

module.exports = redis;
