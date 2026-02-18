// import mongoose from "mongoose";

// const connectDB = async (MONGO_URI, DB_NAME)=>{
//     try {
//         await mongoose.connect(MONGO_URI + DB_NAME);
//          console.log('Database connected Successfully!!!')
//     } catch (error) {
//         console.log('Database error!!!', error);
//     }
// }

// export default connectDB

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
