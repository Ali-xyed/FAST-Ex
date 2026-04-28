const upload = require('../config/s3');

const uploadSingleImage = (fieldName = 'imageUrl') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message 
        });
      }
      next();
    });
  };
};

module.exports = { uploadSingleImage };
