const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const TOKEN_BUCKET_CAPACITY = 40;
const REFILL_RATE = 20;
const REFILL_INTERVAL = 60;

const rateLimiter = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'];
  const key = `rate:${ip}`;

  const now = Math.floor(Date.now() / 1000);

  const data = await redis.hgetall(key);

  let tokens = parseFloat(data.tokens ?? TOKEN_BUCKET_CAPACITY);
  const lastRefill = parseInt(data.lastRefill ?? now);

  const elapsed = now - lastRefill;
  const refilled = elapsed * (REFILL_RATE / REFILL_INTERVAL);
  tokens = Math.min(TOKEN_BUCKET_CAPACITY, tokens + refilled);

  if (tokens < 1) {
    return res.status(429).json({ message: 'Too many requests. Please slow down.' });
  }

  tokens -= 1;

  await redis.hset(key, { tokens: tokens.toString(), lastRefill: now.toString() });
  await redis.expire(key, REFILL_INTERVAL * 2);

  next();
};

module.exports = { rateLimiter };
