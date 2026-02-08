import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ DATABASE_URL environment variable is not set!");
    console.error("   On Render: Add DATABASE_URL to Environment variables in Web Service settings");
    console.error("   Value: Internal Database URL from PostgreSQL database");
    process.exit(1);
  } else {
    console.warn("⚠️  DATABASE_URL not set. Using in-memory fallback (development only)");
  }
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
});
export const db = drizzle(pool, { schema });
