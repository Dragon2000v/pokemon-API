import { Router } from "express";
import { Request, Response } from "express";
import { Game } from "../models/Game.js";
import { Pokemon } from "../models/Pokemon.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest } from "../types/index.js";
import { startGame, attack, getGame, surrender } from "../controllers/game.js";

const router = Router();

/**
 * @swagger
 * /api/game/create:
 *   post:
 *     summary: Create a new game
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pokemonId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.post(
  "/create",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pokemonId } = req.body;
      const playerPokemon = await Pokemon.findById(pokemonId).lean();

      if (!playerPokemon) {
        res.status(404).json({ message: "Pokemon not found" });
        return;
      }

      // Find a random opponent pokemon
      const allPokemons = await Pokemon.find({
        _id: { $ne: pokemonId },
      }).lean();

      if (!allPokemons.length) {
        res.status(404).json({ message: "No opponent pokemons found" });
        return;
      }

      const computerPokemon =
        allPokemons[Math.floor(Math.random() * allPokemons.length)];

      if (!playerPokemon.stats || !computerPokemon.stats) {
        res
          .status(500)
          .json({ message: "Invalid pokemon data: missing stats" });
        return;
      }

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
        status: "active",
      });

      await game.populate(["playerPokemon", "computerPokemon"]);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error creating game",
      });
    }
  }
);

/**
 * @swagger
 * /api/game/{id}:
 *   get:
 *     summary: Get game state
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.get(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const game = await Game.findById(req.params.id)
        .populate("playerPokemon")
        .populate("computerPokemon");

      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      if (game.player.toString() !== req.user!._id.toString()) {
        res.status(403).json({ message: "Not authorized to view this game" });
        return;
      }

      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Error fetching game" });
    }
  }
);

/**
 * @swagger
 * /api/game/{id}/attack:
 *   post:
 *     summary: Make an attack in the game
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attack result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.post(
  "/:id/attack",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const game = await Game.findById(req.params.id)
        .populate("playerPokemon")
        .populate("computerPokemon");

      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      if (game.player.toString() !== req.user!._id.toString()) {
        res
          .status(403)
          .json({ message: "Not authorized to perform this action" });
        return;
      }

      if (game.status === "finished") {
        res.status(400).json({ message: "Game is already finished" });
        return;
      }

      if (game.currentTurn !== "player") {
        res.status(400).json({ message: "Not your turn" });
        return;
      }

      // Player attack
      const playerMove = req.body.moveName
        ? game.playerPokemon.moves.find((m) => m.name === req.body.moveName)
        : game.playerPokemon.moves[0];

      if (!playerMove) {
        return res.status(400).json({ message: "Invalid move" });
      }

      const damage = Math.max(
        1,
        game.playerPokemon.stats.attack - game.computerPokemon.stats.defense
      );
      game.computerPokemonCurrentHP = Math.max(
        0,
        game.computerPokemonCurrentHP - damage
      );

      // Add to battle log
      game.battleLog.push({
        turn: game.battleLog.length + 1,
        attacker: "player",
        move: playerMove.name,
        damage,
        timestamp: new Date(),
      });

      // Check if game is finished after player's attack
      if (game.computerPokemonCurrentHP <= 0) {
        game.computerPokemonCurrentHP = 0;
        game.status = "finished";
        game.winner = "player";
        await game.save();
        return res.json(game);
      }

      // Computer attack
      game.currentTurn = "computer";
      const computerMove =
        game.computerPokemon.moves[
          Math.floor(Math.random() * game.computerPokemon.moves.length)
        ];

      const computerDamage = Math.max(
        1,
        game.computerPokemon.stats.attack - game.playerPokemon.stats.defense
      );

      game.playerPokemonCurrentHP = Math.max(
        0,
        game.playerPokemonCurrentHP - computerDamage
      );

      // Add computer attack to battle log
      game.battleLog.push({
        turn: game.battleLog.length + 1,
        attacker: "computer",
        move: computerMove.name,
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
      res.status(500).json({ message: "Error processing attack" });
    }
  }
);

/**
 * @swagger
 * /api/game/active:
 *   get:
 *     summary: Get user's active games
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 */
router.get(
  "/active",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const games = await Game.find({
        "player1.address": req.user?.walletAddress,
        status: "active",
      }).populate("player1.pokemon player2.pokemon");

      res.json(games);
    } catch {
      res.status(500).json({ message: "Error fetching active games" });
    }
  }
);

/**
 * @swagger
 * /api/game/{id}/surrender:
 *   post:
 *     summary: Surrender the game
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.post("/:id/surrender", auth, surrender);

export default router;
