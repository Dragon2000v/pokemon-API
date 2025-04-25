# Pokemon Game Backend API

A Web3-enabled Pokemon battle game backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- Web3 Authentication using Ethereum wallets
- Pokemon management system
- Battle system (PvP and PvE modes)
- Real-time game updates via WebSocket
- User statistics and inventory system

## Tech Stack

- Node.js
- TypeScript
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- WebSocket (Socket.io)
- Swagger/OpenAPI Documentation

## Prerequisites

- Node.js 16+
- MongoDB 4.4+
- Yarn or npm
- MetaMask or other Web3 wallet

## Environment Variables

Create `.env` file in the root directory:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pokemon_game
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pokemon-API
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Build the project:

```bash
yarn build
# or
npm run build
```

4. Start the server:

```bash
yarn start
# or
npm start
```

For development with hot reload:

```bash
yarn dev
# or
npm run dev
```

## API Documentation

API documentation is available at `http://localhost:3001/api-docs` when the server is running.

### Main Endpoints

#### Authentication

- `POST /api/auth/nonce` - Get nonce for wallet signature
- `POST /api/auth/verify` - Verify wallet signature and get JWT token

#### Pokemon

- `GET /api/pokemon` - Get all pokemons
- `GET /api/pokemon/{id}` - Get specific pokemon

#### Game

- `POST /api/game/create` - Create new game (PvP or PvE)
- `POST /api/game/{id}/move` - Make a move in game
- `GET /api/game/{id}` - Get game details
- `GET /api/game/active` - Get user's active games

#### User

- `GET /api/user/profile` - Get user profile
- `GET /api/user/inventory` - Get user's pokemon inventory
- `GET /api/user/statistics` - Get user's game statistics

## WebSocket Events

### Server -> Client

- `gameUpdate` - Game state updates
- `turnUpdate` - Turn changes
- `battleResult` - Battle results

### Client -> Server

- `joinGame` - Join a game room
- `leaveGame` - Leave a game room
- `makeMove` - Make a move in the game

## Data Models

### Pokemon

```typescript
{
  name: string;
  type: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  imageUrl: string;
  abilities: Array<{
    name: string;
    description: string;
    power: number;
  }>;
}
```

### Game

```typescript
{
  player1: {
    address: string;
    pokemon: ObjectId;
    currentHp: number;
  };
  player2: {
    address: string;
    pokemon: ObjectId;
    currentHp: number;
  };
  status: "waiting" | "active" | "finished";
  currentTurn: string;
  winner?: string;
  moves: Array<{
    player: string;
    move: string;
    damage: number;
    timestamp: Date;
  }>;
}
```

### User

```typescript
{
  walletAddress: string;
  nonce: string;
  inventory: ObjectId[];
  statistics: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
  };
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
