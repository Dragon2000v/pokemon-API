import { Schema, model } from "mongoose";
import { IPokemon, IMove } from "../types/index.js";

const moveSchema = new Schema<IMove>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  power: { type: Number, required: true },
  accuracy: { type: Number, required: true },
});

const pokemonSchema = new Schema<IPokemon>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  types: [
    {
      type: String,
      required: true,
    },
  ],
  stats: {
    hp: {
      type: Number,
      required: true,
    },
    attack: {
      type: Number,
      required: true,
    },
    defense: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      required: true,
    },
  },
  level: {
    type: Number,
    default: 50,
  },
  imageUrl: {
    type: String,
    required: true,
  },
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
});

export default model<IPokemon>("Pokemon", pokemonSchema);
