const axios = require('axios');
const { getChannel } = require('../config/rabbitmq');
const { sendEvent } = require('../config/kafka');

const LISTING_SVC = `${process.env.LISTING_SERVICE_URL || 'http://localhost:5004'}/api/listings`;
const USER_SVC = `${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users`;

const getAdminHeaders = (req) => ({
  'x-user-email': req.headers['x-user-email'] || 'admin@fast.ex',
  'x-user-role': 'admin'
});

const AUTH_SVC = `${process.env.AUTH_SERVICE_URL || 'http://localhost:5002'}/api/auth`;

const toggleUserBan = async (req, res) => {
  try {
    const { email } = req.params;
    const authRes = await axios.patch(`${AUTH_SVC}/toggle-ban`, { email }, { headers: getAdminHeaders(req) });
    const isBan = authRes.data.isBan;

    await axios.patch(`${USER_SVC}/${email}/ban`, { isBan }, { headers: getAdminHeaders(req) });

    if (isBan) {
      const channel = getChannel();
      if (channel) {
        channel.sendToQueue('email.banned', Buffer.from(JSON.stringify({ email })));
      }
      await sendEvent('user.banned', { email });
    }

    res.status(200).json({ message: `User ${email} ban status toggled to ${isBan}`, isBan });
  } catch (error) {
    console.error(`[Admin Service] Error toggling ban for user ${req.params.email}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Server error toggling user ban',
      error: error.message,
      details: error.response?.data
    });
  }
};

const verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Admin Service] Verifying listing ${id}`);

    const listingRes = await axios.get(`${LISTING_SVC}/${id}`, { headers: getAdminHeaders(req) });
    const listingEmail = listingRes.data.email;

    if (!listingEmail) {
      console.error(`[Admin Service] Listing ${id} found but has no email field`, listingRes.data);
      return res.status(400).json({ message: 'Listing invalid: missing email' });
    }

    await axios.patch(`${LISTING_SVC}/${id}/verify`, { isVerified: true }, { headers: getAdminHeaders(req) });

    await sendEvent('reputation.updated', { email: listingEmail, change: 1 });

    res.status(200).json({ message: `Listing ${id} successfully verified, +1 rep awarded to ${listingEmail}` });
  } catch (error) {
    if (error.response) {
      console.error(`[Admin Service] Listing service error [${error.response.status}]:`, error.response.data);
      res.status(error.response.status).json({
        message: 'Error from Listing Service',
        details: error.response.data
      });
    } else {
      console.error(`[Admin Service] Unexpected error verifying listing:`, error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`${LISTING_SVC}/${id}`, { headers: getAdminHeaders(req) });
    res.status(200).json({ message: 'Listing deleted by admin' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    await axios.delete(`${LISTING_SVC}/${id}/comments/${commentId}`, { headers: getAdminHeaders(req) });
    res.status(200).json({ message: 'Comment deleted by admin' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { toggleUserBan, verifyListing, deleteListing, deleteComment };
