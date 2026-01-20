import mongoose from "mongoose";

export const connectMongoDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(process.env.MONGODB_URL);
};
