import mongoose from "mongoose";

const connectDB = async (MONGO_URI) => {
  try {
    const connection = await mongoose.connect(MONGO_URI);

    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection; // ✅ IMPORTANT
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    throw error; // ✅ IMPORTANT
  }
};

export default connectDB;
