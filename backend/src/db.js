import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Hosted Postgres (Render, Supabase, etc.) requires SSL; local Postgres doesn't.
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);