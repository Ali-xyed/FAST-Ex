const express = require('express');
const listingController = require('../controllers/listing.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'listing' }));

router.post('/', verifyAuth, (req, res, next) => {
  upload.single('imageUrl')(req, res, (err) => {
    if (err) return res.status(400).json({ message: 'File upload error', error: err.message });
    next();
  });
}, listingController.createListing);
router.get('/', listingController.getListings);
router.get('/my', verifyAuth, listingController.getMyListings);
router.get('/:id', listingController.getListingById);
router.patch('/:id', verifyAuth, (req, res, next) => {
  upload.single('imageUrl')(req, res, (err) => {
    if (err) return res.status(400).json({ message: 'File upload error', error: err.message });
    next();
  });
}, listingController.editListing);
router.delete('/:id', verifyAuth, listingController.deleteListing);

router.post('/:id/comments', verifyAuth, listingController.postComment);
router.delete('/:id/comments/:commentId', verifyAuth, listingController.deleteComment);
router.patch('/:id/verify', verifyAuth, listingController.verifyListingStatus);

router.post('/:id/bargain', verifyAuth, listingController.submitBargain);
router.post('/:id/request', verifyAuth, listingController.requestListing);

router.post('/:id/exchange', verifyAuth, (req, res, next) => {
  upload.single('imageUrl')(req, res, (err) => {
    if (err) return res.status(400).json({ message: 'File upload error', error: err.message });
    next();
  });
}, listingController.submitExchange);

module.exports = router;
