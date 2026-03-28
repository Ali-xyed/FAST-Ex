const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin' }));

router.get('/users', verifyAuth, adminController.getAllUsers);
router.patch('/users/:email/toggle-ban', verifyAuth, adminController.toggleUserBan);
router.patch('/listings/:id/verify', verifyAuth, adminController.verifyListing);
router.delete('/listings/:id', verifyAuth, adminController.deleteListing);
router.delete('/listings/:id/comments/:commentId', verifyAuth, adminController.deleteComment);

module.exports = router;
