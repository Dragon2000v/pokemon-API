import { Request } from "express";
import { Document, Types } from "mongoose";

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

export interface IPokemon extends Document {
  id: number;
  name: string;
  types: string[];
  level: number;
  moves: IMove[];
  stats: IStats;
  imageUrl: string;
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

export interface IBattleLogEntry {
  turn: number;
  attacker: "player" | "computer";
  move: string;
  damage: number;
  timestamp: Date;
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
  status: "waiting" | "active" | "finished";
  winner?: "player" | "computer";
  currentTurn: "player" | "computer";
  moves: Array<{
    player: string;
    move: string;
    damage: number;
    timestamp: Date;
  }>;
  battleLog: IBattleLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}
