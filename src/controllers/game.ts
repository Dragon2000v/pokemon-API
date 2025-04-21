import { Response } from "express";
import { AuthRequest, IPokemon } from "../types/index.js";
import { Game } from "../models/Game.js";
import { Pokemon } from "../models/Pokemon.js";
import { calculateMoveDamage, getAIAction } from "../helpers/ai.js";

interface StartGameRequest extends AuthRequest {
  body: {
    pokemonId: string;
  };
}

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
      battleLog: [],
    });

    // If computer goes first, perform its attack
    if (!playerFirst) {
      const aiMove = getAIAction(
        game,
        playerPokemon as IPokemon,
        computerPokemon as IPokemon
      );
      const damage = calculateMoveDamage(
        aiMove,
        computerPokemon as IPokemon,
        playerPokemon as IPokemon
      );
      game.playerPokemonCurrentHP -= damage;
      game.battleLog.push({
        turn: 1,
        attacker: "computer",
        move: aiMove.name,
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

    const populatedGame = await game.populate([
      { path: "playerPokemon" },
      { path: "computerPokemon" },
    ]);

    res.json(populatedGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
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
    res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

export const attack = async (req: AuthRequest, res: Response) => {
  try {
    const game = await Game.findById(req.params.gameId).populate<{
      playerPokemon: IPokemon;
      computerPokemon: IPokemon;
    }>(["playerPokemon", "computerPokemon"]);

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
    const playerMove = req.body.moveName
      ? (game.playerPokemon as IPokemon).moves.find(
          (m) => m.name === req.body.moveName
        )
      : (game.playerPokemon as IPokemon).moves[0];

    if (!playerMove) {
      return res.status(400).json({ message: "Invalid move" });
    }

    const playerDamage = calculateMoveDamage(
      playerMove,
      game.playerPokemon as IPokemon,
      game.computerPokemon as IPokemon
    );

    game.computerPokemonCurrentHP -= playerDamage;
    game.battleLog.push({
      turn: game.battleLog.length + 1,
      attacker: "player",
      move: playerMove.name,
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
    const aiMove = getAIAction(
      game,
      game.playerPokemon as IPokemon,
      game.computerPokemon as IPokemon
    );
    const computerDamage = calculateMoveDamage(
      aiMove,
      game.computerPokemon as IPokemon,
      game.playerPokemon as IPokemon
    );

    game.playerPokemonCurrentHP -= computerDamage;
    game.battleLog.push({
      turn: game.battleLog.length + 1,
      attacker: "computer",
      move: aiMove.name,
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
    console.error("Error processing attack:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

export const surrender = async (req: AuthRequest, res: Response) => {
  try {
    const game = await Game.findById(req.params.gameId).populate<{
      playerPokemon: IPokemon;
      computerPokemon: IPokemon;
    }>(["playerPokemon", "computerPokemon"]);

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

    // Update game state
    game.status = "finished";
    game.winner = "computer";
    game.currentTurn = "computer";
    game.playerPokemonCurrentHP = 0;

    // Add surrender to battle log
    game.battleLog.push({
      turn: game.battleLog.length + 1,
      attacker: "player",
      damage: 0,
      timestamp: new Date(),
      move: "surrender",
    });

    await game.save();
    res.json(game);
  } catch (error) {
    console.error("Error processing surrender:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};
