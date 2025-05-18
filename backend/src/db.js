import mongoose from 'mongoose';
import config from 'config';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.get('database.uri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
