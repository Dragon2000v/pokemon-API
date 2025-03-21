import { Request } from "express";
import { Types } from "mongoose";

export interface IPokemon {
  _id: Types.ObjectId;
  name: string;
  type: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  imageUrl: string;
}

export interface IUser {
  _id: Types.ObjectId;
  walletAddress: string;
  nonce: string;
}

export interface IGame {
  _id: Types.ObjectId;
  player1: {
    address: string;
    pokemon: IPokemon;
    currentHp: number;
  };
  player2: {
    address: string;
    pokemon: IPokemon;
    currentHp: number;
  };
  currentTurn: string;
  status: "active" | "finished";
  winner?: string;
}

export interface AuthRequest extends Request {
  user?: {
    walletAddress: string;
  };
}
