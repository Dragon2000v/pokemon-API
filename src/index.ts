import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/index.js";
import { specs } from "./config/swagger.js";
import authRouter from "./routes/auth.js";
import pokemonRouter from "./routes/pokemon.js";
import gameRouter from "./routes/game.js";
import userRouter from "./routes/user.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket/index.js";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    exposedHeaders: ["*"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/pokemon", pokemonRouter);
app.use("/api/game", gameRouter);
app.use("/api/user", userRouter);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

// Connect to MongoDB
console.log("Attempting to connect to MongoDB...");
console.log("MongoDB URI:", config.mongodb.uri);

mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    console.log("Connected to MongoDB successfully");

    // Start server
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `API Documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
