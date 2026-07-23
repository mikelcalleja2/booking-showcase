import path from "path";

// Local dev: files live under <project>/data/uploads (gitignored).
// Production (Railway/Render): set UPLOAD_DIR to a path inside the mounted persistent volume,
// e.g. /app/data/uploads — otherwise uploaded photos are lost on every redeploy.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
