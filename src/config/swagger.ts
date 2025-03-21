import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pokemon Game API",
      version: "1.0.0",
      description: "API для игры Pokemon с Web3 аутентификацией",
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
        description: "Аутентификация через Web3 (Ethereum кошелек)",
      },
      {
        name: "Pokemon",
        description: "Операции с покемонами",
      },
      {
        name: "Game",
        description: "Управление игровым процессом",
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
              description: "Уникальный идентификатор покемона",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              description: "Имя покемона",
              example: "Pikachu",
            },
            type: {
              type: "array",
              items: { type: "string" },
              description: "Типы покемона",
              example: ["Electric"],
            },
            hp: {
              type: "number",
              description: "Очки здоровья",
              example: 100,
            },
            attack: {
              type: "number",
              description: "Сила атаки",
              example: 55,
            },
            defense: {
              type: "number",
              description: "Защита",
              example: 40,
            },
            speed: {
              type: "number",
              description: "Скорость",
              example: 90,
            },
            imageUrl: {
              type: "string",
              description: "URL изображения покемона",
              example:
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
            },
          },
        },
        Game: {
          type: "object",
          required: ["player1", "player2", "currentTurn", "status"],
          properties: {
            _id: {
              type: "string",
              description: "Уникальный идентификатор игры",
              example: "507f1f77bcf86cd799439011",
            },
            player1: {
              type: "object",
              description: "Данные первого игрока",
              properties: {
                address: {
                  type: "string",
                  description: "Ethereum адрес игрока",
                  example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                },
                pokemon: {
                  $ref: "#/components/schemas/Pokemon",
                },
                currentHp: {
                  type: "number",
                  description: "Текущее здоровье покемона",
                  example: 100,
                },
              },
            },
            player2: {
              type: "object",
              description: "Данные второго игрока (CPU)",
              properties: {
                address: {
                  type: "string",
                  description: "Идентификатор CPU",
                  example: "CPU",
                },
                pokemon: {
                  $ref: "#/components/schemas/Pokemon",
                },
                currentHp: {
                  type: "number",
                  description: "Текущее здоровье покемона CPU",
                  example: 100,
                },
              },
            },
            currentTurn: {
              type: "string",
              description: "Адрес игрока, чей сейчас ход",
              example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            },
            status: {
              type: "string",
              enum: ["active", "finished"],
              description: "Статус игры",
              example: "active",
            },
            winner: {
              type: "string",
              nullable: true,
              description: "Адрес победителя (если игра завершена)",
              example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Описание ошибки",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT токен, полученный после верификации подписи",
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
