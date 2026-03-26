const verifyAuth = (req, res, next) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  next();
};

module.exports = { verifyAuth };
