import { Schema, model } from "mongoose";
import { IPokemon, IMove } from "../types/index.js";

const moveSchema = new Schema<IMove>({
  name: { type: String, required: true },
  power: { type: Number, required: true },
  type: { type: String, required: true },
});

const pokemonSchema = new Schema<IPokemon>({
  name: { type: String, required: true },
  type: [{ type: String, required: true }],
  hp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  speed: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  moves: [moveSchema],
});

export const Pokemon = model<IPokemon>("Pokemon", pokemonSchema);
