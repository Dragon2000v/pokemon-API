import { Response } from "express";
import Game from "../schemas/game.js";
import Pokemon from "../schemas/pokemon.js";
import { AuthRequest, IPokemon } from "../types/index.js";

interface StartGameRequest extends AuthRequest {
  body: {
    pokemonId: string;
  };
}

const calculateDamage = (attacker: IPokemon, defender: IPokemon): number => {
  const level = attacker.level;
  const power = 50; // Base power for basic attack
  const attack = attacker.stats.attack;
  const defense = defender.stats.defense;
  const randomFactor = Math.random();

  if (randomFactor === 0) {
    return 0; // Miss
  }

  const damage = Math.floor(
    ((((2 * level) / 5 + 2) * power * (attack / defense)) / 50 + 2) *
      randomFactor
  );

  return damage;
};

export const startGame = async (req: StartGameRequest, res: Response) => {
  try {
    const { pokemonId } = req.body;
    const playerPokemon = await Pokemon.findById(pokemonId);

    if (!playerPokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    // Select random computer pokemon
    const allPokemons = await Pokemon.find({ _id: { $ne: pokemonId } });
    const computerPokemon =
      allPokemons[Math.floor(Math.random() * allPokemons.length)];

    // Determine who goes first based on speed
    const playerFirst =
      playerPokemon.stats.speed >= computerPokemon.stats.speed;

    const game = await Game.create({
      player: req.user!._id,
      playerPokemon: playerPokemon._id,
      computerPokemon: computerPokemon._id,
      currentTurn: playerFirst ? "player" : "computer",
      playerPokemonCurrentHP: playerPokemon.stats.hp,
      computerPokemonCurrentHP: computerPokemon.stats.hp,
    });

    // If computer goes first, perform its attack
    if (!playerFirst) {
      const damage = calculateDamage(computerPokemon, playerPokemon);
      game.playerPokemonCurrentHP -= damage;
      game.battleLog.push({
        turn: 1,
        attacker: "computer",
        damage,
        timestamp: new Date(),
      });

      if (game.playerPokemonCurrentHP <= 0) {
        game.playerPokemonCurrentHP = 0;
        game.status = "finished";
        game.winner = "computer";
      } else {
        game.currentTurn = "player";
      }

      await game.save();
    }

    res.json({ gameId: game._id });
  } catch (error) {
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

export const getGameState = async (req: AuthRequest, res: Response) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate("playerPokemon")
      .populate("computerPokemon");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.player.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this game" });
    }

    res.json(game);
  } catch (error) {
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

export const attack = async (req: AuthRequest, res: Response) => {
  try {
    const game = await Game.findById(req.params.gameId).populate<{
      playerPokemon: IPokemon;
      computerPokemon: IPokemon;
    }>("playerPokemon computerPokemon");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.player.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to perform this action" });
    }

    if (game.status === "finished") {
      return res.status(400).json({ message: "Game is already finished" });
    }

    if (game.currentTurn !== "player") {
      return res.status(400).json({ message: "Not your turn" });
    }

    // Player attack
    const playerDamage = calculateDamage(
      game.playerPokemon,
      game.computerPokemon
    );
    game.computerPokemonCurrentHP -= playerDamage;
    game.battleLog.push({
      turn: game.battleLog.length + 1,
      attacker: "player",
      damage: playerDamage,
      timestamp: new Date(),
    });

    if (game.computerPokemonCurrentHP <= 0) {
      game.computerPokemonCurrentHP = 0;
      game.status = "finished";
      game.winner = "player";
      await game.save();
      return res.json(game);
    }

    // Computer attack
    game.currentTurn = "computer";
    const computerDamage = calculateDamage(
      game.computerPokemon,
      game.playerPokemon
    );
    game.playerPokemonCurrentHP -= computerDamage;
    game.battleLog.push({
      turn: game.battleLog.length + 1,
      attacker: "computer",
      damage: computerDamage,
      timestamp: new Date(),
    });

    if (game.playerPokemonCurrentHP <= 0) {
      game.playerPokemonCurrentHP = 0;
      game.status = "finished";
      game.winner = "computer";
    } else {
      game.currentTurn = "player";
    }

    await game.save();
    res.json(game);
  } catch (error) {
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};
