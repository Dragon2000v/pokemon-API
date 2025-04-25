import { Schema, model } from "mongoose";
import { IPokemon, IMove, IStats } from "../types/index.js";

const moveSchema = new Schema<IMove>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  power: { type: Number, required: true },
  accuracy: { type: Number, required: true },
});

const statsSchema = new Schema<IStats>({
  hp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  speed: { type: Number, required: true },
});

const pokemonSchema = new Schema<IPokemon>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  types: [{ type: String, required: true }],
  level: { type: Number, required: true },
  moves: {
    type: [moveSchema],
    required: true,
    validate: {
      validator: function (moves: IMove[]) {
        return Array.isArray(moves) && moves.length > 0;
      },
      message: "Pokemon must have at least one move",
    },
  },
  stats: {
    type: statsSchema,
    required: true,
    validate: {
      validator: function (stats: IStats) {
        return stats && stats.hp > 0 && stats.speed > 0;
      },
      message: "Pokemon must have valid stats",
    },
  },
  imageUrl: { type: String, required: true },
});

// Add middleware to validate Pokemon data before saving
pokemonSchema.pre("save", function (next) {
  if (!this.moves || this.moves.length === 0) {
    next(new Error("Pokemon must have at least one move"));
    return;
  }
  if (!this.stats || !this.stats.speed || !this.stats.hp) {
    next(new Error("Pokemon must have valid stats"));
    return;
  }
  next();
});

export const Pokemon = model<IPokemon>("Pokemon", pokemonSchema);
