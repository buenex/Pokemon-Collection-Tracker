CREATE TABLE IF NOT EXISTS saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  pokemon_id INTEGER,
  have INTEGER,
  UNIQUE(user_id, pokemon_id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
