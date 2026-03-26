const express = require('express');
const listingController = require('../controllers/listing.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.post('/', verifyAuth, upload.single('image'), listingController.createListing);
router.get('/', listingController.getListings);
router.get('/my', verifyAuth, listingController.getMyListings);
router.get('/:id', listingController.getListingById);
router.delete('/:id', verifyAuth, listingController.deleteListing);

router.post('/:id/comments', verifyAuth, listingController.postComment);
router.delete('/:id/comments/:commentId', verifyAuth, listingController.deleteComment);
router.patch('/:id/verify', verifyAuth, listingController.verifyListingStatus);

router.post('/:id/bargain', verifyAuth, listingController.submitBargain);
router.post('/:id/request', verifyAuth, listingController.requestListing);
router.patch('/bargain/:bargainId', verifyAuth, listingController.respondBargain);

module.exports = router;
