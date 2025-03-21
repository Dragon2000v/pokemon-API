import mongoose from "mongoose";
import { env } from "../helpers/env.js";

export const initMongoDBConnection = async (): Promise<void> => {
  try {
    const uri = env("MONGODB_URI");
    await mongoose.connect(uri);
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};
