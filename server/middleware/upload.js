const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage — images persist across deploys (no ephemeral disk)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventhub',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Only allow raster image files. SVG is intentionally excluded because it can
// contain JavaScript (stored XSS risk when served from the same origin).
const fileFilter = (req, file, cb) => {
  const allowed = /^(jpeg|jpg|png|gif|webp)$/;
  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  const mime = (file.mimetype || '').split('/')[1];

  if (allowed.test(ext) && allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
