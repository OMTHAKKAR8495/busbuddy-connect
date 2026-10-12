import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "postgresql://neondb_owner:npg_vx9dalhAFf8u@ep-billowing-pine-b5mr2ja6-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

if (!connectionString) {
  throw new Error("[Neon DB] Missing DATABASE_URL environment variable.");
}

export const sql = neon(connectionString);

export default sql;
