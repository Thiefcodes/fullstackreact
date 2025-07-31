require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg'); // [OLD CODE]
const { Pool } = require('pg');
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

// [OLD CODE] db connection for Client
/*
const db = new Client({
  connectionString: "postgresql://postgres.nlquunjntkcatxdzgwtc:22062004Ee!1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pool_mode=session",
  ssl: { rejectUnauthorized: false }
});
*/

// [NEW CODE]
const db = new Pool({
  connectionString: "postgresql://postgres.nlquunjntkcatxdzgwtc:22062004Ee!1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pool_mode=session",
  ssl: { rejectUnauthorized: false }
});

// [OLD CODE] db.connect() call
/*
db.connect()
  .then(() => console.log('Connected to PostgreSQL via Supabase'))
  .catch((err) => console.error('Connection error:', err));
*/

// [NEW CODE]
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to PostgreSQL via Supabase Pool. Server time:', res.rows[0].now);
  }
});


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
        const user = result.rows[0];

        // === CHECK SUSPENSION STATUS ===
        const statusResult = await db.query(
            'SELECT status, suspend_until FROM user_active_status WHERE user_id = $1',
            [user.id]
        );
        const statusRow = statusResult.rows[0];
        if (statusRow && statusRow.status === 'suspended') {
            const suspendUntil = statusRow.suspend_until;
            if (!suspendUntil || new Date(suspendUntil) > new Date()) {
                // User is currently suspended
                let untilStr = '';
                let durationStr = '';
                if (suspendUntil) {
                    const now = new Date();
                    const until = new Date(suspendUntil);
                    const ms = until - now;
                    if (ms > 0) {
                        const totalMinutes = Math.ceil(ms / (1000 * 60));
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        if (hours >= 24) {
                            const days = Math.floor(hours / 24);
                            durationStr = `${days} day${days !== 1 ? 's' : ''}`;
                        } else if (hours > 0) {
                            durationStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
                        } else {
                            durationStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                        }
                        untilStr = ` for ${durationStr} (until ${until.toLocaleString()})`;
                    }
                }
                return res.status(403).send(`Your account is suspended${untilStr}.`);
            }
        }

        // Return only necessary info!
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
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
    const { excludeUserId, status, seller_id } = req.query;

    try {
        let getProductsQuery;
        const queryParams = [];
        let whereClauses = [];

        // Status filtering (for staff view, etc.)
        if (status) {
            whereClauses.push(`p.status = $${queryParams.length + 1}`);
            queryParams.push(status.toLowerCase()); // 'pending' or 'available'
        } else {
            // Default to 'available' if status is not provided (for marketplace)
            whereClauses.push(`p.status = $${queryParams.length + 1}`);
            queryParams.push('available');
        }

        // Exclude seller if needed
        if (excludeUserId) {
            whereClauses.push(`p.seller_id != $${queryParams.length + 1}`);
            queryParams.push(excludeUserId);
        }

        // Filter by seller if provided
        if (seller_id) {
            whereClauses.push(`p.seller_id = $${queryParams.length + 1}`);
            queryParams.push(seller_id);
        }


        getProductsQuery = `
            SELECT p.*, u.username AS seller_name
            FROM marketplaceproducts p
            LEFT JOIN users u ON p.seller_id = u.id
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY p.created_at DESC;
        `;

        const result = await db.query(getProductsQuery, queryParams);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error while fetching products.' });
    }
});

// PATCH /api/marketplaceproducts/:id -- Approve listing
app.patch('/api/marketplaceproducts/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required.' });
    }

    try {
        const result = await db.query(
            'UPDATE marketplaceproducts SET status = $1 WHERE id = $2 RETURNING *',
            [status.toLowerCase(), id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ success: true, product: result.rows[0] });
    } catch (err) {
        console.error('Error updating product status:', err.message);
        res.status(500).json({ error: 'Server error while updating product status.' });
    }
});

app.delete('/api/marketplaceproducts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM marketplaceproducts WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ error: 'Server error while deleting product.' });
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
            INSERT INTO orders (buyer_id, total_price, delivery_method, shipping_fee, user_order_id)
            VALUES ($1, $2, $3, $4, (SELECT COUNT(*) FROM orders WHERE buyer_id = $1) + 1)
            RETURNING id;
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
            SELECT o.id, o.user_order_id, o.total_price, o.ordered_at, o.delivered_at,
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
        const orderQuery = `SELECT *, user_order_id FROM orders WHERE id = $1;`;
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

// jun hong's codes (listing GET method)
/**
 * @route   GET /api/listings/:userId
 * @desc    Get all marketplace products listed by a specific user
 * @access  Private (as only a logged-in user should see their own listings)
 */
app.get('/api/listings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT * FROM marketplaceproducts
            WHERE seller_id = $1
            ORDER BY created_at DESC;
        `;
        // We use parseInt here as a good practice to ensure the ID is a number.
        const { rows } = await db.query(query, [parseInt(userId, 10)]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching user listings:', err.message);
        res.status(500).json({ error: 'Server error while fetching listings.' });
    }
});
// ===============================================

// =================================================================
//  ===> YOUR PRODUCT CRUD OPERATIONS (for the 'product' table) <===
// =================================================================

// GET all products with optional search, category filter, and pagination
app.get('/api/products', async (req, res) => {
  const { search, category, page = 1, limit = 9 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // 1) include `status` in the SELECT
  let query =
    `SELECT
       id, created_at, product_name, product_colour, product_material,
       price, product_description, product_tags, product_points,
       stock_amt, image_urls, scheduled_stock_amount, scheduled_date,
       status
     FROM product
     WHERE 1=1`;
  let countQuery = `SELECT COUNT(id) FROM product WHERE 1=1`;

  const queryParams = [];
  const countParams = [];
  let idx = 1;

  if (search) {
    query += ` AND (product_name ILIKE $${idx} OR product_description ILIKE $${idx})`;
    countQuery += ` AND (product_name ILIKE $${idx} OR product_description ILIKE $${idx})`;
    queryParams.push(`%${search}%`);
    countParams.push(`%${search}%`);
    idx++;
  }
  if (category) {
    query += ` AND product_tags ILIKE $${idx}`;
    countQuery += ` AND product_tags ILIKE $${idx}`;
    queryParams.push(`%${category}%`);
    countParams.push(`%${category}%`);
    idx++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  queryParams.push(parseInt(limit), offset);

  try {
    const productsResult = await db.query(query, queryParams);
    const countResult    = await db.query(countQuery, countParams);

    const totalProducts = parseInt(countResult.rows[0].count, 10);
    const totalPages    = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products: productsResult.rows,
      totalProducts,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET a single product by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // SELECT * now returns `status` too, since it's a real column
    const result = await db.query('SELECT * FROM product WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST a new product
app.post('/api/products', async (req, res) => {
  let {
    product_name,
    product_colour,
    price,
    product_description,
    product_material,
    product_tags,
    product_points,
    stock_amt,
    image_urls,
  } = req.body;

  try {
    // 2) force minimum stock of 40, and set status='active'
    const initialStock = Math.max(40, Number(stock_amt) || 40);
    const tagsString   = product_tags   || '';
    const pointsNum    = product_points || 0;
    const urlsString   = image_urls     || '';

    const result = await db.query(
      `INSERT INTO product (
         product_name, product_colour, price,
         product_description, product_material,
         product_tags, product_points, stock_amt,
         image_urls, scheduled_stock_amount,
         scheduled_date, status, created_at
       ) VALUES (
         $1, $2, $3,
         $4, $5,
         $6, $7, $8,
         $9, NULL,
         NULL, 'active', NOW()
       )
       RETURNING *`,
      [
        product_name, product_colour, price,
        product_description, product_material,
        tagsString, pointsNum, initialStock,
        urlsString,
      ]
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
  let {
    product_name,
    product_colour,
    price,
    product_description,
    product_material,
    product_tags,
    product_points,
    stock_amt,
    image_urls,
    scheduled_stock_amount,
    scheduled_date
  } = req.body;

  try {
    // derive the new status in JS
    let status = 'active';
    if (scheduled_date && new Date(scheduled_date) > new Date()) {
      status = 'scheduled';
    } else if (Number(stock_amt) < 40) {
      status = 'low';
    }

    const tagsString = product_tags || '';
    const pointsNum  = product_points || 0;
    const urlsString = image_urls || '';

    const result = await db.query(
      `UPDATE product
         SET product_name           = $1,
             product_colour         = $2,
             price                  = $3,
             product_description    = $4,
             product_material       = $5,
             product_tags           = $6,
             product_points         = $7,
             stock_amt              = $8,
             image_urls             = $9,
             scheduled_stock_amount = $10,
             scheduled_date         = $11,
             status                 = $12
       WHERE id = $13
       RETURNING *`,
      [
        product_name, product_colour, price,
        product_description, product_material,
        tagsString, pointsNum, stock_amt,
        urlsString, scheduled_stock_amount || null,
        scheduled_date   || null,
        status,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating product ${id}:`, err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM product WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', deletedProduct: result.rows[0] });
  } catch (err) {
    console.error(`Error deleting product ${id}:`, err.message);
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
// This endpoint also handles scheduled_stock_amount, scheduled_date, and now status
app.put('/api/products/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { scheduled_stock_amount, scheduled_date } = req.body;

  // if neither field is present, bail out
  if (scheduled_stock_amount == null && !scheduled_date) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // We'll always mark it "scheduled" when you call this route:
  const query = `
    UPDATE product
       SET scheduled_stock_amount = $1,
           scheduled_date         = $2,
           status                 = 'scheduled'
     WHERE id = $3
     RETURNING *`;

  try {
    const { rows } = await db.query(query, [
      scheduled_stock_amount,
      scheduled_date,
      id
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error scheduling stock up:', err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(5000, () => {
  console.log('Server running on port 5000');
});