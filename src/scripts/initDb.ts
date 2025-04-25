import mongoose from "mongoose";
import { config } from "../config/index.js";
import { Pokemon } from "../models/Pokemon.js";

const initialPokemons = [
  {
    id: 25,
    name: "Pikachu",
    types: ["Electric"],
    level: 50,
    stats: {
      hp: 100,
      attack: 55,
      defense: 40,
      speed: 90,
    },
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    moves: [
      { name: "Thunder Shock", type: "Electric", power: 40, accuracy: 100 },
      { name: "Quick Attack", type: "Normal", power: 40, accuracy: 100 },
      { name: "Thunderbolt", type: "Electric", power: 90, accuracy: 100 },
      { name: "Iron Tail", type: "Steel", power: 100, accuracy: 75 },
    ],
  },
  {
    id: 6,
    name: "Charizard",
    types: ["Fire", "Flying"],
    level: 50,
    stats: {
      hp: 100,
      attack: 84,
      defense: 78,
      speed: 100,
    },
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
    moves: [
      { name: "Flamethrower", type: "Fire", power: 90, accuracy: 100 },
      { name: "Dragon Claw", type: "Dragon", power: 80, accuracy: 100 },
      { name: "Air Slash", type: "Flying", power: 75, accuracy: 95 },
      { name: "Fire Blast", type: "Fire", power: 110, accuracy: 85 },
    ],
  },
  {
    id: 9,
    name: "Blastoise",
    types: ["Water"],
    level: 50,
    stats: {
      hp: 100,
      attack: 83,
      defense: 100,
      speed: 78,
    },
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
    moves: [
      { name: "Water Gun", type: "Water", power: 40, accuracy: 100 },
      { name: "Hydro Pump", type: "Water", power: 110, accuracy: 80 },
      { name: "Ice Beam", type: "Ice", power: 90, accuracy: 100 },
      { name: "Flash Cannon", type: "Steel", power: 80, accuracy: 100 },
    ],
  },
  {
    id: 3,
    name: "Venusaur",
    types: ["Grass", "Poison"],
    level: 50,
    stats: {
      hp: 100,
      attack: 82,
      defense: 83,
      speed: 80,
    },
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png",
    moves: [
      { name: "Vine Whip", type: "Grass", power: 45, accuracy: 100 },
      { name: "Solar Beam", type: "Grass", power: 120, accuracy: 100 },
      { name: "Sludge Bomb", type: "Poison", power: 90, accuracy: 100 },
      { name: "Earthquake", type: "Ground", power: 100, accuracy: 100 },
    ],
  },
];

const initDb = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    // Clear existing pokemons
    await Pokemon.deleteMany({});
    console.log("Cleared existing pokemons");

    // Insert new pokemons
    await Pokemon.insertMany(initialPokemons);
    console.log("Inserted initial pokemons");

    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initDb();
