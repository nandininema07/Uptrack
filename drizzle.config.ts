import type { Config } from "drizzle-kit";

export default {
  schema: "./server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true,
  },
} satisfies Config;
