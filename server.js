import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";

const DATA_PATH = path.join(__dirname, "data.json");
const PUBLIC_DIR = __dirname;

// helper to read/write JSON
function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { teams: [], games: [], pointRules: { win: 2, loss: 1 }, updatedAt: new Date().toISOString() };
  }
}
function writeData(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

const app = express();
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false, // keep simple for demo
}));
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key") || req.query.key;
  if (!key || key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// API
app.get("/api/state", (req, res) => {
  const data = readData();
  res.json(data);
});

app.post("/api/team", requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const data = readData();
  if (data.teams.includes(name)) return res.status(409).json({ error: "team exists" });
  data.teams.push(name);
  writeData(data);
  res.json({ ok: true, teams: data.teams });
});

app.put("/api/team/rename", requireAdmin, (req, res) => {
  const { oldName, newName } = req.body;
  const data = readData();
  const idx = data.teams.indexOf(oldName);
  if (idx === -1) return res.status(404).json({ error: "old team not found" });
  if (data.teams.includes(newName)) return res.status(409).json({ error: "new name exists" });
  data.teams[idx] = newName;
  data.games = data.games.map(g => ({
    ...g,
    home: g.home === oldName ? newName : g.home,
    away: g.away === oldName ? newName : g.away,
  }));
  writeData(data);
  res.json({ ok: true, teams: data.teams });
});

app.delete("/api/team", requireAdmin, (req, res) => {
  const { name } = req.body;
  const data = readData();
  data.teams = data.teams.filter(t => t !== name);
  writeData(data);
  res.json({ ok: true, teams: data.teams });
});

app.post("/api/game", requireAdmin, (req, res) => {
  let { date, home, away, homeScore, awayScore } = req.body;
  if (!home || !away) return res.status(400).json({ error: "home & away required" });
  if (home === away) return res.status(400).json({ error: "home and away must differ" });
  const hs = Number(homeScore), as = Number(awayScore);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return res.status(400).json({ error: "scores must be numbers" });
  if (hs === as) return res.status(400).json({ error: "draws not allowed" });

  const data = readData();
  const id = nanoid();
  const game = { id, date: date || new Date().toISOString().slice(0,10), home, away, homeScore: hs, awayScore: as };
  data.games.unshift(game);
  writeData(data);
  res.json({ ok: true, game });
});

app.put("/api/game/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  let { date, home, away, homeScore, awayScore } = req.body;
  const data = readData();
  const idx = data.games.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: "game not found" });
  const hs = Number(homeScore), as = Number(awayScore);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return res.status(400).json({ error: "scores must be numbers" });
  if (hs === as) return res.status(400).json({ error: "draws not allowed" });
  data.games[idx] = { id, date: date || data.games[idx].date, home, away, homeScore: hs, awayScore: as };
  writeData(data);
  res.json({ ok: true, game: data.games[idx] });
});

app.delete("/api/game/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const data = readData();
  const before = data.games.length;
  data.games = data.games.filter(g => g.id != id);
  const removed = before - data.games.length;
  writeData(data);
  res.json({ ok: true, removed });
});

// Static site (index.html lives next to server.js)
app.use(express.static(PUBLIC_DIR));

// Fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (ADMIN_KEY === "change-me") {
    console.log("WARNING: Set ADMIN_KEY env variable for production!");
  }
});
