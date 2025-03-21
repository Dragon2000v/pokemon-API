import { Schema, model } from "mongoose";
import { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>({
  walletAddress: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
});

export const User = model<IUser>("User", userSchema);
