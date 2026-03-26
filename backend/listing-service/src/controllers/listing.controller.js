const listingRepo = require('../repositories/listing.repository');
const { sendEvent } = require('../config/kafka');
const { getIo } = require('../socket');
const { publishMessage } = require('../config/rabbitmq');
const redis = require('../config/redis');

const CACHE_TTL_ALL = 120;
const CACHE_TTL_ONE = 300;

const getFromCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const setCache = async (key, value, ttl) => {
  try { await redis.setex(key, ttl, JSON.stringify(value)); } catch { }
};

const delCache = async (...keys) => {
  try { if (keys.length) await redis.del(...keys); } catch { }
};

const delCachePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch { }
};

const createListing = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { type, title, description, price, pricePerHour, withTitle, withDescription } = req.body;

    const listing = await listingRepo.createListing({ email, type, title, description });

    if (type === 'SELL' && price) {
      await listingRepo.createSellListing({ listingId: listing.id, price: parseFloat(price) });
    }
    if (type === 'RENT' && pricePerHour) {
      await listingRepo.createRentListing({ listingId: listing.id, pricePerHour: parseFloat(pricePerHour) });
    }
    if (type === 'EXCHANGE') {
      await listingRepo.createExchangeListing({ listingId: listing.id, withTitle: withTitle || '', withDescription: withDescription || '' });
    }

    await delCachePattern('listings:all:*');
    await delCache(`listings:my:${email}`);

    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating listing' });
  }
};

const getListings = async (req, res) => {
  try {
    const { type, search } = req.query;
    const cacheKey = `listings:all:${type || ''}:${search || ''}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const where = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const listings = await listingRepo.findAllListings({
      where,
      include: { sellListing: true, rentListing: true, exchangeListing: true },
      orderBy: { createdAt: 'desc' }
    });

    await setCache(cacheKey, listings, CACHE_TTL_ALL);
    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching listings' });
  }
};

const getMyListings = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const cacheKey = `listings:my:${email}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const listings = await listingRepo.findAllListings({
      where: { email },
      include: { sellListing: true, rentListing: true, exchangeListing: true },
      orderBy: { createdAt: 'desc' }
    });

    await setCache(cacheKey, listings, CACHE_TTL_ALL);
    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching your listings' });
  }
};

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `listing:${id}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    await setCache(cacheKey, listing, CACHE_TTL_ONE);
    res.status(200).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching listing' });
  }
};

const postComment = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { id } = req.params;
    const { content } = req.body;

    const comment = await listingRepo.createComment({ listingId: id, fromEmail: email, content });

    try { getIo().to(id).emit('new_comment', comment); } catch (e) { }
    await sendEvent('comment.posted', { listingId: id, fromEmail: email, content });

    await delCache(`listing:${id}`);

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting comment' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    await listingRepo.deleteComment(commentId);

    await delCache(`listing:${id}`);

    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

const submitBargain = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { id } = req.params;
    const { price, type, sellListingId, rentListingId } = req.body;

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const bargain = await listingRepo.createBargain({
      fromEmail: email,
      toEmail: listing.email,
      price: parseFloat(price),
      type,
      sellListingId: sellListingId || null,
      rentListingId: rentListingId || null
    });

    await sendEvent('bargain.submitted', { bargainId: bargain.id, fromEmail: email, toEmail: listing.email, price });

    await delCache(`listing:${id}`);

    res.status(201).json(bargain);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting bargain' });
  }
};

const respondBargain = async (req, res) => {
  try {
    const { bargainId } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const bargain = await listingRepo.updateBargainStatus(bargainId, status);
    const topic = status === 'ACCEPTED' ? 'bargain.accepted' : 'bargain.declined';
    await sendEvent(topic, { bargainId: bargain.id, fromEmail: bargain.fromEmail, toEmail: bargain.toEmail });

    res.status(200).json(bargain);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error responding to bargain' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await listingRepo.findListingById(id);

    await listingRepo.deleteListing(id);

    await delCache(`listing:${id}`);
    await delCachePattern('listings:all:*');
    if (listing) await delCache(`listings:my:${listing.email}`);

    res.status(200).json({ message: 'Listing deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting listing' });
  }
};

const verifyListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    const listing = await listingRepo.updateListing(id, { isVerified });

    await delCache(`listing:${id}`);
    await delCachePattern('listings:all:*');

    res.status(200).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying listing' });
  }
};

const requestListing = async (req, res) => {
  try {
    const requesterEmail = req.headers['x-user-email'];
    const { id } = req.params;

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    await sendEvent('listing.requested', {
      listingId: id,
      listingTitle: listing.title,
      ownerEmail: listing.email,
      requesterEmail
    });

    publishMessage('email.request', {
      ownerEmail: listing.email,
      requesterEmail,
      listingTitle: listing.title
    });

    res.status(200).json({ message: 'Request sent to listing owner' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending request' });
  }
};

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  postComment,
  deleteComment,
  submitBargain,
  respondBargain,
  deleteListing,
  verifyListingStatus,
  requestListing
};
