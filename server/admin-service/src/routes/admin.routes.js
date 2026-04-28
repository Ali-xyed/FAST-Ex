const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin' }));

// User management
router.get('/users', verifyAuth, adminController.getAllUsers);
router.patch('/users/:email/toggle-ban', verifyAuth, adminController.toggleUserBan);

// Listing management
router.patch('/listings/:id/verify', verifyAuth, adminController.verifyListing);
router.delete('/listings/:id', verifyAuth, adminController.deleteListing);

// Comment management
router.delete('/listings/:id/comments/:commentId', verifyAuth, adminController.deleteComment);

module.exports = router;
