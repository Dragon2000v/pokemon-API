import { Request } from "express";

export interface AuthUser {
  _id: string;
  walletAddress: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
