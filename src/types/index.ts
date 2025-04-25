import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IPokemon extends Document {
  name: string;
  type: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  imageUrl: string;
  abilities: Array<{
    name: string;
    description: string;
    power: number;
  }>;
}

export interface IUser extends Document {
  walletAddress: string;
  nonce: string;
  inventory: Types.ObjectId[];
  statistics: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    walletAddress: string;
  };
}

export interface IGame extends Document {
  player1: {
    address: string;
    pokemon: Types.ObjectId;
    currentHp: number;
  };
  player2: {
    address: string;
    pokemon: Types.ObjectId;
    currentHp: number;
  };
  currentTurn: string;
  status: "waiting" | "active" | "finished";
  winner?: string;
  moves: Array<{
    player: string;
    move: string;
    damage: number;
    timestamp: Date;
  }>;
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
  id: number;
  name: string;
  types: string[];
  stats: IStats;
  moves: IMove[];
  level: number;
  imageUrl: string;
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
