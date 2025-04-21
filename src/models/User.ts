import { Schema, model } from "mongoose";
import { IUser } from "../types/index.js";

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
    pokemons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Pokemon",
      },
    ],
    games: [
      {
        type: Schema.Types.ObjectId,
        ref: "Game",
      },
    ],
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
