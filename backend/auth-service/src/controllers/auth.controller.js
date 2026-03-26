const bcrypt = require('bcryptjs');
const { createClerkClient } = require('@clerk/backend');
const { publishMessage } = require('../config/rabbitmq');
const { sendEvent } = require('../config/kafka');
const authRepo = require('../repositories/auth.repository');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const getClerkFapiUrl = (publishableKey) => {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, '');
  const domain = Buffer.from(encoded, 'base64').toString('utf-8').replace(/\$$/, '');
  return `https://${domain}`;
};

const CLERK_FAPI_URL = getClerkFapiUrl(process.env.CLERK_PUBLISHABLE_KEY);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
  try {
    const { email, name, rollNo, password } = req.body;

    const existing = await authRepo.findUserByEmailOrRoll(email, rollNo);
    if (existing) {
      if (existing.isVerified) return res.status(400).json({ message: 'Email or Roll Number already registered and verified' });
    } else {
      const hashed = await bcrypt.hash(password, 10);
      await authRepo.createUser({ email, name, rollNo, password: hashed });

      try {
        await clerk.users.createUser({
          emailAddress: [email],
          password: password,
          firstName: name.split(' ')[0] || 'User',
          lastName: name.split(' ').slice(1).join(' ') || '',
          publicMetadata: { rollNo, role: 'STUDENT' }
        });
      } catch (clerkErr) {
      }
    }

    const otp = generateOTP();
    await authRepo.createOTP({ email, code: otp });
    publishMessage('email.otp', { email, otp });

    res.status(200).json({ message: 'Registration initiated. OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    const otpRecord = await authRepo.findLatestOTP(email, code);
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });

    const user = await authRepo.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await authRepo.deleteOTPs(email);
    await authRepo.verifyUser(email);

    await sendEvent('user.registered', { email: user.email, name: user.name, rollNo: user.rollNo });

    res.status(200).json({ message: 'Account verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, emailAddress, password } = req.body;
    const targetEmail = email || emailAddress;

    if (!targetEmail) return res.status(400).json({ message: 'Email is required' });

    const user = await authRepo.findUserByEmail(targetEmail);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });
    if (user.isBan) return res.status(403).json({ message: 'Your account has been banned' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid credentials' });

    let clerkUser;
    try {
      const users = await clerk.users.getUserList({ emailAddress: [targetEmail] });
      clerkUser = users.data?.[0];

      if (!clerkUser) {
        clerkUser = await clerk.users.createUser({
          emailAddress: [targetEmail],
          password: password,
          firstName: user.name.split(' ')[0] || 'User',
          publicMetadata: { rollNo: user.rollNo, role: 'STUDENT' }
        });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Authentication service error' });
    }

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUser.id
    });
    const signInResponse = await fetch(`${CLERK_FAPI_URL}/v1/client/sign_ins?_clerk_js_version=5`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        strategy: 'ticket',
        ticket: signInToken.token
      })
    });

    const signInData = await signInResponse.json();

    if (signInData.errors) {
      return res.status(500).json({ message: 'Session creation failed' });
    }

    const createdSessionId = signInData.response?.created_session_id;

    if (!createdSessionId) {
      return res.status(500).json({ message: 'Session ID not found' });
    }

    try {
      const tokenResponse = await clerk.sessions.getToken(createdSessionId);
      const sessionToken = tokenResponse?.jwt;
      console.log(`[AUTH] Clerk session created for ${targetEmail} (session: ${createdSessionId})`);

      if (!sessionToken) {
        return res.status(500).json({ message: 'Token generation failed from session' });
      }

      const { password: _, ...safeUser } = user;

      res.status(200).json({
        message: 'Login successful',
        token: sessionToken,
        user: {
          ...safeUser,
          imageUrl: safeUser.imageUrl || null
        }
      });
    } catch (tokenErr) {
      console.error('Error fetching token:', tokenErr);
      return res.status(500).json({ message: 'Failed to fetch session token' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await authRepo.findUserByEmail(email);
    res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await authRepo.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    await authRepo.updatePassword(email, hashed);

    try {
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      const clerkUser = users.data?.[0];
      if (clerkUser) {
        await clerk.users.updateUser(clerkUser.id, { password });
      }
    } catch (err) {
      console.error('Clerk password sync error:', err.message);
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const promote = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const users = await clerk.users.getUserList({ emailAddress: [email] });
    const clerkUser = users.data?.[0];

    if (!clerkUser) return res.status(404).json({ message: 'User not found in Clerk' });

    await clerk.users.updateUser(clerkUser.id, {
      publicMetadata: { role: 'admin' }
    });

    res.status(200).json({ message: `User ${email} promoted to Admin successfully` });
  } catch (error) {
    console.error('Promote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getToken = async (req, res) => {
  try {
    const { email, emailAddress, password } = req.body;
    const targetEmail = email || emailAddress;

    if (!targetEmail) return res.status(400).json({ message: 'Email is required' });

    const user = await authRepo.findUserByEmail(targetEmail);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });
    if (user.isBan) return res.status(403).json({ message: 'Your account has been banned' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid credentials' });

    let clerkUser;
    try {
      const users = await clerk.users.getUserList({ emailAddress: [targetEmail] });
      clerkUser = users.data?.[0];

      if (!clerkUser) {
        clerkUser = await clerk.users.createUser({
          emailAddress: [targetEmail],
          password: password,
          firstName: user.name.split(' ')[0] || 'User',
          publicMetadata: { rollNo: user.rollNo, role: 'STUDENT' }
        });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Authentication service error' });
    }

    const signInToken = await clerk.signInTokens.createSignInToken({ userId: clerkUser.id });
    const signInResponse = await fetch(`${CLERK_FAPI_URL}/v1/client/sign_ins?_clerk_js_version=5`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ strategy: 'ticket', ticket: signInToken.token })
    });

    const signInData = await signInResponse.json();
    const createdSessionId = signInData.response?.created_session_id;

    if (!createdSessionId) {
      return res.status(500).json({ message: 'Session ID not found' });
    }

    const tokenResponse = await clerk.sessions.getToken(createdSessionId);
    const sessionToken = tokenResponse?.jwt;

    if (!sessionToken) {
      return res.status(500).json({ message: 'Token generation failed' });
    }

    res.status(200).json({ token: sessionToken });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBan = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await authRepo.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newBanStatus = !user.isBan;
    await authRepo.updateUserBanStatus(email, newBanStatus);

    res.status(200).json({ message: `User ${email} ${newBanStatus ? 'banned' : 'unbanned'} successfully`, isBan: newBanStatus });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, verifyOTP, login, checkEmail, changePassword, promote, getToken, toggleBan };
