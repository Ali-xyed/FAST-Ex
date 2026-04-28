const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => console.log('[User Service] Redis connected'));
redis.on('error', (err) => console.error('[User Service] Redis error:', err.message));

redis.connect().catch(() => {});

module.exports = redis;
