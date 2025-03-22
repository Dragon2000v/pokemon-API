import mongoose from "mongoose";
import { config } from "../config/index.js";
import { Pokemon } from "../models/Pokemon.js";

const initialPokemons = [
  {
    name: "Pikachu",
    type: ["Electric"],
    hp: 100,
    attack: 55,
    defense: 40,
    speed: 90,
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    moves: [
      { name: "Thunder Shock", power: 40, type: "Electric" },
      { name: "Quick Attack", power: 40, type: "Normal" },
      { name: "Thunderbolt", power: 90, type: "Electric" },
      { name: "Iron Tail", power: 100, type: "Steel" },
    ],
  },
  {
    name: "Charizard",
    type: ["Fire", "Flying"],
    hp: 100,
    attack: 84,
    defense: 78,
    speed: 100,
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
    moves: [
      { name: "Flamethrower", power: 90, type: "Fire" },
      { name: "Dragon Claw", power: 80, type: "Dragon" },
      { name: "Air Slash", power: 75, type: "Flying" },
      { name: "Fire Blast", power: 110, type: "Fire" },
    ],
  },
  {
    name: "Blastoise",
    type: ["Water"],
    hp: 100,
    attack: 83,
    defense: 100,
    speed: 78,
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
    moves: [
      { name: "Water Gun", power: 40, type: "Water" },
      { name: "Hydro Pump", power: 110, type: "Water" },
      { name: "Ice Beam", power: 90, type: "Ice" },
      { name: "Flash Cannon", power: 80, type: "Steel" },
    ],
  },
  {
    name: "Venusaur",
    type: ["Grass", "Poison"],
    hp: 100,
    attack: 82,
    defense: 83,
    speed: 80,
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png",
    moves: [
      { name: "Vine Whip", power: 45, type: "Grass" },
      { name: "Solar Beam", power: 120, type: "Grass" },
      { name: "Sludge Bomb", power: 90, type: "Poison" },
      { name: "Earthquake", power: 100, type: "Ground" },
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
