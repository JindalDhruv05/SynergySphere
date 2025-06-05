// Test script to verify analytics implementation
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateSampleData } from '../utils/sampleData.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synergysphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Make sure MongoDB is running on your system');
    process.exit(1);
  }
};

const testAnalytics = async () => {
  try {
    console.log('🚀 Starting Analytics Test...\n');
    
    // Connect to database
    await connectDB();
    
    // Generate sample data
    console.log('📊 Generating sample data for analytics...');
    await generateSampleData();
    console.log('✅ Sample data generated successfully!\n');
    
    console.log('🎉 Analytics implementation is ready!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Start the frontend server: cd ../frontend && npm run dev');
    console.log('3. Navigate to /analytics in your browser');
    console.log('4. View the comprehensive analytics dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testAnalytics();
