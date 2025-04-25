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
import { initSocket } from "./socket/index.js";

const app = express();

// Middleware
app.use(cors());
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

// Connect to MongoDB
console.log("Attempting to connect to MongoDB...");
console.log("MongoDB URI:", config.mongodb.uri);

mongoose
  .connect(config.mongodb.uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");

    // Create HTTP server and initialize WebSocket
    const httpServer = createServer(app);
    initSocket(httpServer);

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(
        `API Documentation available at http://localhost:${config.port}/api-docs`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
