import { Schema, model } from "mongoose";
import { IGame } from "../types/index.js";

const gameSchema = new Schema<IGame>({
  player1: {
    address: { type: String, required: true },
    pokemon: { type: Schema.Types.ObjectId, ref: "Pokemon", required: true },
    currentHp: { type: Number, required: true },
  },
  player2: {
    address: { type: String, required: true },
    pokemon: { type: Schema.Types.ObjectId, ref: "Pokemon", required: true },
    currentHp: { type: Number, required: true },
  },
  currentTurn: { type: String, required: true },
  status: { type: String, enum: ["active", "finished"], default: "active" },
  winner: { type: String },
});

export const Game = model<IGame>("Game", gameSchema);
