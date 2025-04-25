import { Router } from "express";
import { Response } from "express";
import { Game } from "../models/Game.js";
import { Pokemon } from "../models/Pokemon.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest, IPokemon, IGame } from "../types/index.js";
import { Types } from "mongoose";

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
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { pokemonId, mode } = req.body;

    if (!pokemonId || !mode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pokemon = (await Pokemon.findById(pokemonId)) as IPokemon | null;
    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    // Create CPU pokemon for PvE mode
    const cpuPokemon =
      mode === "pve" ? ((await Pokemon.findOne()) as IPokemon | null) : null;
    if (mode === "pve" && !cpuPokemon) {
      return res.status(500).json({ message: "No CPU pokemon available" });
    }

    const game = new Game({
      player1: {
        address: req.user.walletAddress,
        pokemon: new Types.ObjectId(pokemonId),
        currentHp: pokemon.stats.hp,
      },
      player2: {
        address: mode === "pve" ? "CPU" : "",
        pokemon: mode === "pve" ? cpuPokemon?._id : null,
        currentHp: mode === "pve" ? cpuPokemon?.stats.hp : 0,
      },
      status: mode === "pve" ? "active" : "waiting",
      currentTurn: mode === "pve" ? "computer" : "player",
      moves: [],
    }) as IGame;

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Error creating game" });
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
router.post("/:id/move", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { moveType, moveId } = req.body;
    if (!moveType || !moveId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const game = (await Game.findById(req.params.id)) as IGame | null;
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.currentTurn !== req.user.walletAddress) {
      return res.status(400).json({ message: "Not your turn" });
    }

    // Implement move logic here
    // This is a placeholder for move execution
    game.moves.push({
      player: req.user.walletAddress,
      move: moveId,
      damage: 10,
      timestamp: new Date(),
    });

    // Switch turns
    game.currentTurn =
      game.player1.address === req.user.walletAddress ? "computer" : "player";

    await game.save();
    res.json(game);
  } catch (error) {
    console.error("Error executing move:", error);
    res.status(500).json({ message: "Error executing move" });
  }
});

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
router.get("/:id", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const game = (await Game.findById(req.params.id)) as IGame | null;
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ message: "Error fetching game" });
  }
});

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

export default router;
