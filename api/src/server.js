require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

async function initDB() {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS saves (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(1000) NOT NULL,
    pokemon_id INTEGER NOT NULL,
    have BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, pokemon_id)
  );
  
  `);
}

initDB().catch(console.error);

app.get("/", (_, res) => {
  res.send("API running");
});

app.get("/save/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows } = await pool.query(
      "SELECT pokemon_id, have FROM saves WHERE user_id = $1",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/save", async (req, res) => {
  console.log("Iniciou a funcao")
  const { userId, pokemons } = req.body;
  if (!userId || !Array.isArray(pokemons)) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Iniciou a query")

    for (const p of pokemons) {
      console.log("Iniciou com o pokemon"+p.name)
      await client.query(
        `
        INSERT INTO saves (user_id, pokemon_id, have)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, pokemon_id)
        DO UPDATE SET have = EXCLUDED.have
        `,
        [userId, p.id, !!p.have]
      );
      console.log("Passou pelo insert")
    }

    await client.query("COMMIT");
    console.log("Commitou as alteracoes")

    res.json({ success: true });
  } catch (err) {
    console.log("Iniciou a funcao")
    await client.query("ROLLBACK");
    res.status(500).json(err);
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
