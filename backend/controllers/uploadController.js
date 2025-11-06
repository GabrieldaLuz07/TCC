import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const uploadMiddleware = multer({ storage: storage });

const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({ imageUrl: imageUrl });
};

export {
  uploadMiddleware,
  uploadImage
};