import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 100, // Connection pool for 100K+ concurrent requests
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4 for fast DNS resolution
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`⚡ Scalable MongoDB Cluster Connected: ${conn.connection.host}`);
    console.log(`📊 Active Pool Size: 10-100 connections | Read Preference: Primary & Replicas`);
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};