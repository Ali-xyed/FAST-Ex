const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin' }));

// Admin login - public route
router.post('/login', adminController.adminLogin);

// User management - public routes (no auth required)
router.get('/users', adminController.getAllUsers);
router.patch('/users/:email/toggle-ban', adminController.toggleUserBan);

// Listing management - public routes
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/verify', adminController.verifyListing);
router.delete('/listings/:id', adminController.deleteListing);

// Comment management - public routes
router.delete('/listings/:id/comments/:commentId', adminController.deleteComment);
router.patch('/comments/:commentId/verify', adminController.verifyComment);

module.exports = router;
