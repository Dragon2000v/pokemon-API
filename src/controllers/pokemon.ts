import { Request, Response } from "express";
import Pokemon from "../schemas/pokemon.js";
import { IPokemon } from "../types/index.js";

export const getAllPokemons = async (_req: Request, res: Response) => {
  try {
    const pokemons = await Pokemon.find();
    res.json(pokemons);
  } catch (error) {
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

interface PokemonData {
  id: number;
  name: {
    english: string;
  };
  type: string[];
  base: {
    HP: number;
    Attack: number;
    Defense: number;
    Speed: number;
  };
}

export const initializePokemons = async () => {
  try {
    const count = await Pokemon.countDocuments();
    if (count > 0) {
      return;
    }

    const response = await fetch(
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json"
    );
    const pokemonData: PokemonData[] = await response.json();

    const initialPokemons: Omit<IPokemon, "_id">[] = pokemonData
      .slice(0, 20)
      .map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name.english,
        types: pokemon.type,
        stats: {
          hp: pokemon.base.HP,
          attack: pokemon.base.Attack,
          defense: pokemon.base.Defense,
          speed: pokemon.base.Speed,
        },
        level: 50,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
      }));

    await Pokemon.insertMany(initialPokemons);
    console.log("Pokemons initialized successfully");
  } catch (error) {
    console.error(
      "Failed to initialize pokemons:",
      error instanceof Error ? error.message : error
    );
  }
};
