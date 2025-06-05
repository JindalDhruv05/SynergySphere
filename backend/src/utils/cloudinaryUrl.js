import cloudinary from '../services/cloudinary.js';

/**
 * Generate Cloudinary URLs for different purposes
 */
export const generateCloudinaryUrls = (document) => {
  const { publicId, resourceType, format } = document;
  
  if (!publicId || !resourceType) {
    return {
      viewUrl: document.url,
      downloadUrl: document.url
    };
  }

  const baseUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true
  });

  // For view URL - direct access
  const viewUrl = baseUrl;
  
  // For download URL - force attachment download
  const downloadUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    flags: 'attachment'
  });

  return {
    viewUrl,
    downloadUrl
  };
};

/**
 * Get proper display URL based on resource type
 */
export const getDisplayUrl = (document) => {
  const { resourceType, format } = document;
  
  // For images, use the stored URL (optimized)
  if (resourceType === 'image') {
    return document.url;
  }
  
  // For videos, use the stored URL
  if (resourceType === 'video') {
    return document.url;
  }
  
  // For raw files (documents), use the stored URL
  // Cloudinary automatically serves raw files correctly
  return document.url;
};
