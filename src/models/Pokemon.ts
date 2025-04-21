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
  name: { type: String, required: true },
  type: { type: String, required: true },
  level: { type: Number, required: true },
  moves: [moveSchema],
  stats: statsSchema,
  imageUrl: { type: String, required: true },
});

export const Pokemon = model<IPokemon>("Pokemon", pokemonSchema);
