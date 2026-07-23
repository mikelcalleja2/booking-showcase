// Entry point for cPanel's "Setup Node.js App" (Passenger). Passenger requires this file
// directly and expects it to listen on process.env.PORT — it does not run "npm start".
// Runs pending Prisma migrations once on boot (idempotent — safe on every restart), then
// starts the Next.js production server. Not used on platforms that run "npm start" (e.g.
// Railway) — those use the "start" script in package.json instead.
const { execSync } = require("child_process");
const { createServer } = require("http");
const next = require("next");

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit", cwd: __dirname });
} catch (err) {
  console.error("Prisma migrate deploy failed:", err.message);
}

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = process.env.PORT || 3000;
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Server ready on port ${port}`);
  });
});
