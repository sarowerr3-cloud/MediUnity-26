import mongoose from "mongoose";

/**
 * Resilient Database Connection
 * Retries MongoDB Atlas Cloud & Local connections gracefully without breaking SRV DNS resolution.
 */
export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = "mongodb://127.0.0.1:27017/MEDICARE_CUMILLA";

  const options = {
    maxPoolSize: 50,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let isConnected = false;

  // Try Primary URI (Atlas Cloud)
  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, options);
      console.log(`⚡ Primary MongoDB Atlas Connected: ${conn.connection.host}`);
      isConnected = true;
    } catch (primaryError) {
      console.warn(`⚠️ MongoDB Atlas Connection Failed: ${primaryError.message}`);
    }
  }

  // Fallback to Local MongoDB if Atlas fails
  if (!isConnected) {
    console.log(`🔄 Attempting Local MongoDB Connection (${fallbackUri})...`);
    try {
      const fallbackConn = await mongoose.connect(fallbackUri, options);
      console.log(`✅ Local MongoDB Connected: ${fallbackConn.connection.host}`);
      isConnected = true;
    } catch (fallbackError) {
      console.error(`❌ Local MongoDB Failed: ${fallbackError.message}`);
    }
  }

  // Automatic Reconnection loop if not connected
  if (!isConnected) {
    console.log("⏳ Will retry connecting to MongoDB in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected. Attempting reconnection...");
  setTimeout(connectDB, 5000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
});