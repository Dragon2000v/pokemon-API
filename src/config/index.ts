import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-key",
    expiresIn: "7d",
  },
} as const;
