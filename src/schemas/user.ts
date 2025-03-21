import { Schema, model } from "mongoose";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
