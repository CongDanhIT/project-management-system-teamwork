import multer from 'multer';

// Sử dụng Memory Storage để không lưu file vào ổ cứng server mà gửi thẳng qua Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Giới hạn 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên tệp hình ảnh!'));
    }
  },
});

export default upload;
