const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/upload — authenticated users can upload an image
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  // Build public URL — use BACKEND_URL env var in production (behind proxy)
  const base = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url, filename: req.file.filename });
});

module.exports = router;
