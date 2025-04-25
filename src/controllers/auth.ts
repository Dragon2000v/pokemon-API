import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Web3 from "web3";
import User from "../schemas/user.js";
import crypto from "crypto";

const web3 = new Web3();

interface NonceRequest extends Request {
  body: {
    walletAddress: string;
  };
}

interface VerifyRequest extends Request {
  body: {
    walletAddress: string;
    signature: string;
  };
}

export const getNonce = async (req: NonceRequest, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    let user = await User.findOne({ walletAddress });
    const nonce = crypto.randomBytes(32).toString("hex");

    if (!user) {
      user = await User.create({ walletAddress, nonce });
    } else {
      user.nonce = nonce;
      await user.save();
    }

    res.json({ nonce });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};

export const verifySignature = async (req: VerifyRequest, res: Response) => {
  try {
    const { walletAddress, signature } = req.body;

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const message = `Sign this message to verify your identity. Nonce: ${user.nonce}`;
    const recoveredAddress = web3.eth.accounts.recover(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const token = jwt.sign(
      { userId: user._id, walletAddress },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // Generate new nonce for next login
    user.nonce = crypto.randomBytes(32).toString("hex");
    await user.save();

    res.json({ token });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  }
};
