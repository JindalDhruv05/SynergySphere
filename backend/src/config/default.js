export default {
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/synergysphere'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
    accessTokenExpiry: '1h',
    refreshTokenExpiry: '7d'
  },
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@synergysphere.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};
