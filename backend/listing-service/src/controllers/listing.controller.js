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
    if (!email) {
      return res.status(401).json({ message: 'User email not found in headers' });
    }

    const { type, title, description, price, pricePerHour } = req.body;
    
    if (!type || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields: type, title, description' });
    }

    const imageUrl = req.file ? req.file.location : null;

    const listing = await listingRepo.createListing({ email, type, title, description, imageUrl });

    if (type === 'SELL' && price) {
      await listingRepo.createSellListing({ 
        listingId: listing.id, 
        price: parseFloat(price)
      });
    }
    if (type === 'RENT' && pricePerHour) {
      await listingRepo.createRentListing({ 
        listingId: listing.id, 
        pricePerHour: parseFloat(pricePerHour)
      });
    }
    if (type === 'EXCHANGE') {
      await listingRepo.createExchangeListing({ 
        listingId: listing.id
      });
    }

    await delCachePattern('listings:all:*');
    await delCache(`listings:my:${email}`);

    res.status(201).json({message: "Item has been posted!"});
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ message: 'Server error creating listing', error: err.message });
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

    const axios = require('axios');
    const listingsWithProfiles = await Promise.all(
      listings.map(async (listing) => {
        try {
          const profileResponse = await axios.get(`${process.env.USER_SERVICE_URL}/api/users/public/${listing.email}`);
          return { 
            ...listing, 
            userProfile: profileResponse.data,
            profileImageUrl: profileResponse.data?.imageUrl || null
          };
        } catch (err) {
          return { 
            ...listing, 
            userProfile: null,
            profileImageUrl: null
          };
        }
      })
    );

    await setCache(cacheKey, listingsWithProfiles, CACHE_TTL_ALL);
    res.status(200).json(listingsWithProfiles);
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

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const comment = await listingRepo.createComment({ listingId: id, fromEmail: email, content });

    try { getIo().to(id).emit('new_comment', comment); } catch (e) { }
    await sendEvent('comment.posted', { listingId: id, fromEmail: email, ownerEmail: listing.email, content });

    await delCache(`listing:${id}`);

    res.status(201).json({ message: 'Comment posted' });
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
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({ message: 'Price is required' });
    }

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.type !== 'SELL' && listing.type !== 'RENT') {
      return res.status(400).json({ message: 'Bargaining is only available for SELL and RENT listings' });
    }

    // Send Kafka notification
    await sendEvent('bargain.received', { 
      fromEmail: email, 
      toEmail: listing.email, 
      price: parseFloat(price),
      listingTitle: listing.title,
      listingType: listing.type
    });

    // Send RabbitMQ email
    publishMessage('bargain.requested', {
      ownerEmail: listing.email,
      requesterEmail: email,
      listingTitle: listing.title,
      price: parseFloat(price),
      listingType: listing.type
    });

    res.status(200).json({ message: 'Bargain request sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting bargain' });
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

    publishMessage('listing.request', {
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

const editListing = async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.headers['x-user-email'];
    const { title, description, price, pricePerHour } = req.body;

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.email !== email) return res.status(403).json({ message: 'Unauthorized' });

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (req.file) updateData.imageUrl = req.file.location;

    const updatedListing = await listingRepo.updateListing(id, updateData);

    if (listing.type === 'SELL' && listing.sellListing && price !== undefined) {
      await listingRepo.updateSellListing(listing.sellListing.id, { 
        price: parseFloat(price)
      });
    }
    if (listing.type === 'RENT' && listing.rentListing && pricePerHour !== undefined) {
      await listingRepo.updateRentListing(listing.rentListing.id, { 
        pricePerHour: parseFloat(pricePerHour)
      });
    }

    await delCache(`listing:${id}`);
    await delCachePattern('listings:all:*');
    await delCache(`listings:my:${email}`);

    res.status(200).json({ message: 'Listing updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating listing' });
  }
};

const submitExchange = async (req, res) => {
  try {
    const fromEmail = req.headers['x-user-email'];
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Missing required fields: title, description' });
    }

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.type !== 'EXCHANGE') {
      return res.status(400).json({ message: 'Exchange requests are only available for EXCHANGE listings' });
    }

    const imageUrl = req.file ? req.file.location : null;

    // Send Kafka notification
    await sendEvent('exchange.received', { 
      fromEmail, 
      toEmail: listing.email, 
      listingTitle: listing.title,
      offerTitle: title,
      offerDescription: description,
      offerImageUrl: imageUrl
    });

    // Send RabbitMQ email
    publishMessage('exchange.requested', {
      ownerEmail: listing.email,
      requesterEmail: fromEmail,
      listingTitle: listing.title,
      offerTitle: title,
      offerDescription: description,
      offerImageUrl: imageUrl
    });

    res.status(200).json({ message: 'Exchange request sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting exchange request' });
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
  deleteListing,
  verifyListingStatus,
  requestListing,
  editListing,
  submitExchange
};
