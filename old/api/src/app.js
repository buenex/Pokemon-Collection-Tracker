import express from 'express'
import pkg from 'pg'
import cors from 'cors'
const { Pool } = pkg
const app = express()
const pool = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'postgres',
  database: 'tcg_support',
  port: 5432
})
app.use(cors());

app.get('/', async (req, res) => {
  res.json("Welcome to pokemon support api, please use our others enpoint like /pokemon !")
})

app.get('/pokemon', async (req, res) => {
  try {
    const { id, generation, name, game, search } = req.query

    let query = 'SELECT * FROM pokemon '
    const values = []
    let i = 1
    let parameter_list=0

    if(id || generation || name || game || search){
      query += "WHERE "
    }

    if (id) {
      parameter_list != 0 ? query+=" OR ": parameter_list++ ;
      query += ` id = $${i++}`
      values.push(Number(id))
    }

    if (generation) {
      parameter_list != 0 ? query+=" OR ": parameter_list++ ;
      const generations = generation
          .split(',')
          .map(g => Number(g.trim()))
          .filter(g => !isNaN(g));
  
      if (generations.length) {
  
          generations.forEach((gen, index) => {
              if (index > 0) query += ' OR ';
              query += ` generation = $${i++}`;
              values.push(gen);
          });
      }
    }

    if (name) {
      parameter_list != 0 ? query+=" OR ": parameter_list++ ;
      query += ` name ILIKE $${i++}`
      values.push(`%${name}%`)
    }

    if (game) {
      parameter_list != 0 ? query+=" OR ": parameter_list++ ;
      query += ` game ILIKE $${i++}`
      values.push(`%${game}%`)
    }

    // busca geral (input único no front)
    if (search) {
      query += `AND (
        name ILIKE $${i} OR
        game ILIKE $${i}
      )`
      values.push(`%${search}%`)
    }

    query += ' ORDER BY name'

    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao buscar pokémon' })
  }
})

app.get('/pokemon/filters', async (req, res) => {
  try {
    const generations = await pool.query(
      'SELECT DISTINCT generation FROM pokemon ORDER BY generation'
    )

    const games = await pool.query(
      'SELECT DISTINCT game FROM pokemon ORDER BY game'
    )

    res.json({
      generations: generations.rows.map(r => r.generation),
      games: games.rows.map(r => r.game)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao buscar filtros' })
  }
})

app.listen(3000, () => {
  console.log('API rodando na porta 3000')
})
