import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pokemon Game API",
      version: "1.0.0",
      description:
        "Pokemon Game API with Web3 Authentication and Battle System",
      contact: {
        name: "API Support",
        email: "support@pokemongame.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication via Web3 (Ethereum wallet)",
      },
      {
        name: "Pokemon",
        description: "Pokemon management operations",
      },
      {
        name: "Game",
        description: "Game process management and battles",
      },
      {
        name: "User",
        description: "User profile and statistics management",
      },
    ],
    components: {
      schemas: {
        Pokemon: {
          type: "object",
          required: [
            "name",
            "type",
            "hp",
            "attack",
            "defense",
            "speed",
            "imageUrl",
          ],
          properties: {
            _id: {
              type: "string",
              description: "Unique pokemon identifier",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              description: "Pokemon name",
              example: "Pikachu",
            },
            type: {
              type: "array",
              items: { type: "string" },
              description: "Pokemon types",
              example: ["Electric"],
            },
            hp: {
              type: "number",
              description: "Health points",
              example: 100,
            },
            attack: {
              type: "number",
              description: "Attack power",
              example: 55,
            },
            defense: {
              type: "number",
              description: "Defense points",
              example: 40,
            },
            speed: {
              type: "number",
              description: "Speed points",
              example: 90,
            },
            imageUrl: {
              type: "string",
              description: "Pokemon image URL",
              example:
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
            },
            abilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Ability name",
                  },
                  description: {
                    type: "string",
                    description: "Ability description",
                  },
                  power: {
                    type: "number",
                    description: "Ability power",
                  },
                },
              },
              description: "Pokemon abilities",
            },
          },
        },
        Game: {
          type: "object",
          required: ["player1", "player2", "currentTurn", "status"],
          properties: {
            _id: {
              type: "string",
              description: "Unique game identifier",
              example: "507f1f77bcf86cd799439011",
            },
            player1: {
              type: "object",
              description: "First player data",
              properties: {
                address: {
                  type: "string",
                  description: "Player's Ethereum address",
                  example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                },
                pokemon: {
                  $ref: "#/components/schemas/Pokemon",
                },
                currentHp: {
                  type: "number",
                  description: "Current pokemon HP",
                  example: 100,
                },
              },
            },
            player2: {
              type: "object",
              description: "Second player data",
              properties: {
                address: {
                  type: "string",
                  description: "Player's Ethereum address or CPU identifier",
                  example: "CPU",
                },
                pokemon: {
                  $ref: "#/components/schemas/Pokemon",
                },
                currentHp: {
                  type: "number",
                  description: "Current pokemon HP",
                  example: 100,
                },
              },
            },
            currentTurn: {
              type: "string",
              description: "Current player's turn (Ethereum address)",
              example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            },
            status: {
              type: "string",
              enum: ["waiting", "active", "finished"],
              description: "Game status",
              example: "active",
            },
            winner: {
              type: "string",
              nullable: true,
              description: "Winner's address (if game is finished)",
              example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            },
            moves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player: {
                    type: "string",
                    description: "Player's address",
                  },
                  move: {
                    type: "string",
                    description: "Move name",
                  },
                  damage: {
                    type: "number",
                    description: "Damage dealt",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    description: "Move timestamp",
                  },
                },
              },
              description: "Game move history",
            },
          },
        },
        User: {
          type: "object",
          required: ["walletAddress"],
          properties: {
            _id: {
              type: "string",
              description: "Unique user identifier",
            },
            walletAddress: {
              type: "string",
              description: "User's Ethereum wallet address",
            },
            nonce: {
              type: "string",
              description: "Authentication nonce",
            },
            statistics: {
              type: "object",
              properties: {
                gamesPlayed: {
                  type: "number",
                  description: "Total games played",
                },
                gamesWon: {
                  type: "number",
                  description: "Total games won",
                },
                gamesLost: {
                  type: "number",
                  description: "Total games lost",
                },
                winRate: {
                  type: "number",
                  description: "Win rate percentage",
                },
              },
            },
            inventory: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Pokemon",
              },
              description: "User's pokemon collection",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error description",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained after signature verification",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
