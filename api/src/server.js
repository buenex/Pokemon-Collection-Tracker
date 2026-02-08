const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_PATH = "./data/database.sqlite";

// garante pasta
if (!fs.existsSync("./data")) fs.mkdirSync("./data");

// conecta banco
const db = new sqlite3.Database(DB_PATH);

// cria tabelas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      pokemon_id INTEGER,
      have INTEGER,
      UNIQUE(user_id, pokemon_id)
    )
  `);
});

app.get("/", (_, res) => {
  res.send("API running");
});

app.get("/save/:userId", (req, res) => {
  const { userId } = req.params;

  db.all(
    "SELECT pokemon_id, have FROM saves WHERE user_id = ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

app.post("/save", (req, res) => {
  const { userId, pokemons } = req.body;

  if (!userId || !Array.isArray(pokemons)) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const stmt = db.prepare(`
    INSERT INTO saves (user_id, pokemon_id, have)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, pokemon_id)
    DO UPDATE SET have = excluded.have
  `);

  pokemons.forEach(p => {
    stmt.run(userId, p.id, p.have ? 1 : 0);
  });

  stmt.finalize();

  res.json({ success: true });
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
