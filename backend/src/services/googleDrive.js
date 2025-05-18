import { google } from 'googleapis';
import config from 'config';
import fs from 'fs';

// Create OAuth2 client
const createOAuth2Client = (accessToken, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    config.get('googleDrive.clientId'),
    config.get('googleDrive.clientSecret'),
    config.get('googleDrive.redirectUri')
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  return oauth2Client;
};

// Create Google Drive folder
export const createGoogleDriveFolder = async (folderName, accessToken, refreshToken) => {
  try {
    const auth = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });
    
    return { id: response.data.id, name: folderName };
  } catch (error) {
    console.error(`Error creating Google Drive folder: ${error.message}`);
    throw error;
  }
};

// Upload file to Google Drive
export const uploadFileToDrive = async (file, name, mimeType, folderId, accessToken, refreshToken) => {
  try {
    const auth = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: name || file.originalname,
      ...(folderId && { parents: [folderId] })
    };
    
    const media = {
      mimeType: mimeType || file.mimetype,
      body: fs.createReadStream(file.path)
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink'
    });
    
    // Clean up temporary file
    fs.unlinkSync(file.path);
    
    return response.data;
  } catch (error) {
    console.error(`Error uploading file to Google Drive: ${error.message}`);
    throw error;
  }
};

// Update file in Google Drive
export const updateFileInDrive = async (fileId, updates, accessToken, refreshToken) => {
  try {
    const auth = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.update({
      fileId,
      resource: updates,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink'
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating file in Google Drive: ${error.message}`);
    throw error;
  }
};

// Delete file from Google Drive
export const deleteFileFromDrive = async (fileId, accessToken, refreshToken) => {
  try {
    const auth = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    await drive.files.delete({
      fileId
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting file from Google Drive: ${error.message}`);
    throw error;
  }
};
