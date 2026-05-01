const express = require('express');
const listingController = require('../controllers/listing.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'listing' }));

// Listing CRUD
router.post('/', verifyAuth, uploadSingleImage(), listingController.createListing);
router.get('/', listingController.getListings);
router.get('/admin/all', listingController.getAllListingsForAdmin); // Admin endpoint - must be before /:id
router.get('/my', verifyAuth, listingController.getMyListings);
router.get('/:id', listingController.getListingById);
router.patch('/:id', verifyAuth, uploadSingleImage(), listingController.editListing);
router.delete('/:id', verifyAuth, listingController.deleteListing);

// Comments
router.post('/:id/comments', verifyAuth, listingController.postComment);
router.delete('/:id/comments/:commentId', verifyAuth, listingController.deleteComment);
router.patch('/comments/:commentId/verify', verifyAuth, listingController.verifyComment);

// Admin actions
router.patch('/:id/verify', verifyAuth, listingController.verifyListingStatus);
router.patch('/:id/mark', verifyAuth, listingController.updateMarkedStatus);

// Bargain
router.post('/:id/bargain', verifyAuth, listingController.submitBargain);
router.get('/bargains/:id', verifyAuth, listingController.getBargainDetails);
router.patch('/bargains/:bargainId/respond', verifyAuth, listingController.respondBargain);

// Exchange
router.post('/:id/exchange', verifyAuth, uploadSingleImage(), listingController.submitExchange);
router.get('/exchanges/:id', verifyAuth, listingController.getExchangeDetails);
router.patch('/exchanges/:exchangeId/respond', verifyAuth, listingController.respondExchange);

// Request
router.post('/:id/request', verifyAuth, listingController.requestListing);

module.exports = router;
