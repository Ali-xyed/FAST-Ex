const axios = require('axios');
const { sendEvent } = require('../config/kafka');
const { createClerkClient } = require('@clerk/backend');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const LISTING_SVC = `${process.env.LISTING_SERVICE_URL || 'http://localhost:5004'}/api/listings`;
const USER_SVC = `${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users`;
const AUTH_SVC = `${process.env.AUTH_SERVICE_URL || 'http://localhost:5002'}/api/auth`;

const getClerkFapiUrl = (publishableKey) => {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, '');
  const domain = Buffer.from(encoded, 'base64').toString('utf-8').replace(/\$/, '');
  return `https://${domain}`;
};

const CLERK_FAPI_URL = getClerkFapiUrl(process.env.CLERK_PUBLISHABLE_KEY);

const getAdminHeaders = (req) => ({
  'x-user-email': req.headers['x-user-email'],
  'x-user-role': 'admin'
});

const adminLogin = async (req, res) => {
  try {
    const { email, emailAddress, password } = req.body;
    const targetEmail = email || emailAddress;

    console.log(`[ADMIN LOGIN] Attempt for: ${targetEmail}`);

    if (!targetEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let authLoginResponse;
    try {
      console.log(`[ADMIN LOGIN] Verifying credentials via auth service for: ${targetEmail}`);
      authLoginResponse = await axios.post(`${AUTH_SVC}/login`, {
        email: targetEmail,
        password: password
      });
      
      if (!authLoginResponse.data || !authLoginResponse.data.token) {
        console.log(`[ADMIN LOGIN] Auth service login failed for: ${targetEmail}`);
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
      
      console.log(`[ADMIN LOGIN] Auth service login successful for: ${targetEmail}`);
    } catch (err) {
      console.error(`[ADMIN LOGIN] Auth service error:`, err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Invalid credentials';
      return res.status(400).json({ success: false, message: errorMsg });
    }

    let clerkUser;
    try {
      const users = await clerk.users.getUserList({ emailAddress: [targetEmail] });
      clerkUser = users.data?.[0];

      if (!clerkUser) {
        console.log(`[ADMIN LOGIN] User not found in Clerk: ${targetEmail}`);
        return res.status(500).json({ success: false, message: 'Authentication service error' });
      }

      console.log(`[ADMIN LOGIN] Clerk user found: ${targetEmail}`);
      
      const userRole = clerkUser.publicMetadata?.role;
      console.log(`[ADMIN LOGIN] User role from Clerk: ${userRole}`);

      if (userRole !== 'admin') {
        console.log(`[ADMIN LOGIN] User is not admin: ${targetEmail}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
    } catch (err) {
      console.error(`[ADMIN LOGIN] Clerk error for ${targetEmail}:`, err);
      return res.status(500).json({ success: false, message: 'Authentication service error' });
    }

    console.log(`[ADMIN LOGIN] Success for: ${targetEmail}, role: admin`);
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token: authLoginResponse.data.token,
      user: {
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('[ADMIN LOGIN] Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleUserBan = async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`[ADMIN] Toggling ban for user: ${email}`);

    console.log(`[ADMIN] Calling auth service to toggle ban`);
    const authRes = await axios.patch(
      `${AUTH_SVC}/toggle-ban`, 
      { email }, 
      { headers: getAdminHeaders(req) }
    );
    const isBan = authRes.data.isBan;
    console.log(`[ADMIN] Auth service response - isBan: ${isBan}`);

    try {
      console.log(`[ADMIN] Calling user service to update ban status`);
      await axios.patch(
        `${USER_SVC}/${email}/ban`, 
        { isBan }, 
        { headers: getAdminHeaders(req) }
      );
      console.log(`[ADMIN] User service updated successfully`);
    } catch (userErr) {
      console.error(`[ADMIN] User Service update failed for ${email}:`, userErr.response?.data || userErr.message);
    }

    console.log(`[ADMIN] Ban toggle completed for ${email}`);
    res.status(200).json({
      message: `User ${email} ${isBan ? 'banned' : 'unbanned'} successfully`,
      isBan
    });
  } catch (error) {
    console.error(`[ADMIN] Error toggling ban for ${req.params.email}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Server error toggling user ban',
      error: error.message
    });
  }
};

const verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    console.log(`[Admin Service] ${action === 'reject' ? 'Rejecting' : 'Approving'} listing ${id}`);

    const listingRes = await axios.get(
      `${LISTING_SVC}/${id}`, 
      { headers: getAdminHeaders(req) }
    );
    const listingEmail = listingRes.data.email;

    if (!listingEmail) {
      console.error(`[Admin Service] Listing ${id} has no email field`);
      return res.status(400).json({ message: 'Listing invalid: missing email' });
    }

    if (action === 'reject') {
      // Delete the listing and decrease reputation by 5
      await axios.delete(`${LISTING_SVC}/${id}`, { headers: getAdminHeaders(req) });
      await sendEvent('reputation.updated', { email: listingEmail, change: -5 });
      console.log(`[Admin Service] Listing ${id} rejected, reputation -5 for ${listingEmail}`);
      return res.status(200).json({ message: 'Listing rejected and deleted successfully' });
    } else {
      // Approve the listing and increase reputation by 1
      await axios.patch(
        `${LISTING_SVC}/${id}/verify`, 
        { isVerified: true }, 
        { headers: getAdminHeaders(req) }
      );
      await sendEvent('reputation.updated', { email: listingEmail, change: 1 });
      console.log(`[Admin Service] Listing ${id} approved, reputation +1 for ${listingEmail}`);
      return res.status(200).json({ message: 'Listing approved successfully' });
    }
  } catch (error) {
    console.error(`[Admin Service] Error processing listing:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Error processing listing',
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

const verifyComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    console.log(`[Admin Service] ${action === 'reject' ? 'Rejecting' : 'Approving'} comment ${commentId}`);

    // First get the comment to find the user email
    const listingsRes = await axios.get(`${LISTING_SVC}/admin/all`, { 
      headers: getAdminHeaders(req)
    });
    
    let commentEmail = null;
    let listingId = null;
    
    for (const listing of listingsRes.data) {
      if (listing.comments && listing.comments.length > 0) {
        const comment = listing.comments.find(c => c.id === commentId);
        if (comment) {
          commentEmail = comment.fromEmail;
          listingId = listing.id;
          break;
        }
      }
    }

    if (!commentEmail) {
      console.error(`[Admin Service] Comment ${commentId} not found or has no email`);
      return res.status(400).json({ message: 'Comment not found or invalid' });
    }

    if (action === 'reject') {
      // Delete the comment and decrease reputation by 10
      await axios.delete(
        `${LISTING_SVC}/${listingId}/comments/${commentId}`, 
        { headers: getAdminHeaders(req) }
      );
      await sendEvent('reputation.updated', { email: commentEmail, change: -10 });
      console.log(`[Admin Service] Comment ${commentId} rejected, reputation -10 for ${commentEmail}`);
      return res.status(200).json({ message: 'Comment rejected and deleted successfully' });
    } else {
      // Approve the comment and increase reputation by 1
      await axios.patch(
        `${LISTING_SVC}/comments/${commentId}/verify`, 
        { isVerified: true }, 
        { headers: getAdminHeaders(req) }
      );
      await sendEvent('reputation.updated', { email: commentEmail, change: 1 });
      console.log(`[Admin Service] Comment ${commentId} approved, reputation +1 for ${commentEmail}`);
      return res.status(200).json({ message: 'Comment approved successfully' });
    }
  } catch (error) {
    console.error(`[Admin Service] Error processing comment:`, error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Error processing comment',
      error: error.message 
    });
  }
};

const getAllListings = async (req, res) => {
  try {
    const response = await axios.get(`${LISTING_SVC}/admin/all`, { 
      headers: getAdminHeaders(req),
      params: req.query
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('[Admin Service] Error fetching all listings:', error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Error fetching listings', 
      error: error.message 
    });
  }
};

module.exports = { adminLogin, toggleUserBan, verifyListing, deleteListing, deleteComment, getAllUsers, verifyComment, getAllListings };
