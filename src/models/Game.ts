import mongoose, { Schema } from "mongoose";
import { IGame } from "../types/game.js";

const GameSchema = new Schema<IGame>(
  {
    player1: {
      address: { type: String, required: true },
      pokemon: { type: Schema.Types.ObjectId, ref: "Pokemon", required: true },
      currentHp: { type: Number, required: true },
    },
    player2: {
      address: { type: String, required: true },
      pokemon: { type: Schema.Types.ObjectId, ref: "Pokemon" },
      currentHp: { type: Number },
    },
    status: {
      type: String,
      enum: ["pending", "active", "finished"],
      default: "pending",
    },
    winner: {
      type: String,
      enum: ["player", "computer"],
    },
    currentTurn: {
      type: String,
      enum: ["player", "computer"],
    },
    battleLog: [
      {
        turn: { type: Number, required: true },
        attacker: {
          type: String,
          enum: ["player", "computer"],
          required: true,
        },
        move: { type: String, required: true },
        damage: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
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
    playerPokemonCurrentHP: { type: Number, required: true },
    computerPokemonCurrentHP: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export const Game = mongoose.model<IGame>("Game", GameSchema);
