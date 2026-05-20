const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/upload — authenticated users can upload an image
// Cloudinary stores the file and returns a permanent CDN URL
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  // multer-storage-cloudinary puts the Cloudinary URL in req.file.path
  const url = req.file.path;
  res.status(201).json({ success: true, url, filename: req.file.filename });
});

module.exports = router;
