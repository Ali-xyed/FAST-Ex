const express = require('express');
const proxy = require('express-http-proxy');
const { clerkAuth, requireAuth, requireAdmin } = require('./middleware/auth.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

router.use(clerkAuth);
router.use(rateLimiter);

const proxyOptions = () => ({
  proxyReqPathResolver: (req) => req.originalUrl,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-email'] = srcReq.headers['x-user-email'] || '';
    proxyReqOpts.headers['x-user-role'] = srcReq.headers['x-user-role'] || '';
    return proxyReqOpts;
  },
  parseReqBody: false
});


router.use('/api/auth/toggle-ban', requireAuth, proxy(process.env.AUTH_SERVICE_URL, proxyOptions(process.env.AUTH_SERVICE_URL)));
router.use('/api/auth/profile', requireAuth, proxy(process.env.AUTH_SERVICE_URL, proxyOptions(process.env.AUTH_SERVICE_URL)));
router.use('/api/auth', proxy(process.env.AUTH_SERVICE_URL, proxyOptions(process.env.AUTH_SERVICE_URL)));

router.get('/api/users/all', proxy(process.env.USER_SERVICE_URL, proxyOptions(process.env.USER_SERVICE_URL)));
router.patch('/api/users/:email/ban', proxy(process.env.USER_SERVICE_URL, proxyOptions(process.env.USER_SERVICE_URL)));

router.use('/api/users', requireAuth, proxy(process.env.USER_SERVICE_URL, proxyOptions(process.env.USER_SERVICE_URL)));
router.get('/api/listings', proxy(process.env.LISTING_SERVICE_URL, proxyOptions(process.env.LISTING_SERVICE_URL)));
router.get('/api/listings/my', requireAuth, proxy(process.env.LISTING_SERVICE_URL, proxyOptions(process.env.LISTING_SERVICE_URL)));
router.get('/api/listings/:id', proxy(process.env.LISTING_SERVICE_URL, proxyOptions(process.env.LISTING_SERVICE_URL)));
router.use('/api/listings', requireAuth, proxy(process.env.LISTING_SERVICE_URL, proxyOptions(process.env.LISTING_SERVICE_URL)));
router.use('/api/messages', requireAuth, proxy(process.env.MESSAGE_SERVICE_URL, proxyOptions(process.env.MESSAGE_SERVICE_URL)));
router.use('/api/notifications', requireAuth, proxy(process.env.NOTIFICATION_SERVICE_URL, proxyOptions(process.env.NOTIFICATION_SERVICE_URL)));

router.post('/api/admin/login', proxy(process.env.ADMIN_SERVICE_URL, proxyOptions(process.env.ADMIN_SERVICE_URL)));
router.use('/api/admin', requireAuth, proxy(process.env.ADMIN_SERVICE_URL, proxyOptions(process.env.ADMIN_SERVICE_URL)));

module.exports = router;
