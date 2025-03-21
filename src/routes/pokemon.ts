import { Router } from "express";
import { Response } from "express";
import { Pokemon } from "../models/Pokemon.js";
import { auth } from "../middlewares/auth.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

/**
 * @swagger
 * /api/pokemon:
 *   get:
 *     summary: Получить список всех покемонов
 *     description: Возвращает список всех доступных покемонов с их характеристиками
 *     tags: [Pokemon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список покемонов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pokemon'
 *             example:
 *               - _id: "507f1f77bcf86cd799439011"
 *                 name: "Pikachu"
 *                 type: ["Electric"]
 *                 hp: 100
 *                 attack: 55
 *                 defense: 40
 *                 speed: 90
 *                 imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Authentication required"
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Error fetching pokemons"
 */
router.get(
  "/",
  auth,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const pokemons = await Pokemon.find();
      res.json(pokemons);
    } catch {
      res.status(500).json({ message: "Error fetching pokemons" });
    }
  }
);

/**
 * @swagger
 * /api/pokemon/{id}:
 *   get:
 *     summary: Получить покемона по ID
 *     description: Возвращает детальную информацию о конкретном покемоне
 *     tags: [Pokemon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ID покемона
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Покемон успешно найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *             example:
 *               _id: "507f1f77bcf86cd799439011"
 *               name: "Pikachu"
 *               type: ["Electric"]
 *               hp: 100
 *               attack: 55
 *               defense: 40
 *               speed: 90
 *               imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Authentication required"
 *       404:
 *         description: Покемон не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Pokemon not found"
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Error fetching pokemon"
 */
router.get(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const pokemon = await Pokemon.findById(req.params.id);
      if (!pokemon) {
        res.status(404).json({ message: "Pokemon not found" });
        return;
      }
      res.json(pokemon);
    } catch {
      res.status(500).json({ message: "Error fetching pokemon" });
    }
  }
);

export default router;
