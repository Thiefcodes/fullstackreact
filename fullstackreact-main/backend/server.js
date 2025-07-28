require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const multer = require('multer');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
app.use(cors());
app.use(express.json());


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Multer storage to use username as filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use username from the form data
    const username = req.body.username;
    // Use original extension (e.g., .jpg, .png)
    const ext = path.extname(file.originalname);
    cb(null, username + ext);
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.post('/api/uploadprofilepic', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});


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



// Add this to server.js:
app.get('/api/users', async (req, res) => {
  const { username } = req.query;
  if (username) {
    try {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) return res.status(404).send('User not found');
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    // default: return all users
    try {
      const result = await db.query('SELECT * FROM users');
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err);
    }
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
    res.json({ id: user.id, username: user.username, type: user.type });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.put('/api/updateprofile', async (req, res) => {
  const {
    username,        // This identifies which user to update
    firstname,
    lastname,
    phone,
    address,
    country,
    profilepic,
    email
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET
        firstname = $1,
        lastname = $2,
        phone = $3,
        address = $4,
        country = $5,
        profilepic = $6,
        email = $7
      WHERE username = $8
      RETURNING *`,
      [firstname, lastname, phone, address, country, profilepic, email, username]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('User not found');
    }
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    res.status(500).send(err?.detail || err.message || 'Update error');
  }
});

app.post('/api/changepassword', async (req, res) => {
  const { username, currentPassword, newPassword, otp } = req.body;
  if (!username || !currentPassword || !newPassword || !otp) {
    return res.status(400).send('Missing fields');
  }
  // 1. Verify OTP
  if (otps[username] !== otp) {
    return res.status(401).send('Invalid or expired OTP');
  }
  // 2. Verify old password
  const result = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, currentPassword]);
  if (result.rows.length === 0) {
    return res.status(401).send('Current password is incorrect');
  }
  // 3. Update to new password
  await db.query('UPDATE users SET password = $1 WHERE username = $2', [newPassword, username]);
  delete otps[username]; // Remove OTP after use
  res.send('Password updated');
});

// Add to server.js (require nodemailer or any email library)
const otps = {}; // For demo; use Redis/db in production

app.post('/api/sendotp', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('Username required');
  
  // Get user email from DB
  const result = await db.query('SELECT email FROM users WHERE username = $1', [username]);
  if (!result.rows.length) return res.status(404).send('User not found');
  const email = result.rows[0].email;

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[username] = otp;

  // Compose email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}\nThis code will expire in 10 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('OTP sent');
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).send('Failed to send OTP');
  }
});


// --- Credit Card CRUD ---

// POST /api/creditcard (expects {username, cardnumber, name, expiry_month, expiry_year, cvc})
app.post('/api/creditcard', async (req, res) => {
  const { username, cardnumber, name, expiry_month, expiry_year, cvc } = req.body;
  if (!username || !cardnumber || !name || !expiry_month || !expiry_year || !cvc)
    return res.status(400).send('All fields required');
  try {
    // Masking logic for UI
    const cardnumber_masked = '************' + cardnumber.slice(-4);
    const cvc_masked = '***';
    // Save all data to DB (do NOT store cvc plaintext in real production apps)
    await db.query(`
      INSERT INTO creditcards (username, cardnumber, cardholder_name, expiry_month, expiry_year, cvc)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (username) DO UPDATE SET
      cardnumber=$2, cardholder_name=$3, expiry_month=$4, expiry_year=$5, cvc=$6
    `, [username, cardnumber, name, expiry_month, expiry_year, cvc]);
    res.send('Credit card saved');
  } catch (err) {
    res.status(500).send(err.message || 'Error');
  }
});

// GET /api/creditcard?username=...
app.get('/api/creditcard', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).send('Username required');
  try {
    const result = await db.query(
      'SELECT cardnumber, cardholder_name, expiry_month, expiry_year, cvc FROM creditcards WHERE username = $1', [username]
    );
    if (!result.rows.length) return res.status(404).send('Not found');
    const card = result.rows[0];
    res.json({
      ...card,
      cardnumber_masked: '************' + card.cardnumber.slice(-4),
      cvc_masked: '***'
    });
  } catch (err) {
    res.status(500).send(err.message || 'Error');
  }
});

// DELETE /api/creditcard?username=...
app.delete('/api/creditcard', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).send('Username required');
  try {
    await db.query('DELETE FROM creditcards WHERE username=$1', [username]);
    res.send('Card deleted');
  } catch (err) {
    res.status(500).send(err.message || 'Error');
  }
});


app.post('/api/mixmatch', async (req, res) => {
  const { username, category, tags, color, owned } = req.body;

  try {
    // 1. Query database for matching clothes
    // Example query, adapt as needed:
    let query = 'SELECT * FROM clothes WHERE 1=1';
    let params = [];
    if (category) { query += ' AND category = $' + (params.length+1); params.push(category); }
    if (color) { query += ' AND color = $' + (params.length+1); params.push(color); }
    // Add owned/unowned logic as needed
    // For tags, use LIKE or an array column depending on your schema

    const result = await db.query(query, params);

    // 2. Prepare prompt for ChatGPT
    const prompt = `I have the following clothes in my inventory:${result.rows.map(row => `ID:${row.id}, Category:${row.category}, Color:${row.color}, Tags:${row.tags}, Owned:${row.owned ? "Yes" : "No"}`).join('\n')}Please recommend a mix and match outfit. Output format: "Shirt:<id>,Pants:<id>,Shoes:<id>"Only select items that match these filters:- Category: ${category || "Any"}- Color: ${color || "Any"}- Tags: ${tags || "Any"}- Owned: ${owned || "Any"}Respond ONLY with the output format.`;

    // 3. Call ChatGPT API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: prompt}],
      temperature: 1.1,
      max_tokens: 60,
    });

    const reply = completion.data.choices[0].message.content;
    res.json({ result: reply });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating mix and match');
  }
});

// jun hong's codes (marketplaceproducts GET and POST methods)
// =================================================================
//  ===> NEW: PRODUCT CATALOGUE MANAGEMENT ROUTES <===
// =================================================================

/**
 * @route   POST /api/marketplaceproducts
 * @desc    Create a new product listing in the marketplace
 * @access  Public (should be private to logged-in users in the future)
 */
app.post('/api/marketplaceproducts', async (req, res) => {
  try {
    const { seller_id, title, description, price, category, size, image_url } = req.body;

    // Basic validation
    if (!seller_id || !title || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields: seller_id, title, price, category.' });
    }

    const newProductQuery = `
      INSERT INTO marketplaceproducts (seller_id, title, description, price, category, size, image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')
      RETURNING *;
    `;
    const values = [seller_id, title, description, price, category, size, image_url];

    const result = await db.query(newProductQuery, values);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Server error while creating product.' });
  }
});

/**
 * @route   GET /api/marketplaceproducts
 * @desc    Get all available products from the marketplace
 * @access  Public
 */
app.get('/api/marketplaceproducts', async (req, res) => {
    try {
        // We join with the users table to get the seller's username for each product.
        // This is more efficient than making a separate DB call for each product.
        const getProductsQuery = `
            SELECT p.*, u.username AS seller_name
            FROM marketplaceproducts p
            JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'available'
            ORDER BY p.created_at DESC;
        `;

        const result = await db.query(getProductsQuery);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error while fetching products.' });
    }
});


// =================================================================



app.listen(5000, () => {
  console.log('Server running on port 5000');
});
