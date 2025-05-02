import { Document, Types } from "mongoose";

export interface IPokemonStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface IPokemon extends Document {
  name: string;
  type: string[];
  stats: IPokemonStats;
  moves: string[];
  image: string;
  owner?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
