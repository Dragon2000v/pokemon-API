import { IPokemon, Move } from "../types";

// Type effectiveness chart
const typeChart: Record<string, Record<string, number>> = {
  fire: { water: 0.5, grass: 2, electric: 1 },
  water: { fire: 2, grass: 0.5, electric: 0.5 },
  grass: { fire: 0.5, water: 2, electric: 1 },
  electric: { fire: 1, water: 2, grass: 0.5 },
};

// Calculate damage for a specific move
export const calculateMoveDamage = (
  move: Move,
  attacker: IPokemon,
  defender: IPokemon
): number => {
  const baseDamage = move.power || 50;
  const typeMultiplier = getTypeMultiplier(move.type, defender.type);
  return Math.max(
    1,
    (attacker.stats.attack - defender.stats.defense) * typeMultiplier
  );
};

// Get type effectiveness multiplier
const getTypeMultiplier = (
  attackType: string,
  defenseTypes: string[]
): number => {
  return defenseTypes.reduce((multiplier, type) => {
    return multiplier * (typeChart[attackType]?.[type] || 1);
  }, 1);
};

// Get the best move based on damage calculation
export const getBestMove = (attacker: IPokemon, defender: IPokemon): Move => {
  return attacker.moves.reduce((best, current) => {
    const currentDamage = calculateMoveDamage(current, attacker, defender);
    const bestDamage = calculateMoveDamage(best, attacker, defender);
    return currentDamage > bestDamage ? current : best;
  });
};

// Get a defensive move if available
const getDefensiveMove = (pokemon: IPokemon): Move => {
  const defensiveMoves = pokemon.moves.filter(
    (move) =>
      move.name.toLowerCase().includes("defense") ||
      move.name.toLowerCase().includes("shield")
  );
  return defensiveMoves.length > 0 ? defensiveMoves[0] : getRandomMove(pokemon);
};

// Get a random move
const getRandomMove = (pokemon: IPokemon): Move => {
  return pokemon.moves[Math.floor(Math.random() * pokemon.moves.length)];
};

// Main AI decision making function
export const getAIAction = (
  game: any,
  playerPokemon: IPokemon,
  aiPokemon: IPokemon
): Move => {
  const playerHp = game.playerPokemonCurrentHP;
  const aiHp = game.computerPokemonCurrentHP;

  // If player is low on HP, use strongest move
  if (playerHp < 30) {
    return getBestMove(aiPokemon, playerPokemon);
  }

  // If AI is low on HP, use defensive moves
  if (aiHp < 30) {
    return getDefensiveMove(aiPokemon);
  }

  // Otherwise use random move
  return getRandomMove(aiPokemon);
};
