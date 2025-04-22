import { Request } from "express";
import { Types } from "mongoose";

export interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    walletAddress: string;
  };
}

export interface IMove {
  name: string;
  type: string;
  power: number;
  accuracy: number;
}

export interface IStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface IPokemon {
  _id: Types.ObjectId;
  name: string;
  type: string;
  stats: IStats;
  moves: IMove[];
}

export interface IBattleLogEntry {
  turn: number;
  attacker: "player" | "computer";
  move: string;
  damage: number;
  timestamp: Date;
}

export interface IGame {
  _id: Types.ObjectId;
  player: string;
  playerPokemon: Types.ObjectId | IPokemon;
  computerPokemon: Types.ObjectId | IPokemon;
  status: "active" | "finished";
  winner?: "player" | "computer";
  currentTurn: "player" | "computer";
  battleLog: IBattleLogEntry[];
  playerPokemonCurrentHP: number;
  computerPokemonCurrentHP: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  walletAddress: string;
  nonce: string;
  pokemons?: Types.ObjectId[];
  games?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
