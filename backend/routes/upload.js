const express = require('express');
const router = express.Router();
const { menuItemUpload, logoUpload } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/menu-item', menuItemUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path, publicId: req.file.filename });
});

router.post('/logo', logoUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path, publicId: req.file.filename });
});

module.exports = router;
