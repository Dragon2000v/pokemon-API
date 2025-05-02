import { Document, Types } from "mongoose";
import { IPokemon } from "./pokemon";

export interface IBattleLogEntry {
  turn: number;
  attacker: "player" | "computer";
  move: string;
  damage: number;
  timestamp: Date;
}

export interface IGamePlayer {
  address: string;
  pokemon: Types.ObjectId | IPokemon;
  currentHp: number;
}

export interface IGame extends Document {
  player1: IGamePlayer;
  player2: IGamePlayer;
  status: "pending" | "active" | "finished";
  winner?: "player" | "computer";
  currentTurn?: "player" | "computer";
  battleLog: IBattleLogEntry[];
  playerPokemon: Types.ObjectId | IPokemon;
  computerPokemon: Types.ObjectId | IPokemon;
  playerPokemonCurrentHP: number;
  computerPokemonCurrentHP: number;
  createdAt: Date;
  updatedAt: Date;
}
