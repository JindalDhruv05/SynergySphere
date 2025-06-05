# 🌟 SynergySphere – Advanced Team Collaboration Platform

> **A comprehensive, real-time collaboration platform that empowers teams to work smarter, not harder.**

**Team Number - 447**

## 👥 Team Members

**Dhruv Jindal** - 23f2001734@ds.study.iitm.ac.in  
**Devanshu Mangal** - 23f2001952@ds.study.iitm.ac.in

## 🚀 Project Overview

SynergySphere is a next-generation team collaboration platform that revolutionizes how teams organize, communicate, and manage projects. Built with modern web technologies, it combines intelligent project management, real-time communication, advanced analytics, and seamless document collaboration into one unified platform.

This platform goes beyond traditional project management tools by providing:
- **Intelligent Project Insights** with advanced analytics
- **Real-time Collaboration** with instant messaging and live updates
- **Smart Budget Management** with automated expense tracking
- **Integrated Document Management** with Google Drive sync
- **Advanced Notification System** with real-time alerts
- **Comprehensive Task Management** with subtasks and dependencies

## ✨ Core Features

### 🔐 **Authentication & User Management**
- Secure JWT-based authentication with refresh token support
- Password reset with email verification
- User profiles with avatar support
- Role-based access control (Admin, Member, Viewer)

### 📊 **Project Management**
- Create and manage unlimited projects with detailed descriptions
- Project-specific budgets with currency support
- Automated budget threshold alerts
- Project completion tracking with progress analytics
- Google Drive integration for project folder creation
- Project member management with role assignments

### ✅ **Advanced Task Management**
- Hierarchical task structure with subtasks support
- Task assignment with multiple members
- Priority levels and due date tracking
- Task-specific budgets and expense tracking
- Real-time status updates with progress monitoring
- Task comments and threaded discussions
- Drag-and-drop task management interface

### 💬 **Real-time Communication**
- **Project-level chat rooms** for team discussions
- **Task-specific chat channels** for focused collaboration
- **Personal messaging** between team members
- Real-time message delivery with Socket.IO
- Message history and search functionality
- File attachments in conversations
- Read receipts and online status indicators

### 💰 **Budget & Expense Management**
- Project and task-level budget allocation
- Expense tracking with categories and approvals
- Automated budget utilization calculations
- Expense approval workflows
- Real-time budget alerts and notifications
- Financial reporting and analytics

### 📄 **Document Management**
- **Google Drive Integration** for seamless file management
- Project and task-specific document organization
- Document permissions and sharing controls
- Real-time document collaboration
- File upload with cloud storage (Cloudinary)
- Document versioning and access logs

### 🔔 **Smart Notifications**
- Real-time notifications for all platform activities
- Customizable notification preferences
- Email notifications for important events
- In-app notification center with history
- Budget threshold alerts
- Task deadline reminders

### 📈 **Advanced Analytics Dashboard**
- **Productivity Analytics** - Personal and team performance metrics
- **Project Performance** - Timeline adherence and completion rates
- **Resource Utilization** - Budget and time tracking insights
- **Team Performance** - Collaboration and efficiency metrics
- Interactive charts and visualizations using Recharts
- Export analytics data for reporting

### 🎯 **Project Invitations System**
- Send project invitations with custom messages
- Role-based invitation management
- Accept/reject invitation workflows
- Invitation tracking and history
- Bulk invitation capabilities

## 🛠️ Technology Stack

### **Frontend**
- **React 19** - Latest React with modern hooks and features
- **Vite** - Lightning-fast development build tool
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **React Router DOM** - Client-side routing with protected routes
- **React Hook Form** - Efficient form handling with validation
- **Axios** - HTTP client with interceptors and automatic token refresh
- **Socket.IO Client** - Real-time bidirectional communication
- **Recharts** - Responsive charting library for analytics
- **Heroicons** - Beautiful SVG icons
- **Headless UI** - Unstyled, accessible UI components
- **Hello Pangea DnD** - Drag-and-drop functionality
- **Date-fns** - Modern date utility library

### **Backend**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, minimalist web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time event-based communication
- **JWT** - Secure authentication with refresh tokens
- **Bcrypt** - Password hashing and verification
- **Multer** - File upload handling
- **Cloudinary** - Cloud-based image and video management
- **Google APIs** - Google Drive integration
- **Nodemailer** - Email service for notifications
- **Helmet** - Security middleware for Express
- **Compression** - Response compression middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### **Infrastructure & Tools**
- **MongoDB Atlas** - Cloud database hosting
- **Cloudinary** - Media asset management
- **Google Drive API** - Document storage and collaboration
- **JWT Refresh Tokens** - Secure session management
- **Real-time WebSocket connections** - Live updates across the platform

## 📁 Project Structure

```
SynergySphere/
├── backend/                     # Server-side application
│   ├── src/
│   │   ├── controllers/         # Business logic controllers
│   │   │   ├── analytics.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── document.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── user.controller.js
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── project.model.js
│   │   │   ├── task.model.js
│   │   │   ├── user.model.js
│   │   │   ├── chat.model.js
│   │   │   ├── expense.model.js
│   │   │   └── notification.model.js
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Authentication & validation
│   │   ├── services/            # External service integrations
│   │   ├── socket/              # Real-time communication handlers
│   │   └── utils/               # Helper functions
│   └── package.json
├── frontend/                    # Client-side application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application pages/routes
│   │   ├── context/             # React context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service functions
│   │   └── utils/               # Client-side utilities
│   └── package.json
└── README.md
```

## 🔧 Installation and Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**
- **Google Cloud Console** account (for Drive integration)
- **Cloudinary** account (for file uploads)

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email Configuration
EMAIL_FROM=your_email@domain.com
EMAIL_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REDIRECT_URI=your_redirect_uri

# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JindalDhruv05/SynergySphere.git
   cd SynergySphere
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run dev  # Development mode with nodemon
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev  # Starts Vite development server
   ```

4. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api`

## 🎯 Usage Guide

### Getting Started
1. **Register** a new account or **login** with existing credentials
2. **Create your first project** from the Projects dashboard
3. **Invite team members** using the invitation system
4. **Set up project budget** and configure alert thresholds
5. **Create tasks** and assign them to team members
6. **Start collaborating** using real-time chat features

### Key Workflows
- **Project Management**: Create projects → Add members → Set budgets → Track progress
- **Task Management**: Create tasks → Assign members → Set deadlines → Monitor completion
- **Team Communication**: Join project chats → Participate in task discussions → Send direct messages
- **Document Collaboration**: Upload files → Share with team → Manage permissions
- **Budget Tracking**: Add expenses → Track utilization → Monitor alerts → Generate reports

## 📊 Analytics Features

SynergySphere provides comprehensive analytics to help teams optimize their performance:

- **Dashboard Overview**: Quick insights into active projects, pending tasks, and budget status
- **Productivity Metrics**: Individual and team performance tracking
- **Project Analytics**: Timeline adherence, completion rates, and resource utilization
- **Financial Analytics**: Budget utilization, expense patterns, and cost optimization insights
- **Team Performance**: Collaboration metrics and efficiency indicators

## 🔒 Security Features

- **JWT Authentication** with secure refresh token implementation
- **Password encryption** using bcrypt with salt rounds
- **Role-based access control** for projects and tasks
- **Input validation** and sanitization on all endpoints
- **CORS protection** with configurable origins
- **Helmet.js** for setting secure HTTP headers
- **Rate limiting** to prevent abuse

## 🌐 Real-time Features

Powered by Socket.IO for instant collaboration:
- **Live chat messaging** across projects and tasks
- **Real-time notifications** for all platform activities
- **Instant status updates** for tasks and projects
- **Live user presence** indicators
- **Automatic reconnection** for reliable connectivity

## 🚀 Deployment

### Production Deployment
The application is configured for production deployment with:
- Environment-specific configurations
- Optimized build processes
- Static file serving
- Error handling and logging
- Scalable architecture design

### Docker Support
Container-ready with proper environment configuration for easy deployment to cloud platforms.

## 📈 Performance Optimizations

- **Vite** for lightning-fast development builds
- **Code splitting** and lazy loading for optimal bundle sizes
- **MongoDB indexing** for efficient database queries
- **Socket.IO** connection pooling and optimization
- **Cloudinary** CDN for fast image delivery
- **Compression middleware** for reduced payload sizes

## 🤝 Contributing

We welcome contributions to SynergySphere! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all existing tests pass

## 📞 Contact & Support

For questions, suggestions, or support:

**Dhruv Jindal** - [23f2001734@ds.study.iitm.ac.in](mailto:23f2001734@ds.study.iitm.ac.in)  
**Devanshu Mangal** - [23f2001952@ds.study.iitm.ac.in](mailto:23f2001952@ds.study.iitm.ac.in)

---

## 🎥 Demo Resources

### Application Workflow Demonstration
[Watch Demo Video](https://drive.google.com/drive/folders/19I27dfQSX2I6pFKZqWU7Yor1ipj6vuBS?usp=sharing)

### Project Model Documentation
[View Project Model](https://drive.google.com/file/d/12GsguShJRnECkie86X3QF2R__VzzXeRu/view?usp=sharing)

---

<p align="center">
  <strong>Built with ❤️ by the SynergySphere Team</strong><br>
  <em>Empowering teams to achieve more together</em>
</p>
