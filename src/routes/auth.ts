import { Router } from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { utils } from "ethers";

const router = Router();

/**
 * @swagger
 * /api/auth/nonce:
 *   post:
 *     summary: Get nonce for wallet signature
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nonce generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *       400:
 *         description: Invalid request
 */
router.post("/nonce", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    console.log("Nonce request for wallet:", walletAddress);

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const nonce = Math.floor(Math.random() * 1000000).toString();
    await User.findOneAndUpdate(
      { walletAddress },
      { walletAddress, nonce },
      { upsert: true }
    );

    console.log("Generated nonce:", nonce);
    res.json({ nonce });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ message: "Error generating nonce" });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify wallet signature
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signature verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid signature
 */
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    console.log("Verify request:", { walletAddress, signature });

    if (!walletAddress || !signature) {
      return res
        .status(400)
        .json({ message: "Wallet address and signature are required" });
    }

    const user = await User.findOne({ walletAddress });
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const message = `Authenticate for Pokemon Game with nonce: ${user.nonce}`;
    console.log("Message to verify:", message);

    const msgHash = utils.hashMessage(message);
    const msgHashBytes = utils.arrayify(msgHash);
    const recoveredAddress = utils.recoverAddress(msgHashBytes, signature);

    console.log("Recovered address:", recoveredAddress);
    console.log("Original address:", walletAddress);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log("Signature verification failed");
      return res.status(401).json({ message: "Invalid signature" });
    }

    const token = jwt.sign({ walletAddress }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    console.log("Authentication successful");
    res.json({ token });
  } catch (error) {
    console.error("Error verifying signature:", error);
    res.status(500).json({ message: "Error verifying signature" });
  }
});

export default router;
