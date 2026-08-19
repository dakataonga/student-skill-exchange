import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// Reads ANTHROPIC_API_KEY from backend/.env. Get a key at console.anthropic.com.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
