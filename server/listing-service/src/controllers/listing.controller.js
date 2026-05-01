const listingRepo = require('../repositories/listing.repository');
const { sendEvent } = require('../config/kafka');
const { getIo } = require('../socket');
const { publishMessage } = require('../config/rabbitmq');
const redis = require('../config/redis');
const axios = require('axios');

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

    const { type, title, description, price, pricePerHour, withTitle, withDescription, isBargaining } = req.body;
    
    if (!type || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields: type, title, description' });
    }

    const imageUrl = req.file ? req.file.location : null;

    const listing = await listingRepo.createListing({ 
      email, 
      type, 
      title, 
      description, 
      imageUrl
    });

    if (type === 'SELL' && price) {
      await listingRepo.createSellListing({ 
        listingId: listing.id, 
        price: parseFloat(price),
        isBargaining: isBargaining === 'true' || isBargaining === true
      });
    }
    if (type === 'RENT' && pricePerHour) {
      await listingRepo.createRentListing({ 
        listingId: listing.id, 
        pricePerHour: parseFloat(pricePerHour),
        isBargaining: isBargaining === 'true' || isBargaining === true
      });
    }
    if (type === 'EXCHANGE') {
      await listingRepo.createExchangeListing({ 
        listingId: listing.id,
        withTitle: withTitle || '',
        withDescription: withDescription || ''
      });
    }

    await delCachePattern('listings:all:*');
    await delCache(`listings:my:${email}`);

    res.status(201).json({ message: "Item has been posted!", listing: { id: listing.id } });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ message: 'Server error creating listing', error: err.message });
  }
};

const getListings = async (req, res) => {
  try {
    const { type, search } = req.query;
    const userEmail = req.headers['x-user-email'];
    const cacheKey = `listings:all:${type || ''}:${search || ''}`;

    const cached = await getFromCache(cacheKey);
    if (cached) {
      const filtered = cached.filter(listing => 
        listing.isVerified || listing.email === userEmail
      );
      return res.status(200).json(filtered);
    }

    const where = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const listings = await listingRepo.findAllListings({
      where,
      include: { 
        sellListing: true, 
        rentListing: true, 
        exchangeListing: true,
        comments: { 
          where: { isVerified: true },
          orderBy: { createdAt: 'desc' } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
    
    const filtered = listingsWithProfiles.filter(listing => 
      listing.isVerified || listing.email === userEmail
    );
    
    res.status(200).json(filtered);
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
    const userEmail = req.headers['x-user-email'];
    const cacheKey = `listing:${id}:${userEmail || 'guest'}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.email !== userEmail) {
      listing.comments = listing.comments.filter(comment => comment.isVerified);
    }

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
    
    const ownerEmail = listing.email;
    if (ownerEmail) {
      console.log(`Sending comment.posted event for listing ${id}, owner: ${ownerEmail}`);
      await sendEvent('comment.posted', { 
        listingId: id, 
        fromEmail: email, 
        ownerEmail, 
        content,
        listingTitle: listing.title 
      });
    } else {
      console.error('Listing owner email is missing for listing:', id, 'Listing data:', JSON.stringify(listing));
    }

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
    
    const comment = await listingRepo.findCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await listingRepo.deleteComment(commentId);

    await delCache(`listing:${id}`);
    await delCachePattern(`listing:${id}:*`);
    await delCachePattern('listings:all:*');

    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
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

    const bargain = await listingRepo.createBargain({
      listingId: id,
      fromEmail: email,
      toEmail: listing.email,
      price: parseFloat(price)
    });

    await sendEvent('bargain.received', { 
      fromEmail: email, 
      toEmail: listing.email, 
      price: parseFloat(price),
      listingTitle: listing.title,
      listingType: listing.type,
      listingId: id,
      bargainId: bargain.id
    });

    publishMessage('bargain.requested', {
      ownerEmail: listing.email,
      requesterEmail: email,
      listingTitle: listing.title,
      price: parseFloat(price),
      listingType: listing.type
    });

    res.status(200).json({ message: 'Bargain request sent successfully', bargainId: bargain.id });
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

    const updateData = { isVerified: false }; 
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

    const exchange = await listingRepo.createExchange({
      listingId: id,
      fromEmail,
      toEmail: listing.email,
      offerTitle: title,
      offerDescription: description,
      offerImageUrl: imageUrl
    });

    await sendEvent('exchange.received', { 
      fromEmail, 
      toEmail: listing.email, 
      listingTitle: listing.title,
      offerTitle: title,
      offerDescription: description,
      offerImageUrl: imageUrl,
      listingId: id,
      exchangeId: exchange.id
    });

    publishMessage('exchange.requested', {
      ownerEmail: listing.email,
      requesterEmail: fromEmail,
      listingTitle: listing.title,
      offerTitle: title,
      offerDescription: description,
      offerImageUrl: imageUrl
    });

    res.status(200).json({ message: 'Exchange request sent successfully', exchangeId: exchange.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting exchange request' });
  }
};

const getBargainDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { listingId } = req.query;

    let bargains;
    if (id) {
      const bargain = await listingRepo.findBargainById(id);
      if (!bargain) return res.status(404).json({ message: 'Bargain not found' });
      bargains = [bargain];
    } else if (listingId) {
      bargains = await listingRepo.findBargainsByListingId(listingId);
    } else {
      return res.status(400).json({ message: 'Either bargain ID or listing ID is required' });
    }

    const bargainsWithDetails = await Promise.all(
      bargains.map(async (bargain) => {
        const listing = await listingRepo.findListingById(bargain.listingId);
        
        let requesterImageUrl = null;
        let requesterName = null;
        try {
          const profileResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users/public/${bargain.fromEmail}`);
          requesterImageUrl = profileResponse.data.imageUrl;
          requesterName = profileResponse.data.name;
        } catch (err) {
          console.error(`Failed to fetch profile for ${bargain.fromEmail}`, err.message);
        }
        
        return {
          ...bargain,
          requesterImageUrl,
          requesterName,
          listing: listing ? {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            imageUrl: listing.imageUrl,
            type: listing.type,
            sellListing: listing.sellListing,
            rentListing: listing.rentListing
          } : null
        };
      })
    );

    res.status(200).json(id ? bargainsWithDetails[0] : bargainsWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching bargain details' });
  }
};

const getExchangeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { listingId } = req.query;

    let exchanges;
    if (id) {
      const exchange = await listingRepo.findExchangeById(id);
      if (!exchange) return res.status(404).json({ message: 'Exchange not found' });
      exchanges = [exchange];
    } else if (listingId) {
      exchanges = await listingRepo.findExchangesByListingId(listingId);
    } else {
      return res.status(400).json({ message: 'Either exchange ID or listing ID is required' });
    }

    const exchangesWithDetails = await Promise.all(
      exchanges.map(async (exchange) => {
        const listing = await listingRepo.findListingById(exchange.listingId);
        
        let requesterImageUrl = null;
        let requesterName = null;
        try {
          const profileResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users/public/${exchange.fromEmail}`);
          requesterImageUrl = profileResponse.data.imageUrl;
          requesterName = profileResponse.data.name;
        } catch (err) {
          console.error(`Failed to fetch profile for ${exchange.fromEmail}`, err.message);
        }
        
        return {
          ...exchange,
          requesterImageUrl,
          requesterName,
          listing: listing ? {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            imageUrl: listing.imageUrl,
            type: listing.type
          } : null
        };
      })
    );

    res.status(200).json(id ? exchangesWithDetails[0] : exchangesWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching exchange details' });
  }
};

const respondBargain = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { bargainId } = req.params;
    const { status } = req.body; 

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be ACCEPTED or DECLINED' });
    }

    const bargain = await listingRepo.findBargainById(bargainId);
    if (!bargain) return res.status(404).json({ message: 'Bargain not found' });

    const listing = await listingRepo.findListingById(bargain.listingId);
    if (!listing || listing.email !== email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await listingRepo.updateBargainStatus(bargainId, status);

    const eventTopic = status === 'ACCEPTED' ? 'bargain.accepted' : 'bargain.declined';
    await sendEvent(eventTopic, {
      bargainId,
      listingId: bargain.listingId,
      fromEmail: bargain.fromEmail,
      toEmail: email,
      listingTitle: listing.title
    });

    if (status === 'ACCEPTED') {
      publishMessage('bargain.accepted', {
        requesterEmail: bargain.fromEmail,
        ownerEmail: email,
        listingTitle: listing.title,
        message: `Your bargain of ${bargain.price} has been accepted!`
      });
    }

    res.json({ message: `Bargain ${status.toLowerCase()}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error responding to bargain' });
  }
};

const respondExchange = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { exchangeId } = req.params;
    const { status } = req.body; 

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be ACCEPTED or DECLINED' });
    }

    const exchange = await listingRepo.findExchangeById(exchangeId);
    if (!exchange) return res.status(404).json({ message: 'Exchange not found' });

    const listing = await listingRepo.findListingById(exchange.listingId);
    if (!listing || listing.email !== email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await listingRepo.updateExchangeStatus(exchangeId, status);

    const eventTopic = status === 'ACCEPTED' ? 'exchange.accepted' : 'exchange.declined';
    await sendEvent(eventTopic, {
      exchangeId,
      listingId: exchange.listingId,
      fromEmail: exchange.fromEmail,
      toEmail: email,
      listingTitle: listing.title
    });

    if (status === 'ACCEPTED') {
      publishMessage('exchange.accepted', {
        requesterEmail: exchange.fromEmail,
        ownerEmail: email,
        listingTitle: listing.title,
        message: `Your exchange request has been accepted!`
      });
    }

    res.json({ message: `Exchange ${status.toLowerCase()}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error responding to exchange' });
  }
};

const updateMarkedStatus = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { id } = req.params;
    const { marked } = req.body;

    const validStatuses = ['PENDING', 'SOLD', 'RENTED', 'EXCHANGED'];
    if (!marked || !validStatuses.includes(marked)) {
      return res.status(400).json({ 
        message: 'Invalid marked status. Must be one of: PENDING, SOLD, RENTED, EXCHANGED' 
      });
    }

    const listing = await listingRepo.findListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.email !== email) {
      return res.status(403).json({ message: 'Unauthorized: You can only update your own listings' });
    }

    await listingRepo.updateListing(id, { marked });

    await delCache(`listing:${id}`);
    await delCachePattern('listings:*');

    res.json({ message: 'Listing marked status updated successfully', marked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating marked status' });
  }
};

const verifyComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isVerified } = req.body;

    const comment = await listingRepo.findCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await listingRepo.updateComment(commentId, { isVerified });

    await delCache(`listing:${comment.listingId}`);
    await delCachePattern(`listing:${comment.listingId}:*`);
    await delCachePattern('listings:all:*');

    res.status(200).json({ message: 'Comment verification status updated', isVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying comment' });
  }
};

const getAllListingsForAdmin = async (req, res) => {
  try {
    const { type, search } = req.query;

    const where = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const listings = await listingRepo.findAllListings({
      where,
      include: { 
        sellListing: true, 
        rentListing: true, 
        exchangeListing: true,
        comments: { 
          orderBy: { createdAt: 'desc' } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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

    res.status(200).json(listingsWithProfiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching listings for admin' });
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
  submitExchange,
  getBargainDetails,
  getExchangeDetails,
  respondBargain,
  respondExchange,
  updateMarkedStatus,
  verifyComment,
  getAllListingsForAdmin
};
