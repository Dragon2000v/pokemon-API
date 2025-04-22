import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { Game } from "../models/Game.js";
import { calculateMoveDamage, getAIAction } from "../helpers/ai.js";
import { Pokemon } from "../models/Pokemon.js";

export const initSocket = (httpServer: HttpServer) => {
  console.log("Initializing WebSocket server...");

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on(
      "createGame",
      async (
        { pokemonId, isAI }: { pokemonId: string; isAI: boolean },
        callback: (response: { gameId: string } | { error: string }) => void
      ) => {
        console.log("Received createGame request:", { pokemonId, isAI });

        try {
          console.log("Looking for player pokemon:", pokemonId);
          const playerPokemon = await Pokemon.findById(pokemonId);
          if (!playerPokemon) {
            console.log("Player pokemon not found");
            callback({ error: "Pokemon not found" });
            return;
          }

          let computerPokemon;
          if (isAI) {
            console.log("Looking for computer pokemon...");
            const allPokemons = await Pokemon.find();
            computerPokemon =
              allPokemons[Math.floor(Math.random() * allPokemons.length)];
            console.log("Selected computer pokemon:", computerPokemon._id);
          } else {
            callback({ error: "PvP mode not implemented yet" });
            return;
          }

          console.log("Creating game...");
          const game = await Game.create({
            player: socket.id,
            playerPokemon: playerPokemon._id,
            computerPokemon: computerPokemon._id,
            currentTurn: "player",
            playerPokemonCurrentHP: playerPokemon.stats.hp,
            computerPokemonCurrentHP: computerPokemon.stats.hp,
            battleLog: [],
            status: "active",
          });

          console.log("Game created:", game._id);
          await game.populate(["playerPokemon", "computerPokemon"]);
          console.log("Game populated with pokemon data");

          callback({ gameId: game._id.toString() });
        } catch (err) {
          console.error("Error in createGame:", err);
          callback({ error: "Failed to create game" });
        }
      }
    );

    socket.on("joinGame", async (gameId: string) => {
      try {
        const game = await Game.findById(gameId).populate([
          "playerPokemon",
          "computerPokemon",
        ]);

        if (!game) {
          socket.emit("error", "Game not found");
          return;
        }

        socket.join(gameId);
        socket.emit("gameState", game);
      } catch (err) {
        console.error("Error joining game:", err);
        socket.emit("error", "Failed to join game");
      }
    });

    socket.on(
      "attack",
      async ({ gameId, moveName }: { gameId: string; moveName: string }) => {
        try {
          const game = await Game.findById(gameId).populate([
            "playerPokemon",
            "computerPokemon",
          ]);

          if (!game) {
            socket.emit("error", "Game not found");
            return;
          }

          if (game.status === "finished") {
            socket.emit("error", "Game is already finished");
            return;
          }

          if (game.currentTurn !== "player") {
            socket.emit("error", "Not your turn");
            return;
          }

          // Player attack
          const playerMove = (game.playerPokemon as any).moves.find(
            (m: any) => m.name === moveName
          );

          if (!playerMove) {
            socket.emit("error", "Invalid move");
            return;
          }

          const playerDamage = calculateMoveDamage(
            playerMove,
            game.playerPokemon as any,
            game.computerPokemon as any
          );

          game.computerPokemonCurrentHP = Math.max(
            0,
            game.computerPokemonCurrentHP - playerDamage
          );
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
            io.to(gameId).emit("gameState", game);
            return;
          }

          // Computer attack
          game.currentTurn = "computer";
          const aiMove = getAIAction(
            game,
            game.playerPokemon as any,
            game.computerPokemon as any
          );
          const computerDamage = calculateMoveDamage(
            aiMove,
            game.computerPokemon as any,
            game.playerPokemon as any
          );

          game.playerPokemonCurrentHP = Math.max(
            0,
            game.playerPokemonCurrentHP - computerDamage
          );
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
          io.to(gameId).emit("gameState", game);
        } catch (err) {
          console.error("Error processing attack:", err);
          socket.emit("error", "Failed to process attack");
        }
      }
    );

    socket.on("surrender", async (gameId: string) => {
      try {
        const game = await Game.findById(gameId).populate([
          "playerPokemon",
          "computerPokemon",
        ]);

        if (!game) {
          socket.emit("error", "Game not found");
          return;
        }

        if (game.status === "finished") {
          socket.emit("error", "Game is already finished");
          return;
        }

        game.status = "finished";
        game.winner = "computer";
        game.battleLog.push({
          turn: game.battleLog.length + 1,
          attacker: "player",
          move: "surrender",
          damage: 0,
          timestamp: new Date(),
        });

        await game.save();
        io.to(gameId).emit("gameState", game);
      } catch (err) {
        console.error("Error surrendering:", err);
        socket.emit("error", "Failed to surrender");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
