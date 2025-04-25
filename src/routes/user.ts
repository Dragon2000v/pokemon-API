import { Router } from "express";
import { Response } from "express";
import { User } from "../models/User.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest, IUser } from "../types/index.js";

const router = Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile and statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = (await User.findOne({
      walletAddress: req.user.walletAddress,
    })) as IUser | null;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

/**
 * @swagger
 * /api/user/inventory:
 *   get:
 *     summary: Get user's pokemon inventory
 *     description: Get list of pokemon owned by the user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pokemon'
 *       401:
 *         description: Unauthorized
 */
router.get("/inventory", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = (await User.findOne({
      walletAddress: req.user.walletAddress,
    }).populate("inventory")) as IUser | null;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Error fetching inventory" });
  }
});

/**
 * @swagger
 * /api/user/statistics:
 *   get:
 *     summary: Get user's game statistics
 *     description: Get detailed statistics of user's game performance
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gamesPlayed:
 *                   type: number
 *                 gamesWon:
 *                   type: number
 *                 gamesLost:
 *                   type: number
 *                 winRate:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/statistics", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.walletAddress) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = (await User.findOne({
      walletAddress: req.user.walletAddress,
    })) as IUser | null;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

export default router;
