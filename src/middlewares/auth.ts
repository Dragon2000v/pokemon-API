import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { AuthRequest } from "../types/index.js";

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      walletAddress: string;
    };
    req.user = { walletAddress: decoded.walletAddress };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
