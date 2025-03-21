import dotenv from "dotenv";

dotenv.config();

export const env = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value;
};
