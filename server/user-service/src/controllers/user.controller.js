const userRepo = require('../repositories/user.repository');
const redis = require('../config/redis');
const { sendEvent } = require('../config/kafka');
const axios = require('axios');

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
    const role = req.headers['x-user-role'];
    const cacheKey = `user:profile:${email}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    let profile = await userRepo.findByEmail(email);
    
    // If profile doesn't exist, create it automatically
    if (!profile) {
      console.log(`Creating missing profile for ${email}`);
      profile = await userRepo.upsertUser(email, email.split('@')[0], '', role || 'STUDENT');
    }

    await setCache(cacheKey, profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createProfile = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const role = req.headers['x-user-role'];
    const { name, rollNo } = req.body;

    const profile = await userRepo.upsertUser(
      email, 
      name || email.split('@')[0], 
      rollNo || '', 
      role || 'STUDENT'
    );

    await delCache(`user:profile:${email}`, `user:public:${email}`);
    res.status(201).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { name, rollNo } = req.body;
    
    console.log(`[USER] Updating profile for ${email}:`, { name, rollNo });
    
    // Update profile in User Service
    const profile = await userRepo.updateUser(email, { name, rollNo });
    console.log(`[USER] Profile updated in user database for ${email}`);

    // Also update the Auth Service
    try {
      const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/api/auth/profile`;
      console.log(`[USER] Calling auth service at: ${authServiceUrl}`);
      
      const response = await axios.put(authServiceUrl, {
        name,
        rollNo
      }, {
        headers: {
          'x-user-email': email,
          'x-user-role': req.headers['x-user-role']
        }
      });
      
      console.log(`[USER] Auth service response:`, response.data);
    } catch (authServiceError) {
      console.error('[USER] Failed to update profile in Auth Service:', authServiceError.message);
      if (authServiceError.response) {
        console.error('[USER] Auth service error response:', authServiceError.response.data);
        console.error('[USER] Auth service error status:', authServiceError.response.status);
      }
      // Don't fail the update if auth service is down
    }

    // Clear user profile caches
    await delCache(`user:profile:${email}`, `user:public:${email}`);
    
    // Clear all listing caches so profile updates reflect immediately
    try {
      const keys = await redis.keys('listings:all:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[USER] Cleared ${keys.length} listing cache keys after profile update`);
      }
    } catch (cacheErr) {
      console.error('[USER] Error clearing listing caches:', cacheErr);
    }

    res.status(200).json({message:"Profile has been updated!"});
  } catch (error) {
    console.error('[USER] Error in updateProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const email = req.headers['x-user-email'];
    const imageUrl = req.file.location;
    const profile = await userRepo.updateUser(email, { imageUrl });

    // Clear user profile caches
    await delCache(`user:profile:${email}`, `user:public:${email}`);
    
    // Clear all listing caches so profile images update immediately
    try {
      const keys = await redis.keys('listings:all:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} listing cache keys after profile image upload`);
      }
    } catch (cacheErr) {
      console.error('Error clearing listing caches:', cacheErr);
    }

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

    let profile = await userRepo.findByEmail(email);
    
    // If profile doesn't exist, create it automatically
    if (!profile) {
      console.log(`Creating missing public profile for ${email}`);
      profile = await userRepo.upsertUser(email, email.split('@')[0], '', 'STUDENT');
    }

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
    const filteredUsers = users
      .filter(user => user.role !== 'ADMIN')
      .map(user => ({
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        reputationScore: user.reputationScore,
        isBan: user.isBan || false
      }));
    
    await setCache(cacheKey, filteredUsers);
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    
    // Send event to delete all user data across services
    await sendEvent('user.deleted', { email });
    
    // Delete user from user service
    await userRepo.deleteUser(email);
    
    // Clear all caches related to this user
    await delCache(`user:profile:${email}`, `user:public:${email}`, `user:rep:${email}`);
    
    // Clear all listing caches
    try {
      const keys = await redis.keys('listings:all:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (cacheErr) {
      console.error('Error clearing listing caches:', cacheErr);
    }
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

module.exports = { getProfile, createProfile, updateProfile, uploadImage, getPublicProfile, getReputation, addReputation, deductReputation, toggleBan, getAllUsers, deleteAccount };
