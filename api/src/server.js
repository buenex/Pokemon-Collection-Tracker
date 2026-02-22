require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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
  res.send("API is running!");
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
    console.log(err);
    res.status(500).json(err);
  }
});

app.post("/save", async (req, res) => {
  const { userId, pokemons } = req.body;
  if (!userId || !Array.isArray(pokemons)) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const p of pokemons) {
      await client.query(
        `
        INSERT INTO saves (user_id, pokemon_id, have)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, pokemon_id)
        DO UPDATE SET have = EXCLUDED.have
        `,
        [userId, p.id, !!p.have]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json(err);
  } finally {
    client.release();
  }
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
