const userRepo = require('../repositories/user.repository');
const redis = require('../config/redis');

const CACHE_TTL = 300;

const getFromCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const setCache = async (key, value) => {
  try { await redis.setex(key, CACHE_TTL, JSON.stringify(value)); } catch { }
};

const delCache = async (...keys) => {
  try { if (keys.length) await redis.del(...keys); } catch { }
};

const getProfile = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const cacheKey = `user:profile:${email}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const profile = await userRepo.findByEmail(email);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await setCache(cacheKey, profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { name, rollNo } = req.body;
    const profile = await userRepo.updateUser(email, { name, rollNo });

    await delCache(`user:profile:${email}`, `user:public:${email}`);

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const email = req.headers['x-user-email'];
    const imageUrl = req.file.location;
    const profile = await userRepo.updateUser(email, { imageUrl });

    await delCache(`user:profile:${email}`, `user:public:${email}`);

    res.status(200).json({ message: 'Image uploaded', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const cacheKey = `user:public:${email}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const profile = await userRepo.findByEmail(email);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await setCache(cacheKey, profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReputation = async (req, res) => {
  try {
    const { email } = req.params;
    const cacheKey = `user:rep:${email}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const profile = await userRepo.findByEmail(email);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const data = { reputationScore: profile.reputationScore };
    await setCache(cacheKey, data);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBan = async (req, res) => {
  try {
    const { email } = req.params;
    const { isBan } = req.body;
    let newStatus = isBan;

    const user = await userRepo.findByEmail(email);
    if (!user) {
      console.error(`[User Service] User profile not found for email: ${email}`);
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (newStatus === undefined) {
      newStatus = !user.isBan;
    }

    const profile = await userRepo.updateUser(email, { isBan: newStatus });

    await delCache(`user:profile:${email}`, `user:public:${email}`, `user:rep:${email}`);

    res.status(200).json(profile);
  } catch (error) {
    console.error(`[User Service] Toggle ban error for ${req.params.email}:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, uploadImage, getPublicProfile, getReputation, toggleBan };
