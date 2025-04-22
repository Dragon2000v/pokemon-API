import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./socket/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pokemon")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
