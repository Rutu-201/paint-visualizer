const multer = require('multer'), path = require('path'), crypto = require('crypto');
module.exports = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (q, f, cb) => cb(null, crypto.randomUUID() + (f.mimetype === 'image/png' ? '.png' : '.jpg'))
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (q, f, cb) => /^image\/(jpeg|png)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG images are allowed'))
});
