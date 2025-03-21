import { Schema, model } from "mongoose";
import { IGame } from "../types/index.js";

const gameSchema = new Schema<IGame>(
  {
    player: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    status: {
      type: String,
      enum: ["active", "finished"],
      default: "active",
    },
    winner: {
      type: String,
      enum: ["player", "computer"],
    },
    currentTurn: {
      type: String,
      enum: ["player", "computer"],
      required: true,
    },
    battleLog: [
      {
        turn: Number,
        attacker: String,
        damage: Number,
        timestamp: Date,
      },
    ],
    playerPokemonCurrentHP: {
      type: Number,
      required: true,
    },
    computerPokemonCurrentHP: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IGame>("Game", gameSchema);
