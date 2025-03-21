import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/index.js";
import { specs } from "./config/swagger.js";
import authRouter from "./routes/auth.js";
import gameRouter from "./routes/game.js";
import pokemonRouter from "./routes/pokemon.js";

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/game", gameRouter);
app.use("/api/pokemon", pokemonRouter);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Connect to MongoDB
mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    app.listen(config.port, () => {
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
