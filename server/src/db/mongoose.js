import mongoose from "mongoose";

/**
 * Connects to MongoDB when a URI is provided.
 *
 * @param {string} mongoUri - MongoDB connection string.
 * @returns {Promise<{connected: boolean}>} Connection status object.
 */
async function connectToMongo(mongoUri) {
  if (!mongoUri) {
    console.info(
      "[mongo] MONGO_URI not provided. Running without persistence.",
    );
    return { connected: false };
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.info("[mongo] connected");
    return { connected: true };
  } catch (error) {
    console.warn("[mongo] connection failed. Continuing without persistence.");
    return { connected: false };
  }
}

/**
 * Indicates whether the Mongoose connection is currently open.
 *
 * @returns {boolean} True when connection state is open.
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export { connectToMongo, isMongoConnected };
