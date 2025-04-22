import { Schema, model } from "mongoose";
import { IGame, IBattleLogEntry } from "../types/index.js";

const battleLogSchema = new Schema<IBattleLogEntry>({
  turn: { type: Number, required: true },
  attacker: { type: String, enum: ["player", "computer"], required: true },
  move: { type: String, required: true },
  damage: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const gameSchema = new Schema<IGame>(
  {
    player: { type: String, required: true },
    playerPokemon: {
      type: Schema.Types.ObjectId,
      ref: "Pokemon",
      required: true,
    },
    computerPokemon: {
      type: Schema.Types.ObjectId,
      ref: "Pokemon",
      required: true,
    },
    status: { type: String, enum: ["active", "finished"], default: "active" },
    winner: { type: String, enum: ["player", "computer"] },
    currentTurn: {
      type: String,
      enum: ["player", "computer"],
      default: "player",
    },
    battleLog: [battleLogSchema],
    playerPokemonCurrentHP: { type: Number, required: true },
    computerPokemonCurrentHP: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export const Game = model<IGame>("Game", gameSchema);
