import { IPokemon, IMove } from "../types";

// Type effectiveness chart
const typeChart: Record<string, Record<string, number>> = {
  fire: { water: 0.5, grass: 2, electric: 1 },
  water: { fire: 2, grass: 0.5, electric: 0.5 },
  grass: { fire: 0.5, water: 2, electric: 1 },
  electric: { fire: 1, water: 2, grass: 0.5 },
};

// Calculate damage for a specific move
export const calculateMoveDamage = (
  move: IMove,
  attacker: IPokemon,
  defender: IPokemon
): number => {
  // Base damage from move power and attacker's attack stat
  const baseDamage = move.power * (attacker.stats.attack / 100);

  // Apply defense reduction
  const damageAfterDefense = baseDamage * (1 - defender.stats.defense / 200);

  // Ensure minimum damage of 1
  return Math.max(1, Math.floor(damageAfterDefense));
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
export const getBestMove = (attacker: IPokemon, defender: IPokemon): IMove => {
  return attacker.moves.reduce((best, current) => {
    const currentDamage = calculateMoveDamage(current, attacker, defender);
    const bestDamage = calculateMoveDamage(best, attacker, defender);
    return currentDamage > bestDamage ? current : best;
  });
};

// Get a defensive move if available
const getDefensiveMove = (pokemon: IPokemon): IMove => {
  const defensiveMoves = pokemon.moves.filter(
    (move) =>
      move.name.toLowerCase().includes("defense") ||
      move.name.toLowerCase().includes("shield")
  );
  return defensiveMoves.length > 0 ? defensiveMoves[0] : getRandomMove(pokemon);
};

// Get a random move
const getRandomMove = (pokemon: IPokemon): IMove => {
  return pokemon.moves[Math.floor(Math.random() * pokemon.moves.length)];
};

// Main AI decision making function
export const getAIAction = (
  game: any,
  playerPokemon: IPokemon,
  aiPokemon: IPokemon
): IMove => {
  console.log("AI Pokemon data:", {
    name: aiPokemon.name,
    moves: aiPokemon.moves,
    stats: aiPokemon.stats,
  });

  // Validate moves
  if (
    !aiPokemon.moves ||
    !Array.isArray(aiPokemon.moves) ||
    aiPokemon.moves.length === 0
  ) {
    console.error("No valid moves found for AI Pokemon");
    // Return default move
    return {
      name: "Tackle",
      type: aiPokemon.type || "normal",
      power: 40,
      accuracy: 100,
    };
  }

  // Get strongest move
  const strongestMove = aiPokemon.moves.reduce((strongest, current) => {
    return (current.power || 0) > (strongest.power || 0) ? current : strongest;
  }, aiPokemon.moves[0]);

  console.log("Selected AI move:", strongestMove);
  return strongestMove;
};
