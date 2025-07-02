require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Client({
  connectionString: "postgresql://postgres.nlquunjntkcatxdzgwtc:22062004Ee!1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pool_mode=session",
  ssl: { rejectUnauthorized: false }
});



db.connect()
  .then(() => console.log('Connected to PostgreSQL via Supabase'))
  .catch((err) => console.error('Connection error:', err));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    res.send('User registered');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
