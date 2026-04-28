const { getAuth } = require('@clerk/express');
const { verifyToken, createClerkClient } = require('@clerk/backend');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const clerkAuth = (req, res, next) => next();

const requireAuth = async (req, res, next) => {
  let userId;
  let sessionClaims;

  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        clockSkewInMs: 7200000,
      });
      userId = payload.sub;
      sessionClaims = payload;
      console.log(`[AUTH] Manual verification success for user: ${userId}`);
    } catch (err) {
      console.error(`[AUTH] Manual verification failed: ${err.message}`);
    }
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let email = sessionClaims?.email ||
    sessionClaims?.primary_email_address ||
    sessionClaims?.xmAG_ir?.primary_email_address || '';

  let metadata = sessionClaims?.metadata || sessionClaims?.xmAG_ir || {};

  if (!email && userId) {
    try {
      console.log(`[AUTH] Email missing in token for ${userId}. Fetching from Clerk...`);
      const user = await clerk.users.getUser(userId);
      email = user.emailAddresses[0]?.emailAddress || '';
      metadata = { ...metadata, ...user.publicMetadata };
      console.log(`[AUTH] Successfully fetched user ${userId} details. Email: ${email}`);
    } catch (err) {
      console.error(`[AUTH] Failed to fetch user details for ${userId}: ${err.message}`);
    }
  }

  const role = metadata.role || 'student';

  req.headers['x-user-email'] = email;
  req.headers['x-user-role'] = role;

  next();
};

const requireAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { clerkAuth, requireAuth, requireAdmin };


