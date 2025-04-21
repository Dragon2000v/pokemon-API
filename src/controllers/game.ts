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

    // Get full player Pokemon data with moves and stats
    const playerPokemon = await Pokemon.findById(pokemonId);
    if (!playerPokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    // Get full computer Pokemon data
    const allPokemons = await Pokemon.find({ _id: { $ne: pokemonId } });
    if (!allPokemons.length) {
      return res.status(404).json({ message: "No opponent pokemons found" });
    }

    // Get random computer Pokemon and fetch its full data
    const randomPokemonId =
      allPokemons[Math.floor(Math.random() * allPokemons.length)]._id;
    const computerPokemon = await Pokemon.findById(randomPokemonId);

    if (!computerPokemon) {
      return res
        .status(404)
        .json({ message: "Failed to load computer Pokemon" });
    }

    // Validate Pokemon data and speeds
    if (!playerPokemon.stats?.speed || !computerPokemon.stats?.speed) {
      console.error("Invalid speed values:", {
        playerSpeed: playerPokemon.stats?.speed,
        computerSpeed: computerPokemon.stats?.speed,
      });
      return res.status(500).json({ message: "Invalid pokemon speed data" });
    }

    // Determine who goes first based on speed
    const playerSpeed = Number(playerPokemon.stats.speed);
    const computerSpeed = Number(computerPokemon.stats.speed);

    if (isNaN(playerSpeed) || isNaN(computerSpeed)) {
      console.error("Speed values are not numbers:", {
        playerSpeed,
        computerSpeed,
      });
      return res.status(500).json({ message: "Invalid speed values" });
    }

    const playerFirst = playerSpeed >= computerSpeed;

    console.log("Speed comparison details:", {
      playerName: playerPokemon.name,
      playerSpeed,
      playerSpeedType: typeof playerSpeed,
      computerName: computerPokemon.name,
      computerSpeed,
      computerSpeedType: typeof computerSpeed,
      playerFirst,
      comparison: `${playerSpeed} >= ${computerSpeed} = ${playerFirst}`,
    });

    // Create initial game state
    let game = await Game.create({
      player: req.user!._id,
      playerPokemon: playerPokemon._id,
      computerPokemon: computerPokemon._id,
      currentTurn: playerFirst ? "player" : "computer",
      playerPokemonCurrentHP: playerPokemon.stats.hp,
      computerPokemonCurrentHP: computerPokemon.stats.hp,
      battleLog: [],
      status: "active",
    });

    // Populate the game data immediately after creation
    game = await game.populate(["playerPokemon", "computerPokemon"]);

    console.log("Initial game state:", {
      id: game._id,
      currentTurn: game.currentTurn,
      playerFirst,
      playerHP: game.playerPokemonCurrentHP,
      computerHP: game.computerPokemonCurrentHP,
    });

    // If computer goes first, perform its attack immediately
    if (!playerFirst) {
      console.log("Computer goes first, preparing attack...");

      // Validate populated data
      if (!game.computerPokemon || !game.playerPokemon) {
        console.error("Missing Pokemon data after populate:", {
          computerPokemon: game.computerPokemon,
          playerPokemon: game.playerPokemon,
        });
        return res.status(500).json({ message: "Failed to load Pokemon data" });
      }

      // Select and perform computer's move
      const aiMove = getAIAction(
        game,
        game.playerPokemon,
        game.computerPokemon
      );

      if (!aiMove) {
        console.error("Failed to get AI move");
        return res.status(500).json({ message: "Failed to get AI move" });
      }

      console.log("Selected AI move:", aiMove);

      const damage = calculateMoveDamage(
        aiMove,
        game.computerPokemon,
        game.playerPokemon
      );

      console.log("Attack details:", {
        move: aiMove.name,
        damage,
        currentHP: game.playerPokemonCurrentHP,
        newHP: game.playerPokemonCurrentHP - damage,
      });

      game.playerPokemonCurrentHP = Math.max(
        0,
        game.playerPokemonCurrentHP - damage
      );
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

      // Re-populate and validate final state
      game = await game.populate(["playerPokemon", "computerPokemon"]);

      console.log("Final game state after computer's turn:", {
        currentTurn: game.currentTurn,
        playerHP: game.playerPokemonCurrentHP,
        battleLog: game.battleLog,
        status: game.status,
        winner: game.winner,
      });
    }

    res.json(game);
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Error starting game",
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
