import { Schema, model } from "mongoose";
import { IGame } from "../types/index.js";
import Joi from "joi";
import { Types } from "mongoose";

const gameSchema = new Schema<IGame>(
  {
    player: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    playerPokemon: {
      type: Schema.Types.ObjectId,
      ref: "Pokemon",
      required: true,
    },
    computerPokemon: {
      type: Schema.Types.ObjectId,
      ref: "Pokemon",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "finished"],
      default: "active",
    },
    winner: {
      type: String,
      enum: ["player", "computer"],
    },
    currentTurn: {
      type: String,
      enum: ["player", "computer"],
      required: true,
    },
    battleLog: [
      {
        turn: Number,
        attacker: String,
        damage: Number,
        timestamp: Date,
      },
    ],
    playerPokemonCurrentHP: {
      type: Number,
      required: true,
    },
    computerPokemonCurrentHP: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const gameSchemaJoi = Joi.object({
  player: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required(),
  playerPokemon: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required(),
  computerPokemon: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required(),
  status: Joi.string().valid("active", "finished").default("active"),
  winner: Joi.string().valid("player", "computer").optional(),
  currentTurn: Joi.string().valid("player", "computer").required(),
  battleLog: Joi.array()
    .items(
      Joi.object({
        turn: Joi.number().required(),
        attacker: Joi.string().valid("player", "computer").required(),
        move: Joi.string().optional(),
        damage: Joi.number().required(),
        timestamp: Joi.date().default(Date.now),
      })
    )
    .default([]),
  playerPokemonCurrentHP: Joi.number().required(),
  computerPokemonCurrentHP: Joi.number().required(),
});

export default model<IGame>("Game", gameSchema);
