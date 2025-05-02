import { Router } from "express";
import { Response } from "express";
import { Game } from "../models/Game.js";
import { Pokemon } from "../models/Pokemon.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest } from "../types/auth.js";
import { Types } from "mongoose";
import { createGame, getGame, makeMove } from "../controllers/game.js";
import { IGame } from "../types/game.js";

const router = Router();

/**
 * @swagger
 * /api/game/create:
 *   post:
 *     summary: Create a new game
 *     description: Creates a new game session with selected pokemon
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
 *                 description: Selected pokemon ID
 *               mode:
 *                 type: string
 *                 enum: [pvp, pve]
 *                 description: Game mode (PvP or PvE)
 *     responses:
 *       201:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.post("/create", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { pokemonId } = req.body;

    // Находим покемона игрока
    const pokemon = await Pokemon.findById(pokemonId);
    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    // Создаем игру
    const game = new Game({
      player1: {
        address: req.user.walletAddress,
        pokemon: new Types.ObjectId(pokemonId),
        currentHp: pokemon.stats.hp,
      },
      player2: {
        address: "CPU",
        pokemon: null,
        currentHp: 0,
      },
      status: "pending",
    });

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Failed to create game" });
  }
});

/**
 * @swagger
 * /api/game/{id}/move:
 *   post:
 *     summary: Make a move in the game
 *     description: Execute a move in an active game
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Game ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moveType:
 *                 type: string
 *                 enum: [attack, ability, item]
 *               moveId:
 *                 type: string
 *                 description: ID of the selected move/ability/item
 *     responses:
 *       200:
 *         description: Move executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Game not found
 *       400:
 *         description: Invalid move
 */
router.post("/:id/move", auth, makeMove);

/**
 * @swagger
 * /api/game/{id}:
 *   get:
 *     summary: Get game details
 *     description: Get current game state and details
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Game ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Game not found
 */
router.get("/:id", auth, getGame);

/**
 * @swagger
 * /api/game/active:
 *   get:
 *     summary: Get user's active games
 *     description: Get list of user's currently active games
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized
 */
router.get("/active", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const games = (await Game.find({
      $or: [
        { "player1.address": req.user.walletAddress },
        { "player2.address": req.user.walletAddress },
      ],
      status: "active",
    })) as IGame[];
    res.json(games);
  } catch (error) {
    console.error("Error fetching active games:", error);
    res.status(500).json({ message: "Error fetching active games" });
  }
});

router.post("/", auth, createGame);

export default router;
