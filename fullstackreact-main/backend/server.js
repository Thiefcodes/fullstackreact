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


// Multer storage to use username as filename (for profile pics)
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

// Unified image upload storage (your version - more flexible)
const unifiedStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Prioritize product_name from the form data, then username, then fallback to a generic timestamped name
        let baseName = 'uploaded_file'; // Default fallback
        if (req.body.product_name) {
            baseName = String(req.body.product_name);
        } else if (req.body.username) {
            baseName = String(req.body.username);
        }
       
        // Clean up the baseName: replace spaces with underscores, remove non-alphanumeric chars, lowercase
        baseName = baseName.replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/gi, '').toLowerCase();
        if (baseName === '') baseName = 'file'; // Ensure it's not empty after sanitization

        const ext = path.extname(file.originalname);
        // Create a unique filename using baseName and a timestamp
        cb(null, `${baseName}-${Date.now()}${ext}`);
    }
});
const unifiedUpload = multer({ storage: unifiedStorage });

app.use('/uploads', express.static('uploads'));

// Profile pic upload (teammate's version)
app.post('/api/uploadprofilepic', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Unified image upload endpoint (your version - more flexible)
app.post('/api/uploadimage', unifiedUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Construct the URL using the server's base URL
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
    console.error('Registration error:', err);
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
            console.error('Error fetching user by username:', err);
            res.status(500).send(err.message || 'Server error');
        }
    } else if (id) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length === 0) return res.status(404).send('User not found');
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching user by id:', err);
            res.status(500).send(err.message || 'Server error');
        }
    } else {
        try {
            const result = await db.query('SELECT * FROM users');
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching all users:', err);
            res.status(500).send(err.message || 'Server error');
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
    console.error('Login error:', err);
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
    console.error('Profile update error:', err);
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
    console.error('Credit card save error:', err);
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
    console.error('Error fetching credit card:', err);
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
    console.error('Error deleting credit card:', err);
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

    // 3. Call ChatGPT API (Note: OpenAI not imported - needs configuration)
    // const completion = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   messages: [{role: "user", content: prompt}],
    //   temperature: 1.1,
    //   max_tokens: 60,
    // });

    // const reply = completion.data.choices[0].message.content;
    // res.json({ result: reply });

    // Placeholder response since OpenAI is not configured
    res.json({ result: "Mix and match feature requires OpenAI API configuration." });

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


app.get('/api/user_active_status', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM user_active_status');
        res.json(result.rows); // This returns an array like the example you posted!
    } catch (err) {
        res.status(500).send(err.message || 'Error');
    }
});

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

        // 2. Delete cart items
        await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

        // 3. Delete creditcards by username
        if (username) {
            await db.query('DELETE FROM creditcards WHERE username = $1', [username]);
        }

        // 4. Delete reviews by user
        await db.query('DELETE FROM reviews WHERE user_id = $1', [userId]);

        // 5. Delete user reports (as reporter or reported)
        await db.query('DELETE FROM user_reports WHERE reporter_id = $1', [userId]);
        await db.query('DELETE FROM user_reports WHERE reported_id = $1', [userId]);

        // 6. Delete posts and forums by user
        await db.query('DELETE FROM posts WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM forums WHERE created_by = $1', [userId]);

        // 7. Delete suspension history as user or staff
        await db.query('DELETE FROM user_suspension_history WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM user_suspension_history WHERE suspended_by = $1', [userId]);

        // 8. Delete user_active_status
        await db.query('DELETE FROM user_active_status WHERE user_id = $1', [userId]);

        // 9. Delete order_items where order is by this user
        const orderIds = await db.query('SELECT id FROM orders WHERE buyer_id = $1', [userId]);
        const orderIdList = orderIds.rows.map(row => row.id);
        if (orderIdList.length > 0) {
            await db.query('DELETE FROM order_items WHERE order_id = ANY($1::int[])', [orderIdList]);
        }

        // 10. Delete orders (where user is buyer)
        await db.query('DELETE FROM orders WHERE buyer_id = $1', [userId]);

        // 11. Delete order_items for products sold by user (marketplaceproducts)
        const mktProductIds = await db.query('SELECT id FROM marketplaceproducts WHERE seller_id = $1', [userId]);
        const mktProductIdList = mktProductIds.rows.map(row => row.id);
        if (mktProductIdList.length > 0) {
            await db.query('DELETE FROM order_items WHERE product_id = ANY($1::int[])', [mktProductIdList]);
        }

        // 12. Delete listings the user is selling (marketplaceproducts only!)
        await db.query('DELETE FROM marketplaceproducts WHERE seller_id = $1', [userId]);

        // 14. Finally, delete the user
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        res.send('User deleted');
    } catch (err) {
        res.status(500).send(err.message || 'Error deleting user');
    }
});

app.post('/api/user_reports', async (req, res) => {
    const { reporter_id, reported_id, reason, additional_info } = req.body;
    if (!reporter_id || !reported_id || !reason) {
        return res.status(400).send('Missing required fields');
    }
    try {
        await db.query(
            `INSERT INTO user_reports (reporter_id, reported_id, reason, additional_info)
             VALUES ($1, $2, $3, $4)`,
            [reporter_id, reported_id, reason, additional_info || null]
        );
        res.send('Report submitted');
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).send('You have already reported this user.');
        }
        res.status(500).send(err.message || 'Error submitting report');
    }
});

app.get('/api/user_reports', async (req, res) => {
    const { reported_id } = req.query;
    try {
        let result;
        if (reported_id) {
            result = await db.query(
                `SELECT r.*, u.username as reporter_username, u.firstname as reporter_firstname, u.lastname as reporter_lastname
                 FROM user_reports r
                 JOIN users u ON r.reporter_id = u.id
                 WHERE r.reported_id = $1
                 ORDER BY r.created_at DESC`,
                [reported_id]
            );
        } else {
            result = await db.query(
                `SELECT r.*, u.username as reporter_username, u.firstname as reporter_firstname, u.lastname as reporter_lastname
                 FROM user_reports r
                 JOIN users u ON r.reporter_id = u.id
                 ORDER BY r.created_at DESC`
            );
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message || 'Error fetching reports');
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

// jun hong's codes (orders GET and POST methods)
// =================================================================
//  ===> ORDER MANAGEMENT ROUTES <===
// =================================================================

/**
 * @route   POST /api/orders
 * @desc    Create a new order from checkout items
 * @access  Private
 */
app.post('/api/orders', async (req, res) => {
    const { userId, items, totalPrice, deliveryMethod, shippingFee } = req.body;
    
    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order information.' });
    }

    const client = await db.connect(); // Use a client for transaction

    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Create a single entry in the 'orders' table
        const orderQuery = `
            INSERT INTO orders (buyer_id, total_price, delivery_method, shipping_fee)
            VALUES ($1, $2, $3, $4) RETURNING id;
        `;
        const orderResult = await client.query(orderQuery, [userId, totalPrice, deliveryMethod, shippingFee]);
        const newOrderId = orderResult.rows[0].id;

        // 2. Create multiple entries in 'order_items'
        const productIds = items.map(item => item.id);
        const cartItemIds = items.map(item => item.cart_item_id);

        for (const item of items) {
            const orderItemQuery = `
                INSERT INTO order_items (order_id, product_id, price_at_purchase)
                VALUES ($1, $2, $3);
            `;
            await client.query(orderItemQuery, [newOrderId, item.id, item.price]);
        }

        // 3. Update the status of the purchased products to 'sold'
        const updateProductsQuery = `
            UPDATE marketplaceproducts SET status = 'sold' WHERE id = ANY($1::int[]);
        `;
        await client.query(updateProductsQuery, [productIds]);

        // 4. Delete the items from the user's cart
        const deleteCartItemsQuery = `
            DELETE FROM cart_items WHERE id = ANY($1::int[]);
        `;
        await client.query(deleteCartItemsQuery, [cartItemIds]);

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: 'Order created successfully!', orderId: newOrderId });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Error creating order:', err.message);
        res.status(500).json({ error: 'Server error while creating order.' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});


/**
 * @route   GET /api/orders/:userId
 * @desc    Get all orders for a specific user
 * @access  Private
 */
app.get('/api/orders/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT o.id, o.total_price, o.ordered_at, o.delivered_at,
                   (SELECT json_agg(p.image_url[1]) FROM order_items oi JOIN marketplaceproducts p ON oi.product_id = p.id WHERE oi.order_id = o.id) as product_images
            FROM orders o
            WHERE o.buyer_id = $1
            ORDER BY o.ordered_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error while fetching orders.' });
    }
});


/**
 * @route   GET /api/orders/details/:orderId
 * @desc    Get full details for a single order
 * @access  Private
 */
app.get('/api/orders/details/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        // Get order summary
        const orderQuery = `SELECT * FROM orders WHERE id = $1;`;
        const orderResult = await db.query(orderQuery, [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        const orderSummary = orderResult.rows[0];

        // Get line items for the order
        const itemsQuery = `
            SELECT p.title, p.size, p.image_url, oi.price_at_purchase
            FROM order_items oi
            JOIN marketplaceproducts p ON oi.product_id = p.id
            WHERE oi.order_id = $1;
        `;
        const itemsResult = await db.query(itemsQuery, [orderId]);
        const lineItems = itemsResult.rows;

        res.status(200).json({ summary: orderSummary, items: lineItems });

    } catch (err) {
        console.error('Error fetching order details:', err.message);
        res.status(500).json({ error: 'Server error while fetching order details.' });
    }
});

// ==================================================

// =================================================================
//  ===> YOUR PRODUCT CRUD OPERATIONS (for the 'product' table) <===
// =================================================================

// GET all products with optional search, category filter, and pagination
app.get('/api/products', async (req, res) => {
    const { search, category, page = 1, limit = 9 } = req.query; // Default to 9 items per page
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT id, created_at, product_name, product_colour, product_material, price, product_description, product_tags, product_points, stock_amt, image_urls, scheduled_stock_amount, scheduled_date FROM product WHERE 1=1';
    let countQuery = 'SELECT COUNT(id) FROM product WHERE 1=1';
    const queryParams = []; // Parameters for the main query (with limit/offset)
    const countParams = []; // Parameters for the count query (only WHERE clause)
    let paramIndex = 1;

    if (search) {
        query += ` AND (product_name ILIKE $${paramIndex} OR product_description ILIKE $${paramIndex})`;
        countQuery += ` AND (product_name ILIKE $${paramIndex} OR product_description ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
        paramIndex++;
    }

    if (category) {
        query += ` AND product_tags ILIKE $${paramIndex}`;
        countQuery += ` AND product_tags ILIKE $${paramIndex}`;
        queryParams.push(`%${category}%`);
        countParams.push(`%${category}%`);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit), offset);

    try {
        const productsResult = await db.query(query, queryParams);
        const countResult = await db.query(countQuery, countParams);

        const totalProducts = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        res.json({
            products: productsResult.rows,
            totalProducts,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error fetching products (GET /api/products):', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// GET a single product by ID
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM product WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error fetching product with ID ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// POST a new product
app.post('/api/products', async (req, res) => {
    const { product_name, product_colour, price, product_description, product_material, product_tags, product_points, stock_amt, image_urls } = req.body;
    try {
        const tagsString = product_tags || '';
        const imageUrlsString = image_urls || '';

        const scheduled_stock_amount = null;
        const scheduled_date = null;

        const result = await db.query(
            `INSERT INTO product (product_name, product_colour, price, product_description, product_material, product_tags, product_points, stock_amt, image_urls, scheduled_stock_amount, scheduled_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
            [product_name, product_colour, price, product_description, product_material, tagsString, product_points, stock_amt, imageUrlsString, scheduled_stock_amount, scheduled_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding new product:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// PUT (Update) an existing product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { product_name, product_colour, price, product_description, product_material, product_tags, product_points, stock_amt, image_urls, scheduled_stock_amount, scheduled_date } = req.body;
    try {
        const tagsString = product_tags || '';
        const imageUrlsString = image_urls || '';

        const finalScheduledStockAmount = (scheduled_stock_amount === undefined || scheduled_stock_amount === '') ? null : scheduled_stock_amount;
        const finalScheduledDate = (scheduled_date === undefined || scheduled_date === '') ? null : scheduled_date;

        const result = await db.query(
            `UPDATE product
             SET product_name = $1, product_colour = $2, price = $3, product_description = $4,
                 product_material = $5, product_tags = $6, product_points = $7, stock_amt = $8, image_urls = $9,
                 scheduled_stock_amount = $10, scheduled_date = $11
             WHERE id = $12 RETURNING *`,
            [product_name, product_colour, price, product_description, product_material, tagsString, product_points, stock_amt, imageUrlsString, finalScheduledStockAmount, finalScheduledDate, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating product with ID ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM product WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully', deletedProduct: result.rows[0] });
    } catch (err) {
        console.error(`Error deleting product with ID ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =================================================================
//  ===> YOUR REVIEW CRUD OPERATIONS <===
// =================================================================

// POST a new review
app.post('/api/reviews', async (req, res) => {
    const { product_id, user_id, rating, comment } = req.body;
    // Basic validation
    if (!product_id || !user_id || !rating) {
        return res.status(400).json({ error: 'Product ID, User ID, and Rating are required.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    try {
        // Optional: Check if product_id and user_id exist in their respective tables
        // For product_id:
        const productExists = await db.query('SELECT id FROM product WHERE id = $1', [product_id]);
        if (productExists.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        // For user_id (assuming users.id is int8):
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const result = await db.query(
            `INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [product_id, user_id, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding new review:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// GET reviews for a specific product
app.get('/api/products/:product_id/reviews', async (req, res) => {
    const { product_id } = req.params;
    try {
        // Join with users table to get reviewer's username/name if needed
        const result = await db.query(
            `SELECT r.*, u.username AS reviewer_username, u.firstname AS reviewer_firstname
             FROM reviews r
             JOIN users u ON r.user_id = u.id -- Assuming users.id is the PK and matches reviews.user_id
             WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
            [product_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(`Error fetching reviews for product ${product_id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// DELETE a review (e.g., by review ID, for moderation or user self-deletion)
app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully', deletedReview: result.rows[0] });
    } catch (err) {
        console.error(`Error deleting review with ID ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Calculate Average Rating for a Product
app.get('/api/products/:product_id/averagerating', async (req, res) => {
    const { product_id } = req.params;
    try {
        const result = await db.query(
            `SELECT AVG(rating)::numeric(10, 2) AS average_rating, COUNT(id) AS total_reviews
             FROM reviews WHERE product_id = $1`,
            [product_id]
        );
        const { average_rating, total_reviews } = result.rows[0];
        res.json({ product_id, average_rating: average_rating || '0.00', total_reviews: parseInt(total_reviews, 10) });
    } catch (err) {
        console.error(`Error calculating average rating for product ${product_id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =================================================================
//  ===> YOUR STOCK MANAGEMENT / INVENTORY <===
// =================================================================

// Update Product Stock Status (for Inventory Management)
// This endpoint also handles scheduled_stock_amount and scheduled_date
app.put('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock_amt, scheduled_stock_amount = null, scheduled_date = null } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (stock_amt !== undefined && stock_amt >= 0) {
        updates.push(`stock_amt = ${paramIndex++}`);
        params.push(stock_amt);
    } else if (stock_amt < 0) {
        return res.status(400).json({ error: 'Invalid stock amount provided (cannot be negative).' });
    }

    updates.push(`scheduled_stock_amount = ${paramIndex++}`);
    params.push(scheduled_stock_amount === '' ? null : scheduled_stock_amount);

    updates.push(`scheduled_date = ${paramIndex++}`);
    params.push(scheduled_date === '' ? null : scheduled_date);

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    params.push(id);

    try {
        const result = await db.query(
            `UPDATE product
             SET ${updates.join(', ')}
             WHERE id = ${paramIndex} RETURNING *`,
            params
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating stock for product ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


// =================================================================
//  ===> WISHLIST MANAGEMENT ROUTES <===
// =================================================================

/**
 * @route   GET /api/wishlist/ids/:userId
 * @desc    Get an array of product IDs in a user's wishlist
 * @access  Private (for logged-in user)
 */
app.get('/api/wishlist/ids/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = 'SELECT product_id FROM wishlist_items WHERE user_id = $1';
        const { rows } = await db.query(query, [userId]);
        // Return a simple array of IDs, e.g., [1, 15, 23]
        res.status(200).json(rows.map(row => row.product_id));
    } catch (err) {
        console.error('Error fetching wishlist IDs:', err.message);
        res.status(500).json({ error: 'Server error while fetching wishlist IDs.' });
    }
});

/**
 * @route   GET /api/wishlist/:userId
 * @desc    Get full product details for all items in a user's wishlist
 * @access  Private (for logged-in user)
 */
app.get('/api/wishlist/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT p.* FROM product p
            JOIN wishlist_items w ON p.id = w.product_id
            WHERE w.user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching wishlist items:', err.message);
        res.status(500).json({ error: 'Server error while fetching wishlist items.' });
    }
});

/**
 * @route   POST /api/wishlist
 * @desc    Add an item to a user's wishlist
 * @access  Private
 */
app.post('/api/wishlist', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
        return res.status(400).json({ error: 'User ID and Product ID are required.' });
    }
    try {
        const query = `
            INSERT INTO wishlist_items (user_id, product_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId, productId]);
        res.status(201).json({ message: 'Item added to wishlist.', item: rows[0] });
    } catch (err) {
        // Handle the case where the item is already in the wishlist (violates PRIMARY KEY)
        if (err.code === '23505') { // '23505' is the PostgreSQL code for unique_violation
            return res.status(409).json({ error: 'Item is already in the wishlist.' });
        }
        console.error('Error adding to wishlist:', err.message);
        res.status(500).json({ error: 'Server error while adding to wishlist.' });
    }
});

/**
 * @route   DELETE /api/wishlist
 * @desc    Remove an item from a user's wishlist
 * @access  Private
 */
app.delete('/api/wishlist', async (req, res) => {
    const { userId, productId } = req.body;
     if (!userId || !productId) {
        return res.status(400).json({ error: 'User ID and Product ID are required.' });
    }
    try {
        const query = 'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2;';
        const result = await db.query(query, [userId, productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found in wishlist.' });
        }
        res.status(200).json({ message: 'Item removed from wishlist.' });
    } catch (err) {
        console.error('Error removing from wishlist:', err.message);
        res.status(500).json({ error: 'Server error while removing from wishlist.' });
    }
});

// =================================================================
//  ===> CATEGORY MANAGEMENT ROUTES <===
// =================================================================

/**
 * @route   GET /api/categories/sidebar
 * @desc    Get all categories with their sub-categories nested for sidebar navigation
 * @access  Public
 */
app.get('/api/categories/sidebar', async (req, res) => {
    try {
        // This query uses JSON aggregation to build the nested structure directly in the database
        const query = `
            SELECT 
                c.id, 
                c.name, 
                COALESCE(
                    (SELECT json_agg(
                        json_build_object('id', s.id, 'name', s.name)
                        ORDER BY s.name
                    ) 
                    FROM sub_categories s 
                    WHERE s.parent_category_id = c.id), 
                '[]'::json) AS sub_categories
            FROM categories c
            ORDER BY c.name;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching sidebar categories:', err.message);
        res.status(500).json({ error: 'Server error while fetching categories.' });
    }
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});