// Applies pending Prisma migration SQL files directly via Node's built-in node:sqlite,
// without invoking the Prisma CLI. The Prisma CLI's `migrate deploy` loads a WASM schema
// engine that can fail with an out-of-memory error on memory-constrained shared hosting
// (see prisma/migrations/*/migration.sql for the actual SQL being applied).
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

function resolveDatabasePath() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!url.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL for the custom migration runner: ${url}`);
  }
  const relative = url.slice("file:".length);
  // Prisma resolves relative sqlite paths relative to prisma/schema.prisma, not process.cwd().
  return path.resolve(__dirname, "..", "prisma", relative);
}

function runMigrations() {
  const dbPath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_app_migrations" (
      "name" TEXT PRIMARY KEY,
      "applied_at" TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
  const applied = new Set(
    db.prepare(`SELECT "name" FROM "_app_migrations"`).all().map((row) => row.name),
  );

  const migrationFolders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let appliedCount = 0;
  for (const folder of migrationFolders) {
    if (applied.has(folder)) continue;

    const sqlPath = path.join(migrationsDir, folder, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log(`Applying migration: ${folder}`);
    db.exec(sql);
    db.prepare(`INSERT INTO "_app_migrations" ("name", "applied_at") VALUES (?, ?)`).run(
      folder,
      new Date().toISOString(),
    );
    appliedCount += 1;
  }

  db.close();
  console.log(
    appliedCount > 0 ? `Applied ${appliedCount} migration(s).` : "No pending migrations.",
  );
}

module.exports = { runMigrations };

if (require.main === module) {
  try {
    runMigrations();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
