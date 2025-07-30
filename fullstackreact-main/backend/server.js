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


// ============ JH multer codes =================
const productMediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // We'll save product media to a dedicated subfolder to keep things organized.
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    // To prevent filename conflicts, we'll use a unique name: timestamp + original filename.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const productMediaUpload = multer({ storage: productMediaStorage });

app.use('/uploads/products', express.static('uploads/products'));

app.post('/api/product-media/upload', productMediaUpload.array('productMedia', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }
  // Map over the array of uploaded files to create an array of their URLs.
  const fileUrls = req.files.map(file => 
    `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`
  );
  // Send the array of URLs back to the frontend.
  res.json({ urls: fileUrls });
});

// =============================


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

    const newUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const userId = newUser.rows[0].id;

    await db.query(
      `INSERT INTO user_active_status (user_id, status) VALUES ($1, 'active')`,
      [userId]
    );
    res.send('User registered');
  } catch (err) {
    res.status(500).send(err?.detail || err.message || 'Registration error');
  }
});



// Add this to your server.js (replace your existing /api/users route)
app.get('/api/users', async (req, res) => {
    const { username, id } = req.query;
    if (username) {
        try {
            const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0) return res.status(404).send('User not found');
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).send(err);
        }
    } else if (id) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length === 0) return res.status(404).send('User not found');
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).send(err);
        }
    } else {
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

app.post('/api/suspend_user', async (req, res) => {
    const { user_id, suspend_until, reason, staff_id } = req.body;
    if (!user_id || !suspend_until || !staff_id) return res.status(400).send('Missing data');
    try {
        // 1. Update active status
        await db.query(`
      INSERT INTO user_active_status (user_id, status, suspend_until, reason)
      VALUES ($1, 'suspended', $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
      status='suspended', suspend_until=$2, reason=$3
    `, [user_id, suspend_until, reason || null]);

        // 2. Insert into suspension history
        await db.query(`
      INSERT INTO user_suspension_history (user_id, suspended_by, start_time, end_time, reason)
      VALUES ($1, $2, NOW(), $3, $4)
    `, [user_id, staff_id, suspend_until, reason || null]);

        res.send('User suspended and logged in history');
    } catch (err) {
        res.status(500).send(err.message || 'Error suspending user');
    }
});

// Add this to your backend (server.js)
app.get('/api/user_active_status', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM user_active_status');
        res.json(result.rows); // This returns an array like the example you posted!
    } catch (err) {
        res.status(500).send(err.message || 'Error');
    }
});

// Add to server.js if not already present:
app.get('/api/user_suspension_history', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).send('user_id required');
    try {
        const result = await db.query(
            'SELECT * FROM user_suspension_history WHERE user_id = $1 ORDER BY start_time DESC',
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message || 'Error');
    }
});

// Delete user and their status/history (and maybe other related info)
app.delete('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // 1. Get username for creditcard deletion
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
        const username = userResult.rows[0]?.username;

        // 2. Delete reviews
        await db.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
        // 3. Delete suspension history as user or as staff who suspended others
        await db.query('DELETE FROM user_suspension_history WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM user_suspension_history WHERE suspended_by = $1', [userId]);
        // 4. Delete user_active_status
        await db.query('DELETE FROM user_active_status WHERE user_id = $1', [userId]);
        // 5. Delete marketplaceorders as buyer
        await db.query('DELETE FROM marketplaceorders WHERE buyer_id = $1', [userId]);
        // 6. Delete marketplaceproducts as seller
        await db.query('DELETE FROM marketplaceproducts WHERE seller_id = $1', [userId]);
        // 7. Delete creditcards by username
        if (username) {
            await db.query('DELETE FROM creditcards WHERE username = $1', [username]);
        }
        // 8. Delete user
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        res.send('User deleted');
    } catch (err) {
        res.status(500).send(err.message || 'Error deleting user');
    }
});



// jun hong's codes (marketplaceproducts GET and POST methods)
// =================================================================
//  ===> PRODUCT CATALOGUE MANAGEMENT ROUTES <===
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
 * @desc    Get all available products, optionally excluding a specific user's items.
 * @access  Public
 */
app.get('/api/marketplaceproducts', async (req, res) => {
    // Get the optional userId to exclude from the query parameters.
    const { excludeUserId } = req.query;

    try {
        let getProductsQuery;
        const queryParams = [];

        // === THIS IS THE CORE LOGIC ===
        // We dynamically build the SQL query based on whether excludeUserId was provided.
        if (excludeUserId) {
            // If we need to exclude a user, add a WHERE clause to filter by seller_id.
            getProductsQuery = `
                SELECT p.*, u.username AS seller_name
                FROM marketplaceproducts p
                LEFT JOIN users u ON p.seller_id = u.id
                WHERE p.status = 'available' AND p.seller_id != $1
                ORDER BY p.created_at DESC;
            `;
            queryParams.push(excludeUserId);
        } else {
            // If no user to exclude (e.g., a guest is browsing), run the original query.
            getProductsQuery = `
                SELECT p.*, u.username AS seller_name
                FROM marketplaceproducts p
                LEFT JOIN users u ON p.seller_id = u.id
                WHERE p.status = 'available'
                ORDER BY p.created_at DESC;
            `;
        }

        const result = await db.query(getProductsQuery, queryParams);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error while fetching products.' });
    }
});

// =================================================================

// jun hong's codes (cart_items GET and POST methods)
// =================================================================
//  ===> SHOPPING CART ROUTES <===
// =================================================================

/**
 * @route   GET /api/cart/:userId
 * @desc    Get all items in a user's cart
 * @access  Private
 */
app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT p.*, ci.id as cart_item_id FROM marketplaceproducts p
            JOIN cart_items ci ON p.id = ci.product_id
            WHERE ci.user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching cart:', err.message);
        res.status(500).json({ error: 'Server error while fetching cart.' });
    }
});

/**
 * @route   POST /api/cart
 * @desc    Add an item to a user's cart
 * @access  Private
 */
app.post('/api/cart', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
        return res.status(400).json({ error: 'User ID and Product ID are required.' });
    }
    try {
        const query = `
            INSERT INTO cart_items (user_id, product_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId, productId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        // Handle the case where the item is already in the cart (violates UNIQUE constraint)
        if (err.code === '23505') { // '23505' is the PostgreSQL code for unique_violation
            return res.status(409).json({ error: 'Item is already in the cart.' });
        }
        console.error('Error adding to cart:', err.message);
        res.status(500).json({ error: 'Server error while adding to cart.' });
    }
});

/**
 * @route   DELETE /api/cart/:userId/:productId
 * @desc    Remove an item from a user's cart
 * @access  Private
 */
app.delete('/api/cart/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    try {
        const query = `
            DELETE FROM cart_items
            WHERE user_id = $1 AND product_id = $2;
        `;
        await db.query(query, [userId, productId]);
        res.status(200).json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Error removing from cart:', err.message);
        res.status(500).json({ error: 'Server error while removing from cart.' });
    }
});

// ================================================================

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
