const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'audio'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.uploadType || 'covers';
    cb(null, path.join(uploadDir, type));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const audioFilter = (req, file, cb) => {
  const allowed = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = { uploadAudio, uploadImage };
