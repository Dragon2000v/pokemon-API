import { Server } from "socket.io";
import { setupGameSocket } from "./game.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const setupSocket = (io: Server) => {
  // Добавляем middleware для аутентификации
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      socket.data.user = decoded;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    console.log("User data:", socket.data.user);

    setupGameSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
