import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME?.replace(/^"|"$/g, '') || '', // Thêm xử lý xóa ngoặc kép dư thừa
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
