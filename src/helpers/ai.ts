import { IPokemon, IMove } from "../types";

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

// Get the best move based on damage calculation
export const getBestMove = (attacker: IPokemon, defender: IPokemon): IMove => {
  return attacker.moves.reduce((best, current) => {
    const currentDamage = calculateMoveDamage(current, attacker, defender);
    const bestDamage = calculateMoveDamage(best, attacker, defender);
    return currentDamage > bestDamage ? current : best;
  });
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
      type: aiPokemon.types[0] || "normal",
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
