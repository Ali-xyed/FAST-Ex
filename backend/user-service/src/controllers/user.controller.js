const userRepo = require('../repositories/user.repository');
const redis = require('../config/redis');
const { sendEvent } = require('../config/kafka');

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

    res.status(200).json({message:"Profile has been updated!"});
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

const addReputation = async (req, res) => {
  try {
    const { email } = req.params;
    const { score } = req.body;
    if (score === undefined) return res.status(400).json({ message: 'Score is required' });

    const profile = await userRepo.updateReputation(email, parseInt(score));
    
    await sendEvent('reputation.updated', { email, change: parseInt(score) });

    await delCache(`user:profile:${email}`, `user:public:${email}`, `user:rep:${email}`);
    res.status(200).json({ message: "Reputation points added!" });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deductReputation = async (req, res) => {
  try {
    const { email } = req.params;
    const { score } = req.body;
    if (score === undefined) return res.status(400).json({ message: 'Score is required' });

    const profile = await userRepo.updateReputation(email, -parseInt(score));
    
    await sendEvent('reputation.updated', { email, change: -parseInt(score) });

    await delCache(`user:profile:${email}`, `user:public:${email}`, `user:rep:${email}`);
    res.status(200).json({ message: "Reputation points deducted!" });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBan = async (req, res) => {
  try {
    const { email } = req.params;
    const { isBan } = req.body;
    const profile = await userRepo.updateUser(email, { isBan });
    await delCache(`user:profile:${email}`, `user:public:${email}`, `user:rep:${email}`);
    res.status(200).json(profile);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const cacheKey = 'users:all';
    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const users = await userRepo.findAllUsers();
    const filteredUsers = users.map(user => ({
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      reputationScore: user.reputationScore
    }));
    
    await setCache(cacheKey, filteredUsers);
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

module.exports = { getProfile, updateProfile, uploadImage, getPublicProfile, getReputation, addReputation, deductReputation, toggleBan, getAllUsers };
