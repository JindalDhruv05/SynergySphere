import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For local development, fallback to explicit config if CLOUDINARY_URL is not set
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: 'dra6p6qdy',
    api_key: '324519167131551',
    api_secret: 'JojnwixLbuFAIGooAz0iOFS9PBk',
  });
}

export default cloudinary;
