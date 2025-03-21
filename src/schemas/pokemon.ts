import { Schema, model } from "mongoose";
import { IPokemon } from "../types/index.js";

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
  image: {
    type: String,
    required: true,
  },
});

export default model<IPokemon>("Pokemon", pokemonSchema);
