const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin' }));

router.post('/login', adminController.adminLogin);

router.get('/users', adminController.getAllUsers);
router.patch('/users/:email/toggle-ban', adminController.toggleUserBan);

router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/verify', adminController.verifyListing);
router.delete('/listings/:id', adminController.deleteListing);

router.delete('/listings/:id/comments/:commentId', adminController.deleteComment);
router.patch('/comments/:commentId/verify', adminController.verifyComment);

module.exports = router;
