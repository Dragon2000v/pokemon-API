import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { Pokemon } from "../models/Pokemon";
import { IBattleLogEntry } from "../types/game";
import { calculateMoveDamage, getAIAction } from "../helpers/ai";

const GAME_TIMEOUT = 300000; // 5 minutes in milliseconds

export const setupGameSocket = (io: Server, socket: Socket) => {
  let gameTimeout: NodeJS.Timeout;

  const clearGameTimeout = () => {
    if (gameTimeout) {
      clearTimeout(gameTimeout);
    }
  };

  const setGameTimeout = (gameId: string) => {
    clearGameTimeout();
    gameTimeout = setTimeout(async () => {
      const game = await Game.findById(gameId);
      if (game && game.status === "active") {
        game.status = "finished";
        game.winner = "computer"; // Player loses on timeout
        await game.save();
        io.to(gameId).emit("gameState", game);
        io.to(gameId).emit("game:timeout");
      }
    }, GAME_TIMEOUT);
  };

  socket.on(
    "createGame",
    async (data: { pokemonId: string; isAI: boolean }, callback) => {
      try {
        if (!socket.data?.user?.walletAddress) {
          console.error("No wallet address in socket data");
          callback({ error: "Authentication required" });
          return;
        }

        if (!data.pokemonId) {
          console.error("No pokemonId provided");
          callback({ error: "Pokemon ID is required" });
          return;
        }

        const playerPokemon = await Pokemon.findById(data.pokemonId);
        if (!playerPokemon) {
          console.error(`Pokemon not found with ID: ${data.pokemonId}`);
          callback({ error: "Pokemon not found" });
          return;
        }

        const allPokemons = await Pokemon.find({
          _id: { $ne: data.pokemonId },
        });
        if (!allPokemons.length) {
          console.error("No opponent pokemons found");
          callback({ error: "No opponent pokemons found" });
          return;
        }

        console.log("Creating game for user:", socket.data.user.walletAddress);
        console.log("Selected pokemon:", playerPokemon.name);

        const cpuPokemon =
          allPokemons[Math.floor(Math.random() * allPokemons.length)];

        const playerSpeed = playerPokemon.stats.speed;
        const cpuSpeed = cpuPokemon.stats.speed;
        const firstTurn = playerSpeed >= cpuSpeed ? "player" : "computer";

        const game = new Game({
          player1: {
            address: socket.data.user.walletAddress,
            pokemon: playerPokemon._id,
            currentHp: playerPokemon.stats.hp,
          },
          player2: {
            address: "CPU",
            pokemon: cpuPokemon._id,
            currentHp: cpuPokemon.stats.hp,
          },
          status: "active",
          currentTurn: firstTurn,
          battleLog: [],
          playerPokemon: playerPokemon._id,
          computerPokemon: cpuPokemon._id,
          playerPokemonCurrentHP: playerPokemon.stats.hp,
          computerPokemonCurrentHP: cpuPokemon.stats.hp,
        });

        await game.save();
        console.log("Game created with ID:", game._id);

        const populatedGame = await game.populate([
          { path: "player1.pokemon" },
          { path: "player2.pokemon" },
          { path: "playerPokemon" },
          { path: "computerPokemon" },
        ]);

        if (firstTurn === "computer") {
          const aiMove = getAIAction(populatedGame, playerPokemon, cpuPokemon);
          const damage = calculateMoveDamage(aiMove, cpuPokemon, playerPokemon);

          populatedGame.playerPokemonCurrentHP = Math.max(
            0,
            populatedGame.playerPokemonCurrentHP - damage
          );

          populatedGame.battleLog.push({
            turn: 1,
            attacker: "computer",
            move: aiMove.name,
            damage,
            timestamp: new Date(),
          });

          if (populatedGame.playerPokemonCurrentHP <= 0) {
            populatedGame.status = "finished";
            populatedGame.winner = "computer";
          } else {
            populatedGame.currentTurn = "player";
          }

          await populatedGame.save();
          console.log("Computer made first move");
        }

        socket.join(populatedGame._id.toString());
        setGameTimeout(populatedGame._id.toString());

        console.log("Sending game state to client");
        callback({ gameId: populatedGame._id.toString() });
        io.to(populatedGame._id.toString()).emit("gameState", populatedGame);
      } catch (error) {
        console.error("Error creating game:", error);
        callback({
          error:
            error instanceof Error ? error.message : "Failed to create game",
        });
      }
    }
  );

  socket.on("game:join", async (gameId: string) => {
    try {
      if (!gameId) {
        socket.emit("error", "Game ID is required");
        return;
      }

      const game = await Game.findById(gameId)
        .populate("player1.pokemon")
        .populate("player2.pokemon")
        .populate("playerPokemon")
        .populate("computerPokemon");

      if (!game) {
        socket.emit("error", "Game not found");
        return;
      }

      socket.join(gameId);
      setGameTimeout(gameId);
      socket.emit("gameState", game);
    } catch (error) {
      socket.emit("error", "Failed to join game");
    }
  });

  socket.on(
    "game:move",
    async (data: { gameId: string; move: string; damage: number }) => {
      try {
        const { gameId, move, damage } = data;

        if (!gameId || !move || typeof damage !== "number") {
          socket.emit("error", "Invalid move data");
          return;
        }

        const game = await Game.findById(gameId);

        if (!game) {
          socket.emit("error", "Game not found");
          return;
        }

        if (game.status !== "active") {
          socket.emit("error", "Game is not active");
          return;
        }

        if (game.currentTurn !== "player") {
          socket.emit("error", "Not your turn");
          return;
        }

        game.computerPokemonCurrentHP = Math.max(
          0,
          game.computerPokemonCurrentHP - damage
        );

        const battleLogEntry: IBattleLogEntry = {
          turn: (game.battleLog?.length || 0) + 1,
          attacker: "player",
          move,
          damage,
          timestamp: new Date(),
        };
        game.battleLog.push(battleLogEntry);

        if (game.computerPokemonCurrentHP <= 0) {
          game.status = "finished";
          game.winner = "player";
          clearGameTimeout();
        } else {
          game.currentTurn = "computer";

          // Computer's turn
          const playerPokemon = await Pokemon.findById(game.playerPokemon);
          const computerPokemon = await Pokemon.findById(game.computerPokemon);

          if (playerPokemon && computerPokemon) {
            const aiMove = getAIAction(game, computerPokemon, playerPokemon);
            const aiDamage = calculateMoveDamage(
              aiMove,
              computerPokemon,
              playerPokemon
            );

            game.playerPokemonCurrentHP = Math.max(
              0,
              game.playerPokemonCurrentHP - aiDamage
            );

            game.battleLog.push({
              turn: game.battleLog.length + 1,
              attacker: "computer",
              move: aiMove.name,
              damage: aiDamage,
              timestamp: new Date(),
            });

            if (game.playerPokemonCurrentHP <= 0) {
              game.status = "finished";
              game.winner = "computer";
              clearGameTimeout();
            } else {
              game.currentTurn = "player";
              setGameTimeout(gameId);
            }
          }
        }

        await game.save();
        io.to(gameId).emit("gameState", game);
      } catch (error) {
        console.error("Error making move:", error);
        socket.emit("error", "Failed to make move");
      }
    }
  );

  socket.on("disconnect", () => {
    clearGameTimeout();
  });
};
