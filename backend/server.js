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
  const {
    username,
    password,
    type = 'User',     // default to 'User'
    firstname,
    lastname,
    phone,
    address,
    country,
    profilepic = '',   // can be empty initially
    email
  } = req.body;

  try {
    // 1. Check if username exists
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      return res.status(400).send('Username already taken');
    }

    // 2. Insert new user with all fields
    await db.query(
      `INSERT INTO users 
      (username, password, type, firstname, lastname, phone, address, country, profilepic, email) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [username, password, type, firstname, lastname, phone, address, country, profilepic, email]
    );
    res.send('User registered');
  } catch (err) {
    res.status(500).send(err?.detail || err.message || 'Registration error');
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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).send('Invalid username or password');
    }
    // Return only necessary info!
    const user = result.rows[0];
    res.json({ username: user.username, type: user.type });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server error while fetching products');
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
