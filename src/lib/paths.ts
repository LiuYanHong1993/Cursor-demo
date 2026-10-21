import path from "path";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "usp.db");
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, "uploads");
