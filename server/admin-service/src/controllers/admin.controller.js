const axios = require('axios');

const LISTING_SVC = `${process.env.LISTING_SERVICE_URL || 'http://localhost:5004'}/api/listings`;
const USER_SVC = `${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users`;
const AUTH_SVC = `${process.env.AUTH_SERVICE_URL || 'http://localhost:5002'}/api/auth`;

const getAdminHeaders = (req) => ({
  'x-user-email': req.headers['x-user-email'],
  'x-user-role': 'admin'
});

const toggleUserBan = async (req, res) => {
  try {
    const { email } = req.params;

    const authRes = await axios.patch(
      `${AUTH_SVC}/toggle-ban`, 
      { email }, 
      { headers: getAdminHeaders(req) }
    );
    const isBan = authRes.data.isBan;

    try {
      await axios.patch(
        `${USER_SVC}/${email}/ban`, 
        { isBan }, 
        { headers: getAdminHeaders(req) }
      );
    } catch (userErr) {
      console.warn(`[Admin Service] User Service update failed for ${email}: ${userErr.message}`);
    }

    res.status(200).json({
      message: `User ${email} ${isBan ? 'banned' : 'unbanned'} successfully`,
      isBan
    });
  } catch (error) {
    console.error(`[Admin Service] Error toggling ban for ${req.params.email}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Server error toggling user ban',
      error: error.message
    });
  }
};

const verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Admin Service] Verifying listing ${id}`);

    const listingRes = await axios.get(
      `${LISTING_SVC}/${id}`, 
      { headers: getAdminHeaders(req) }
    );
    const listingEmail = listingRes.data.email;

    if (!listingEmail) {
      console.error(`[Admin Service] Listing ${id} has no email field`);
      return res.status(400).json({ message: 'Listing invalid: missing email' });
    }

    await axios.patch(
      `${LISTING_SVC}/${id}/verify`, 
      { isVerified: true }, 
      { headers: getAdminHeaders(req) }
    );

    await sendEvent('reputation.updated', { email: listingEmail, change: 1 });

    await sendEvent('reputation.updated', { email: listingEmail, change: 1 });

    res.status(200).json({ message: 'Listing verified successfully' });
  } catch (error) {
    console.error(`[Admin Service] Error verifying listing:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Error verifying listing',
      error: error.message
    });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`${LISTING_SVC}/${id}`, { headers: getAdminHeaders(req) });
    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(`[Admin Service] Error deleting listing:`, error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Error deleting listing',
      error: error.message 
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    await axios.delete(
      `${LISTING_SVC}/${id}/comments/${commentId}`, 
      { headers: getAdminHeaders(req) }
    );
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(`[Admin Service] Error deleting comment:`, error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Error deleting comment',
      error: error.message 
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const response = await axios.get(`${USER_SVC}/all`, { headers: getAdminHeaders(req) });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('[Admin Service] Error fetching users:', error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
};

module.exports = { toggleUserBan, verifyListing, deleteListing, deleteComment, getAllUsers };
