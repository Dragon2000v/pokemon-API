import { Router } from "express";
import { Request, Response } from "express";
import { Game } from "../models/Game.js";
import { Pokemon } from "../models/Pokemon.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest } from "../types/index.js";

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
      const playerPokemon = await Pokemon.findById(pokemonId);

      if (!playerPokemon) {
        res.status(404).json({ message: "Pokemon not found" });
        return;
      }

      // Find a random opponent pokemon
      const opponentPokemon = await Pokemon.aggregate([
        { $sample: { size: 1 } },
      ]);

      const game = await Game.create({
        player1: {
          address: req.user?.walletAddress,
          pokemon: playerPokemon._id,
          currentHp: playerPokemon.hp,
        },
        player2: {
          address: "CPU",
          pokemon: opponentPokemon[0]._id,
          currentHp: opponentPokemon[0].hp,
        },
        currentTurn: req.user?.walletAddress,
        status: "active",
      });

      await game.populate("player1.pokemon player2.pokemon");
      res.json(game);
    } catch {
      res.status(500).json({ message: "Error creating game" });
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
      const game = await Game.findById(req.params.id).populate(
        "player1.pokemon player2.pokemon"
      );

      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      if (game.player1.address !== req.user?.walletAddress) {
        res.status(403).json({ message: "Not authorized to view this game" });
        return;
      }

      res.json(game);
    } catch {
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
      const game = await Game.findById(req.params.id).populate(
        "player1.pokemon player2.pokemon"
      );

      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      if (game.player1.address !== req.user?.walletAddress) {
        res
          .status(403)
          .json({ message: "Not authorized to perform this action" });
        return;
      }

      if (game.status === "finished") {
        res.status(400).json({ message: "Game is already finished" });
        return;
      }

      if (game.currentTurn !== req.user?.walletAddress) {
        res.status(400).json({ message: "Not your turn" });
        return;
      }

      // Calculate damage
      const player1Pokemon = game.player1.pokemon as any;
      const player2Pokemon = game.player2.pokemon as any;

      const damage = Math.max(
        1,
        player1Pokemon.attack - player2Pokemon.defense
      );
      game.player2.currentHp -= damage;

      // Check if game is finished
      if (game.player2.currentHp <= 0) {
        game.status = "finished";
        game.winner = game.player1.address;
      } else {
        // CPU turn
        const cpuDamage = Math.max(
          1,
          player2Pokemon.attack - player1Pokemon.defense
        );
        game.player1.currentHp -= cpuDamage;

        if (game.player1.currentHp <= 0) {
          game.status = "finished";
          game.winner = game.player2.address;
        }
      }

      // Update turn
      game.currentTurn =
        game.status === "active" ? game.player1.address : undefined;

      await game.save();
      res.json(game);
    } catch {
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

export default router;
