require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const express = require('express');
const cors = require('cors');
const { Client } = require('pg'); // [OLD CODE]
const { Pool } = require('pg');
const multer = require('multer');
const app = express();
const nodemailer = require('nodemailer');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const { analyzeSustainability, analyzeSustainabilityByText } = require('./gemini');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const pdfkit = require('pdfkit');

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

app.use(cors());
app.use(express.json());
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: " change here" });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const db = new Pool({
  connectionString: "postgresql://postgres.nlquunjntkcatxdzgwtc:22062004Ee!1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pool_mode=session",
  ssl: { rejectUnauthorized: false }
});


const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "file path for secret key change here"
});

app.get('/api/ga4/pageviews', async (req, res) => {
  console.log('===> /api/ga4/pageviews called!');
  const propertyId = "499880704";
  try {
    console.log('===> Attempting to call GA4...');
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }]
    });
    console.log('===> GA4 call succeeded!');
    const data = response.rows.map(row => ({
      pagePath: row.dimensionValues[0].value,
      views: row.metricValues[0].value
    }));
    res.json(data);
  } catch (err) {
    console.error('GA4 pageviews error:', err, err?.message, err?.stack);
    res.status(500).json({ error: "Failed to fetch GA4 data", details: err?.message || err });
  }
});


app.get('/api/test', (req, res) => {
  res.json({ working: true });
});

// clothes tagging page

function encodeImageBase64(localImagePath) {
  // Read binary image
  const img = fs.readFileSync(localImagePath);
  // Encode to base64
  const base64 = img.toString('base64');
  // Infer mime type from extension
  const ext = path.extname(localImagePath).toLowerCase();
  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.webp') mime = 'image/webp';
  // Return data URL
  return `data:${mime};base64,${base64}`;
}

app.get('/api/marketplaceproducts/untagged', async(req, res) => {
 try {
        const result = await db.query(`
            SELECT mp.*
            FROM marketplaceproducts mp
            LEFT JOIN clothestag ct ON mp.id = ct.product_id
            WHERE ct.id IS NULL
            ORDER BY mp.created_at DESC
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching untagged products:', err);
        res.status(500).send(err.message || 'Server error');
    }
});



app.post('/api/ai-scan', async (req, res) => {
  let { image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: "No image_url provided" });

  // If the image_url is a localhost URL, convert it to a local file path and encode to base64
  if (image_url.startsWith('http://localhost:5000/')) {
    // Remove domain and get local relative path
    image_url = image_url.replace('http://localhost:5000', '');
    // If it starts with `/`, remove the first `/`
    if (image_url.startsWith('/')) image_url = image_url.slice(1);
    const localPath = path.join(__dirname, image_url);
    try {
      image_url = encodeImageBase64(localPath);
    } catch (err) {
      console.error('Failed to read/encode local image:', err);
      return res.status(400).json({ error: 'Failed to read local image file.' });
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion AI. Given an image of clothing, describe its category, main color, and suggest up to 3 tags such as style, season, or mood. Respond as JSON only."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this clothing image and return a JSON like: {\"category\":..., \"color\":..., \"tags\": [...]}. Only respond with the JSON." },
            { type: "image_url", image_url: { url: image_url } }
          ]
        }
      ],
      max_tokens: 256,
      temperature: 0.3
    });

    let text = completion.choices[0].message.content.trim();
console.log('AI raw response:', text);

// Remove code block wrappers if present (```json ... ```)
if (text.startsWith('```')) {
  // Remove the first line (```json or ```) and the last line (```)
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

let aiData;
try {
  aiData = JSON.parse(text);
} catch (err) {
  return res.status(500).json({ error: "Invalid AI response", ai_response: text });
}
    res.json(aiData);

  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: "OpenAI error" });
  }
});

app.post('/api/clothestag', async (req, res) => {
  console.log('Received:', req.body); // <-- Add this
  const { product_id, category, tags, color, image_url, ai_analysis_json } = req.body;
  if (!product_id || !category)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const result = await db.query(
      `INSERT INTO clothestag
        (product_id, category, tags, color, image_url, ai_analysis_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [product_id, category, tags || null, color || null, image_url || null, ai_analysis_json ? JSON.stringify(ai_analysis_json) : null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
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

const generateReceiptPdf = (orderId, orderDetails) => {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit({ size: 'A4', margin: 50 });
        const invoicesDir = path.join(__dirname, 'invoices');
        
      
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir);
        }
        
        const filePath = path.join(invoicesDir, `receipt-${orderId}.pdf`);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(20).text('EcoThrift Receipt', { align: 'center' });
        doc.fontSize(10).text(`Order ID: ${orderId}`, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).text('Order Summary', { underline: true });
        doc.moveDown();

        orderDetails.items.forEach(item => {
            doc.fontSize(12).text(`${item.name} (Size: ${item.size})`);
            doc.fontSize(10).text(`$${parseFloat(item.displayPrice).toFixed(2)}`, { align: 'right' });
            doc.moveDown(0.5);
        });
        
        doc.moveDown();
        doc.fontSize(12).text(`Subtotal: $${orderDetails.subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`Shipping: $${orderDetails.shippingFee.toFixed(2)}`, { align: 'right' });
        doc.fontSize(14).font('Helvetica-Bold').text(`Total: $${parseFloat(orderDetails.totalPrice).toFixed(2)}`, { align: 'right' });
        
        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
};

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

//=======REGISTER USER============
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
    email,
    postal_code        // NEW: Accept postal_code from frontend
  } = req.body;

  try {
    // 1. Check if username exists
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      return res.status(400).send('Username already taken');
    }

    // 2. Insert new user with all fields (including postal_code)
    await db.query(
      `INSERT INTO users 
      (username, password, type, firstname, lastname, phone, address, country, profilepic, email, postal_code) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [username, password, type, firstname, lastname, phone, address, country, profilepic, email, postal_code]
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
  const { user_id, category, tags, color, owned } = req.body;

  try {
    let query = `
      SELECT mp.*, ct.category AS tag_category, ct.tags, ct.color AS tag_color
      FROM marketplaceproducts mp
      JOIN clothestag ct ON mp.id = ct.product_id
    `;
    let conditions = [];
    let params = [];

    // Optional: Owned/unowned filter
    if (owned === true && user_id) {
      query += " JOIN userowned uo ON mp.id = uo.product_id";
      conditions.push("uo.user_id = $" + (params.length + 1));
      params.push(user_id);
    } else if (owned === false && user_id) {
      query += " LEFT JOIN userowned uo ON mp.id = uo.product_id AND uo.user_id = $" + (params.length + 1);
      conditions.push("uo.user_id IS NULL");
      params.push(user_id);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY mp.created_at DESC LIMIT 30";

    // DEBUG: print query & params
    console.log('MIXMATCH QUERY:', query, params);

    const { rows: products } = await db.query(query, params);
    if (!products.length) return res.json({ error: "No matching clothes found." });

    // Prepare user preferences as text
    let preferenceText = "User is looking for: ";
    if (category) preferenceText += `category: ${category}; `;
    if (color) preferenceText += `color: ${color}; `;
    if (tags && tags.length > 0) preferenceText += `tags: ${tags.join(', ')}; `;
    if (owned === true) preferenceText += "items the user owns; ";
    if (owned === false) preferenceText += "items the user does NOT own; ";

    // Format for AI: include all items, let OpenAI decide
    const inventory = products.map(p =>
      `ID:${p.id},Category:${p.tag_category},Color:${p.tag_color},Tags:${(p.tags || []).join(',')},Title:${p.title || ''}`
    ).join('\n');

    // Construct prompt
    const prompt =
      `${preferenceText}\n` +
      `Here is the available clothing inventory:\n${inventory}\n` +
      `Please recommend an outfit with at least one top and one bottom (e.g., Shirt + Pants) that best fits the user's preferences (even if not an exact match, just the closest possible). ` +
      `Return your answer as JSON (do not include markdown/code blocks):\n` +
      `{"top":<id>,"bottom":<id>,"reasoning":"short reasoning for your pick"}\n` +
      `If no good match is possible, pick the next best and explain why.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful fashion AI." },
        { role: "user", content: prompt }
      ],
      max_tokens: 220,
      temperature: 0.9, // Increase for more creativity/flexibility!
    });

    let text = completion.choices[0].message.content.trim();

    // Remove markdown code blocks (in case AI adds them)
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
    }

    let ai;
    try {
      ai = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid AI response", ai_response: text });
    }

    // Find the selected products
    const top = products.find(p => p.id === Number(ai.top));
    const bottom = products.find(p => p.id === Number(ai.bottom));

    res.json({
      outfit: { top, bottom },
      reasoning: ai.reasoning || ""
    });

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

app.delete('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const userResult = await client.query('SELECT username FROM users WHERE id = $1', [userId]);
        const username = userResult.rows[0]?.username;

        await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM shop_cart_items WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM wishlist_items WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM userowned WHERE user_id = $1', [userId]);
        if (username) {
            await client.query('DELETE FROM creditcards WHERE username = $1', [username]);
        }
        await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM marketplace_reviews WHERE buyer_id = $1 OR seller_id = $1', [userId]);
        await client.query('DELETE FROM user_reports WHERE reporter_id = $1 OR reported_id = $1', [userId]);
        await client.query('DELETE FROM posts WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM forums WHERE created_by = $1', [userId]);
        await client.query('DELETE FROM user_suspension_history WHERE user_id = $1 OR suspended_by = $1', [userId]);
        await client.query('DELETE FROM user_active_status WHERE user_id = $1', [userId]);

        const orderIds = await client.query('SELECT id FROM orders WHERE buyer_id = $1', [userId]);
        const orderIdList = orderIds.rows.map(row => row.id);
        if (orderIdList.length > 0) {
            await client.query('DELETE FROM order_items WHERE order_id = ANY($1::int[])', [orderIdList]);
        }
        await client.query('DELETE FROM orders WHERE buyer_id = $1', [userId]);

        const mktProductIds = await client.query('SELECT id FROM marketplaceproducts WHERE seller_id = $1', [userId]);
        const mktProductIdList = mktProductIds.rows.map(row => row.id);
        if (mktProductIdList.length > 0) {
            // Use purchased_item_id for order_items
            await client.query('DELETE FROM order_items WHERE purchased_item_id = ANY($1::int[])', [mktProductIdList]);
            await client.query('DELETE FROM userowned WHERE product_id = ANY($1::int[])', [mktProductIdList]);
            await client.query('DELETE FROM clothestag WHERE product_id = ANY($1::int[])', [mktProductIdList]);
        }

        await client.query('DELETE FROM marketplaceproducts WHERE seller_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');
        res.send('User deleted');
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message || 'Error deleting user');
    } finally {
        client.release();
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

    if (!seller_id || !title || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Step 1: Insert the product into the database
    const newProductQuery = `
      INSERT INTO marketplaceproducts (seller_id, title, description, price, category, size, image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *;
    `;
    const values = [parseInt(seller_id, 10), title, description, price, category, size, image_url];
    const result = await db.query(newProductQuery, values);
    const newProduct = result.rows[0];

    // Step 2: Immediately respond to the user
    res.status(201).json(newProduct);

    // Step 3: Asynchronously analyze sustainability using title and description
    analyzeSustainabilityByText(title, description)
      .then(sustainabilityData => {
        if (sustainabilityData && sustainabilityData.score) {
          console.log(`AI Sustainability Score for product #${newProduct.id}: ${sustainabilityData.score}/10`);
          
          // Save to product_sustainability table
          const insertQuery = `
            INSERT INTO product_sustainability (product_id, score, analysis_text)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id) DO UPDATE SET score = $2, analysis_text = $3
          `;
          
          return db.query(insertQuery, [newProduct.id, sustainabilityData.score, sustainabilityData.analysis]);
        }
      })
      .then(() => {
        // Broadcast the update to all clients
        return db.query('SELECT * FROM marketplaceproducts WHERE id = $1', [newProduct.id]);
      })
      .then(updatedResult => {
        if (updatedResult && updatedResult.rows.length > 0) {
          broadcast({
            type: 'PRODUCT_SCORE_UPDATE',
            product: updatedResult.rows[0]
          });
        }
      })
      .catch(err => console.error(`Sustainability analysis failed for product #${newProduct.id}:`, err));

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
    const { excludeUserId, status, seller_id, category, search, sort } = req.query;

    try {
        const queryParams = [];
        const whereClauses = [];

        // Filter: status (default to 'available')
        if (status) {
            whereClauses.push(`p.status = $${queryParams.length + 1}`);
            queryParams.push(status.toLowerCase());
        } else {
            whereClauses.push(`p.status = $${queryParams.length + 1}`);
            queryParams.push('available');
        }

        // Filter: exclude seller's own items
        if (excludeUserId) {
            whereClauses.push(`p.seller_id != $${queryParams.length + 1}`);
            queryParams.push(excludeUserId);
        }

        // Filter: specific seller
        if (seller_id) {
            whereClauses.push(`p.seller_id = $${queryParams.length + 1}`);
            queryParams.push(seller_id);
        }

        // Filter: category
        if (category && category !== 'All Categories') {
            whereClauses.push(`p.category = $${queryParams.length + 1}`);
            queryParams.push(category);
        }

        // Filter: search keyword in title
        if (search) {
            whereClauses.push(`p.title ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${search}%`);
        }

        // Determine ORDER BY clause based on sort option
        let orderByClause = 'ORDER BY p.created_at DESC'; // Default
        if (sort === 'PriceLowToHigh') {
            orderByClause = 'ORDER BY p.price ASC';
        } else if (sort === 'PriceHighToLow') {
            orderByClause = 'ORDER BY p.price DESC';
        }

        const getProductsQuery = `
            SELECT p.*, u.username AS seller_name
            FROM marketplaceproducts p
            LEFT JOIN users u ON p.seller_id = u.id
            ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
            ${orderByClause};
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

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const orderQuery = `
            INSERT INTO orders (buyer_id, total_price, delivery_method, shipping_fee, user_order_id)
            VALUES ($1, $2, $3, $4, (SELECT COUNT(*) FROM orders WHERE buyer_id = $1) + 1)
            RETURNING id;
        `;
        const orderResult = await client.query(orderQuery, [userId, totalPrice, deliveryMethod, shippingFee]);
        const newOrderId = orderResult.rows[0].id;

        let totalSustainabilityPoints = 0;
        for (const item of items) {
            const orderItemQuery = `
                INSERT INTO order_items (order_id, purchased_item_id, item_type, price_at_purchase)
                VALUES ($1, $2, $3, $4);
            `;
            await client.query(orderItemQuery, [newOrderId, item.id, item.type, item.price]);

            if (item.type === 'marketplace') {
                const updateMarketplaceQuery = `UPDATE marketplaceproducts SET status = 'sold' WHERE id = $1 AND status = 'available';`;
                const result = await client.query(updateMarketplaceQuery, [item.id]);
                if (result.rowCount === 0) throw new Error(`Marketplace item "${item.name}" is no longer available.`);
                await client.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, item.id]);
                
                const sustainabilityResult = await client.query('SELECT score FROM product_sustainability WHERE product_id = $1', [item.id]);
                if (sustainabilityResult.rows.length > 0) {
                    totalSustainabilityPoints += sustainabilityResult.rows[0].score * 10;
                }
            } else if (item.type === 'shop') {
                const updateShopQuery = `UPDATE product_variants SET stock_amt = stock_amt - 1 WHERE id = $1 AND stock_amt > 0;`;
                const result = await client.query(updateShopQuery, [item.id]);
                if (result.rowCount === 0) throw new Error(`Shop item "${item.name} (${item.size})" is out of stock.`);
                await client.query('DELETE FROM shop_cart_items WHERE user_id = $1 AND variant_id = $2', [userId, item.id]);
            }
        }

        if (totalSustainabilityPoints > 0) {
            await client.query(`INSERT INTO user_sustainability_points (user_id, points) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET points = user_sustainability_points.points + $2`, [userId, totalSustainabilityPoints]);
            await client.query(`INSERT INTO sustainability_points_history (user_id, points_change, reason, order_id) VALUES ($1, $2, $3, $4)`, [userId, totalSustainabilityPoints, 'Points earned from sustainable purchase', newOrderId]);
        }

        await client.query('COMMIT');
        
        // --- START: PDF Generation and Emailing Logic ---
        
        // 1. Get user's email for the receipt
        const userResult = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
        const userEmail = userResult.rows[0]?.email;

        // 2. Prepare details for PDF and generate it
        const subtotal = items.reduce((total, item) => total + parseFloat(item.displayPrice), 0);
        const receiptPath = await generateReceiptPdf(newOrderId, { items, subtotal, shippingFee, totalPrice });

        // 3. Send email with PDF attachment (if email exists)
        if (userEmail) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `Your EcoThrift Order Receipt #${newOrderId}`,
                text: 'Thank you for your purchase! Please find your receipt attached.',
                attachments: [{
                    filename: `receipt-${newOrderId}.pdf`,
                    path: receiptPath,
                    contentType: 'application/pdf'
                }]
            };
            // Send email but don't wait for it. Let it run in the background.
            // Log errors but don't let it crash the main request.
            transporter.sendMail(mailOptions).catch(err => {
                console.error(`Failed to send receipt email for order ${newOrderId}:`, err);
            });
        } else {
            console.warn(`Could not find email for user ID ${userId} to send receipt.`);
        }

        // --- END: PDF and Emailing Logic ---

        // 4. Send the SINGLE, correct response to the frontend
        const receiptUrl = `${req.protocol}://${req.get('host')}/invoices/receipt-${newOrderId}.pdf`;
        res.status(201).json({ 
            message: 'Order created successfully!', 
            orderId: newOrderId,
            sustainabilityPointsEarned: totalSustainabilityPoints,
            receiptUrl: receiptUrl // Include the URL for the success page
        });

        // 5. Simulate delivery process in the background
        simulateDelivery(newOrderId);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating unified order:', err.message);
        res.status(500).json({ error: err.message || 'Server error while creating order.' });
    } finally {
        client.release();
    }
});

app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

/**
 * @route   GET /api/orders/:userId
 * @desc    Get all orders for a specific user
 * @access  Private
 */
app.get('/api/orders/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // This query fetches the basic order details. We will fetch the images separately.
        const ordersQuery = `
            SELECT id, user_order_id, total_price, ordered_at, delivered_at, shipped_at, review_completed_at
            FROM orders
            WHERE buyer_id = $1
            ORDER BY ordered_at DESC;
        `;
        const { rows: orders } = await db.query(ordersQuery, [userId]);

        // Now, for each order, fetch the corresponding product images
        for (const order of orders) {
            const itemsQuery = `SELECT purchased_item_id, item_type FROM order_items WHERE order_id = $1`;
            const { rows: items } = await db.query(itemsQuery, [order.id]);
            
            const images = [];
            for (const item of items) {
                let imageResult;
                if (item.item_type === 'marketplace') {
                    imageResult = await db.query(
                        'SELECT image_url FROM marketplaceproducts WHERE id = $1', 
                        [item.purchased_item_id]
                    );
                    // Marketplace image_url is already an array
                    if (imageResult.rows.length > 0 && imageResult.rows[0].image_url) {
                        images.push(imageResult.rows[0].image_url[0]);
                    }
                } else if (item.item_type === 'shop') {
                    imageResult = await db.query(
                        `SELECT p.image_urls
                         FROM products p
                         JOIN product_variants pv ON p.id = pv.product_id
                         WHERE pv.id = $1`,
                        [item.purchased_item_id]
                    );
                    // Shop image_urls might be a string or array, so we handle both
                    if (imageResult.rows.length > 0 && imageResult.rows[0].image_urls) {
                        const urls = imageResult.rows[0].image_urls;
                        if (Array.isArray(urls) && urls.length > 0) {
                            images.push(urls[0]);
                        } else if (typeof urls === 'string') {
                            images.push(urls.split(',')[0]);
                        }
                    }
                }
            }
            // Attach the collected images to the order object
            order.product_images = images;
        }

        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching unified orders:', err.message);
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
        const orderQuery = `SELECT *, user_order_id FROM orders WHERE id = $1;`;
        const orderResult = await db.query(orderQuery, [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        const orderSummary = orderResult.rows[0];

        const itemsQuery = `SELECT * FROM order_items WHERE order_id = $1;`;
        const itemsResult = await db.query(itemsQuery, [orderId]);
        
        const lineItems = [];
        for (const item of itemsResult.rows) {
            if (item.item_type === 'marketplace') {
                const productRes = await db.query(
                    'SELECT title, size, image_url, seller_id FROM marketplaceproducts WHERE id = $1', 
                    [item.purchased_item_id]
                );
                if (productRes.rows.length > 0) {
                    // For marketplace items, the name is 'title'
                    lineItems.push({ ...item, ...productRes.rows[0], name: productRes.rows[0].title });
                }
            } else if (item.item_type === 'shop') {
                // THIS IS THE CRUCIAL FIX: We now fetch p.id as product_id
                const productRes = await db.query(
                    `SELECT p.id as product_id, p.product_name, p.image_urls, pv.size 
                     FROM products p
                     JOIN product_variants pv ON p.id = pv.product_id
                     WHERE pv.id = $1`,
                    [item.purchased_item_id]
                );
                if (productRes.rows.length > 0) {
                    const details = productRes.rows[0];
                    // For shop items, the name is 'product_name'
                    lineItems.push({
                        ...item,
                        ...details,
                        name: details.product_name,
                        image_url: details.image_urls
                    });
                }
            }
        }

        res.status(200).json({ summary: orderSummary, items: lineItems });

    } catch (err) {
        console.error('Error fetching unified order details:', err.message);
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
    // Get the optional 'status' from the query parameters (e.g., ?status=available)
    const { status } = req.query;

    try {
        let query;
        const queryParams = [parseInt(userId, 10)];

        // === THIS IS THE FIX ===
        // We dynamically build the SQL query based on the presence of the 'status' parameter.
        if (status && status !== 'all') {
            // If a specific status is requested, add a WHERE clause for it.
            query = `
                SELECT * FROM marketplaceproducts
                WHERE seller_id = $1 AND status = $2
                ORDER BY created_at DESC;
            `;
            queryParams.push(status);
        } else {
            // If status is 'all' or not provided, fetch all listings for the user.
            query = `
                SELECT * FROM marketplaceproducts
                WHERE seller_id = $1
                ORDER BY created_at DESC;
            `;
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching user listings:', err.message);
        res.status(500).json({ error: 'Server error while fetching listings.' });
    }
});
// ===============================================

// jun hong's codes (marketplace_reviews GET and POST method)
// =================================================================
//  ===>  REVIEW MANAGEMENT ROUTES <===
// =================================================================

/**
 * @route   POST /api/reviews
 * @desc    Submit a new review for an order
 * @access  Private
 */
app.post('/api/reviews', async (req, res) => {
    const { orderId, buyerId, sellerId, rating, comment } = req.body;

    if (!orderId || !buyerId || !sellerId || !rating) {
        return res.status(400).json({ error: 'Missing required review information.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert the new review
        const reviewQuery = `
            INSERT INTO marketplace_reviews (order_id, buyer_id, seller_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const reviewResult = await client.query(reviewQuery, [orderId, buyerId, sellerId, rating, comment]);

        // 2. Update the order's timeline
        const updateOrderQuery = `
            UPDATE orders SET review_completed_at = NOW() WHERE id = $1;
        `;
        await client.query(updateOrderQuery, [orderId]);

        await client.query('COMMIT');
        res.status(201).json(reviewResult.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'A review for this order has already been submitted.' });
        }
        console.error('Error submitting review:', err.message);
        res.status(500).json({ error: 'Server error while submitting review.' });
    } finally {
        client.release();
    }
});

/**
 * @route   GET /api/reviews/seller/:sellerId
 * @desc    Get all reviews for a specific seller
 * @access  Public
 */
app.get('/api/reviews/seller/:sellerId', async (req, res) => {
    const { sellerId } = req.params;
    try {
        const query = `
            SELECT r.rating, r.comment, r.created_at, u.username AS buyer_username
            FROM marketplace_reviews r
            JOIN users u ON r.buyer_id = u.id
            WHERE r.seller_id = $1
            ORDER BY r.created_at DESC;
        `;
        const { rows } = await db.query(query, [sellerId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching seller reviews:', err.message);
        res.status(500).json({ error: 'Server error while fetching reviews.' });
    }
});

app.post('/api/unified-reviews', async (req, res) => {
    const { orderId, userId, rating, comment, itemType, productId, sellerId } = req.body;

    if (!orderId || !userId || !rating || !itemType || !productId) {
        return res.status(400).json({ error: 'Missing required review information.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        if (itemType === 'shop') {
            await client.query(
                `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)`,
                [productId, userId, rating, comment]
            );
        } else if (itemType === 'marketplace') {
            if (!sellerId) {
                return res.status(400).json({ error: 'Seller ID is required for marketplace reviews.' });
            }
            await client.query(
                `INSERT INTO marketplace_reviews (order_id, buyer_id, seller_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`,
                [orderId, userId, sellerId, rating, comment]
            );
        } else {
            throw new Error('Invalid item type for review.');
        }

        await client.query(
            `UPDATE orders SET review_completed_at = NOW() WHERE id = $1 AND buyer_id = $2`,
            [orderId, userId]
        );

        await client.query('COMMIT');

        // --- NEW CODE: Broadcast a specific message after successful review ---
        broadcast({
            type: 'REVIEW_SUBMITTED',
            orderId: parseInt(orderId, 10)
        });
        
        res.status(201).json({ message: 'Review submitted successfully!' });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(409).json({ error: 'You have already submitted a review for this item.' });
        }
        console.error('Error submitting unified review:', err);
        res.status(500).json({ error: 'Server error while submitting review.' });
    } finally {
        client.release();
    }
});

// ===============================================

// jun hong's codes (sustainability endpoints)

// Sustainability endpoints
app.post('/api/analyze-sustainability', async (req, res) => {
    const { image_url, product_id } = req.body;
    console.log("🚀 Analyzing product", product_id, "with image:", image_url);
    
    if (!image_url || !product_id) {
        return res.status(400).json({ error: "Image URL and product ID are required" });
    }

    try {
        // Call Google Gemini API to analyze sustainability
        const sustainabilityData = await analyzeSustainability(image_url);
        
        // Save to database
        await db.query(
            `INSERT INTO product_sustainability (product_id, score, analysis_text)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id) DO UPDATE SET score = $2, analysis_text = $3`,
            [product_id, sustainabilityData.score, sustainabilityData.analysis]
        );

        res.json({ score: sustainabilityData.score, analysis: sustainabilityData.analysis });
    } catch (err) {
        console.error("Sustainability analysis error:", err);
        res.status(500).json({ error: "Failed to analyze sustainability" });
    }
});

app.get('/api/user-points/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT points FROM user_sustainability_points WHERE user_id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            // Initialize with 0 points if user doesn't have a record
            await db.query(
                'INSERT INTO user_sustainability_points (user_id, points) VALUES ($1, 0)',
                [userId]
            );
            return res.json({ points: 0 });
        }
        res.json({ points: result.rows[0].points });
    } catch (err) {
        console.error("Error fetching user points:", err);
        res.status(500).json({ error: "Failed to fetch points" });
    }
});

app.get('/api/vouchers', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vouchers WHERE is_active = TRUE ORDER BY points_cost'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching vouchers:", err);
        res.status(500).json({ error: "Failed to fetch vouchers" });
    }
});

app.post('/api/redeem-voucher', async (req, res) => {
    const { userId, voucherId } = req.body;
    
    if (!userId || !voucherId) {
        return res.status(400).json({ error: "User ID and voucher ID are required" });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Get voucher details
        const voucherResult = await client.query(
            'SELECT * FROM vouchers WHERE id = $1 AND is_active = TRUE',
            [voucherId]
        );
        if (voucherResult.rows.length === 0) {
            return res.status(404).json({ error: "Voucher not found or inactive" });
        }
        const voucher = voucherResult.rows[0];
        
        // Check user has enough points
        const userPointsResult = await client.query(
            'SELECT points FROM user_sustainability_points WHERE user_id = $1 FOR UPDATE',
            [userId]
        );
        if (userPointsResult.rows.length === 0 || userPointsResult.rows[0].points < voucher.points_cost) {
            return res.status(400).json({ error: "Not enough sustainability points" });
        }
        
        // Deduct points
        await client.query(
            'UPDATE user_sustainability_points SET points = points - $1 WHERE user_id = $2',
            [voucher.points_cost, userId]
        );
        
        // Add voucher to user
        await client.query(
            'INSERT INTO user_vouchers (user_id, voucher_id) VALUES ($1, $2)',
            [userId, voucherId]
        );
        
        // Record points transaction
        await client.query(
            'INSERT INTO sustainability_points_history (user_id, points_change, reason) VALUES ($1, $2, $3)',
            [userId, -voucher.points_cost, `Redeemed voucher: ${voucher.code}`]
        );
        
        await client.query('COMMIT');
        res.json({ success: true, voucher: voucher.code });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Voucher redemption error:", err);
        res.status(500).json({ error: "Failed to redeem voucher" });
    } finally {
        client.release();
    }
});

app.get('/api/user-vouchers/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            `SELECT uv.*, v.code, v.discount_percent, v.points_cost 
             FROM user_vouchers uv
             JOIN vouchers v ON uv.voucher_id = v.id
             WHERE uv.user_id = $1`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user vouchers:", err);
        res.status(500).json({ error: "Failed to fetch vouchers" });
    }
});

app.patch('/api/user-vouchers/:voucherId', async (req, res) => {
    const { voucherId } = req.params;
    const { is_active } = req.body;
    const userId = req.query.userId;
    
    if (is_active === undefined || !userId) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const result = await db.query(
            'UPDATE user_vouchers SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [is_active, voucherId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Voucher not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating voucher:", err);
        res.status(500).json({ error: "Failed to update voucher" });
    }
});


app.get('/api/product-sustainability/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const result = await db.query(
            'SELECT score, analysis_text FROM product_sustainability WHERE product_id = $1',
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sustainability score not found" });
        }

        res.json({
            score: result.rows[0].score,
            analysis: result.rows[0].analysis_text
        });
    } catch (err) {
        console.error("Error fetching sustainability score:", err);
        res.status(500).json({ error: "Failed to fetch sustainability score" });
    }
});

app.post('/api/analyze-all-products-sustainability', async (req, res) => {
    try {
        // Get all products without sustainability scores
        const productsResult = await db.query(`
            SELECT mp.* FROM marketplaceproducts mp
            LEFT JOIN product_sustainability ps ON mp.id = ps.product_id
            WHERE ps.product_id IS NULL AND mp.status != 'sold'
        `);

        const products = productsResult.rows;
        let analyzed = 0;

        for (const product of products) {
            try {
                const sustainabilityData = await analyzeSustainabilityByText(
                    product.title, 
                    product.description
                );

                if (sustainabilityData && sustainabilityData.score) {
                    await db.query(
                        `INSERT INTO product_sustainability (product_id, score, analysis_text)
                         VALUES ($1, $2, $3)`,
                        [product.id, sustainabilityData.score, sustainabilityData.analysis]
                    );
                    analyzed++;
                }
            } catch (err) {
                console.error(`Failed to analyze product ${product.id}:`, err);
            }
        }

        res.json({ 
            message: `Analyzed ${analyzed} out of ${products.length} products`,
            totalAnalyzed: analyzed 
        });
    } catch (err) {
        console.error("Error in bulk analysis:", err);
        res.status(500).json({ error: "Failed to analyze products" });
    }
});


// ===========================================

// =================================================================
//  ===> PRODUCT & VARIANT CRUD OPERATIONS (NEWEST SCHEMA) <===
// =================================================================

// GET all products with their variants, now with category filtering
app.get('/api/products', async (req, res) => {
    const { search, category, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let whereClauses = [];
        let queryParams = [];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(p.product_name ILIKE $${queryParams.length} OR p.product_description ILIKE $${queryParams.length})`);
        }
        
        // Added filtering for the new 'categories' column
        if (category) {
            queryParams.push(`%${category}%`);
            whereClauses.push(`p.categories ILIKE $${queryParams.length}`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // The query now omits 'product_colour' from the variant details
        const query = `
            SELECT
                p.*,
                SUM(pv.stock_amt) AS total_stock,
                json_agg(json_build_object(
                    'variant_id', pv.id,
                    'size', pv.size,
                    'price', pv.price,
                    'stock', pv.stock_amt,
                    'status', pv.status,                   -- ADDED THIS LINE
                    'scheduled_date', pv.scheduled_date   -- ADDED THIS LINE
                )) AS variants
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            ${whereString}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT $${queryParams.length + 1}
            OFFSET $${queryParams.length + 2};
        `;
        
        const countQuery = `SELECT COUNT(*) FROM products p ${whereString};`;

        const finalQueryParams = [...queryParams, limit, offset];

        const productsResult = await db.query(query, finalQueryParams);
        const countResult = await db.query(countQuery, queryParams);

        const totalProducts = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

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

// GET a single product by ID, including all its variants
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const variantsResult = await db.query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY size', [id]);
        
        const product = productResult.rows[0];
        product.variants = variantsResult.rows;

        res.json(product);
    } catch (err) {
        console.error(`Error fetching product ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// POST a new product, now including 'categories' and excluding 'product_colour' from variants
app.post('/api/products', async (req, res) => {
    const { product_name, product_description, product_material, image_urls, categories, variants } = req.body;

    if (!product_name || !variants || !Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ error: 'Product name and at least one variant are required.' });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Insert the core product, now with the 'categories' field
        const productQuery = `
            INSERT INTO products (product_name, product_description, product_material, image_urls, categories)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        const productResult = await client.query(productQuery, [product_name, product_description, product_material, image_urls, categories]);
        const newProductId = productResult.rows[0].id;

        // Loop and insert variants, now without 'product_colour'
        for (const variant of variants) {
            const variantQuery = `
                INSERT INTO product_variants (product_id, size, price, stock_amt, status)
                VALUES ($1, $2, $3, $4, $5);
            `;
            await client.query(variantQuery, [
                newProductId,
                variant.size,
                variant.price,
                variant.stock_amt || 0,
                variant.status || 'active'
            ]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Product created successfully', productId: newProductId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding new product:', err.message);
        res.status(500).json({ error: 'Server error while creating product', details: err.message });
    } finally {
        client.release();
    }
});

// PUT (Update) an existing product's description ONLY
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { product_description } = req.body;

    if (product_description === undefined) {
        return res.status(400).json({ error: 'product_description is required.' });
    }

    try {
        const result = await db.query(
            `UPDATE products SET product_description = $1 WHERE id = $2 RETURNING *`,
            [product_description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating product ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// NEW: Add this endpoint to handle price updates
app.put('/api/products/:id/price', async (req, res) => {
    const { id: productId } = req.params;
    const { price } = req.body;

    if (price === undefined || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'A valid price is required.' });
    }

    try {
        const result = await db.query(
            `UPDATE product_variants SET price = $1 WHERE product_id = $2 RETURNING *`,
            [parseFloat(price), productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No variants found for this product.' });
        }
        
        res.json({ message: `Price updated for ${result.rowCount} variants.` });
    } catch (err) {
        console.error(`Error updating price for product ${productId}:`, err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// DELETE a product and its variants (via ON DELETE CASCADE)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product and all its variants deleted successfully', deletedProduct: result.rows[0] });
    } catch (err) {
        console.error(`Error deleting product ${id}:`, err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/products/:productId/discounts', async (req, res) => {
    const { productId } = req.params;
    const { variants } = req.body; // Expects an array of { variant_id, discount_price }

    if (!variants || !Array.isArray(variants)) {
        return res.status(400).json({ error: 'A valid variants array is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // --- Step 1: Get PRE-UPDATE state for notification logic ---
        const oldVariantsState = await client.query(
            'SELECT id, price, discount_price FROM product_variants WHERE product_id = $1', 
            [productId]
        );
        
        // Check if a discount is being newly applied (was null, now has a price)
        const wasPreviouslyOnSale = oldVariantsState.rows.some(v => v.discount_price !== null);
        const isNowOnSale = variants.some(v => v.discount_price !== null && v.discount_price !== '');
        const shouldSendNotification = !wasPreviouslyOnSale && isNowOnSale;

        // --- Step 2: Update all variants in the database ---
        for (const variant of variants) {
            let finalDiscountPrice = null;
            if (variant.discount_price !== null && variant.discount_price !== undefined && variant.discount_price !== '') {
                finalDiscountPrice = parseFloat(variant.discount_price);
            }
            await client.query(
                'UPDATE product_variants SET discount_price = $1 WHERE id = $2 AND product_id = $3',
                [finalDiscountPrice, variant.variant_id, productId]
            );
        }

        await client.query('COMMIT');
        
        // --- Step 3: Send response to staff immediately ---
        res.status(200).json({ message: 'Discounts updated successfully.' });

        // --- Step 4: Asynchronous Email Notification Logic (if needed) ---
        if (shouldSendNotification) {
            console.log(`New discount applied to product ${productId}. Notifying users...`);

            // Get product name and user emails in parallel
            const [productInfo, usersToNotify] = await Promise.all([
                db.query('SELECT product_name FROM products WHERE id = $1', [productId]),
                db.query('SELECT u.email FROM users u JOIN wishlist_items w ON u.id = w.user_id WHERE w.product_id = $1', [productId])
            ]);

            if (usersToNotify.rows.length > 0 && productInfo.rows.length > 0) {
                const productName = productInfo.rows[0].product_name;

                // Find the lowest original price and lowest new discount price to show in the email
                const originalPrice = Math.min(...oldVariantsState.rows.map(v => parseFloat(v.price)));
                const newDiscountPrice = Math.min(...variants.filter(v => v.discount_price).map(v => parseFloat(v.discount_price)));

                console.log(`Found ${usersToNotify.rows.length} users. Notifying about "${productName}"...`);
                
                for (const user of usersToNotify.rows) {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: user.email,
                        subject: `Price Drop Alert! An item on your wishlist is on sale!`,
                        html: `
                            <p>Great news! An item on your EcoThrift wishlist, <strong>${productName}</strong>, is now on sale.</p>
                            <p>It's now available from just <strong>$${newDiscountPrice.toFixed(2)}</strong> (was $${originalPrice.toFixed(2)}).</p>
                            <p>Check it out before it's gone!</p>
                        `
                    };
                    transporter.sendMail(mailOptions).catch(err => {
                        console.error(`Failed to send email to ${user.email}:`, err);
                    });
                }
            }
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error updating discounts for product ${productId}:`, err);
        res.status(500).json({ error: 'Server error', details: err.message });
    } finally {
        client.release();
    }
});

// =================================================================
//  ===> REVIEW CRUD OPERATIONS (Updated for New Schema) <===
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
        // Check if the product exists in the new 'products' table.
        const productExists = await db.query('SELECT id FROM products WHERE id = $1', [product_id]);
        if (productExists.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        
        // Check if the user exists.
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
// This endpoint remains the same as it was already correctly structured.
app.get('/api/products/:product_id/reviews', async (req, res) => {
    const { product_id } = req.params;
    try {
        // Join with users table to get reviewer's username/name if needed
        const result = await db.query(
            `SELECT r.*, u.username AS reviewer_username, u.firstname AS reviewer_firstname
             FROM reviews r
             JOIN users u ON r.user_id = u.id
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
// This endpoint remains the same.
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
// This endpoint remains the same.
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
//  ===> VARIANT STOCK MANAGEMENT / INVENTORY (FIXED) <===
// =================================================================

// Update stock for a specific product VARIANT (handles immediate and scheduled)
app.put('/api/variants/:variantId/stock', async (req, res) => {
    const { variantId } = req.params;
    const { stock_amt, scheduled_stock_amount, scheduled_date } = req.body;

    // Handle IMMEDIATE stock update
    if (stock_amt !== undefined) {
        if (isNaN(parseInt(stock_amt))) {
            return res.status(400).json({ error: 'A valid stock amount is required.' });
        }
        try {
            const result = await db.query(
                `UPDATE product_variants SET stock_amt = $1 WHERE id = $2 RETURNING *;`,
                [parseInt(stock_amt, 10), variantId]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Product variant not found.' });
            return res.json(result.rows[0]);
        } catch (err) {
            console.error(`Error updating stock for variant ${variantId}:`, err);
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
    }

    // Handle SCHEDULED stock update
    if (scheduled_stock_amount !== undefined && scheduled_date !== undefined) {
        if (isNaN(parseInt(scheduled_stock_amount))) {
            return res.status(400).json({ error: 'A valid scheduled stock amount is required.' });
        }
        try {
            // FIX: Changed 'scheduled_stock_amount' to 'scheduled_stockamt' to match the database schema.
            const result = await db.query(
                `UPDATE product_variants
                 SET scheduled_stockamt = $1, scheduled_date = $2, status = 'scheduled'
                 WHERE id = $3 RETURNING *;`,
                [parseInt(scheduled_stock_amount, 10), scheduled_date, variantId]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Product variant not found.' });
            return res.json(result.rows[0]);
        } catch (err) {
            console.error('Error scheduling stock update for variant:', err);
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
    }
    
    // If neither block runs, the request is invalid.
    return res.status(400).json({ error: 'Invalid request. Provide either stock_amt for an immediate update or scheduled_stock_amount and scheduled_date for a scheduled update.' });
});

// =================================================================
//  ===> CUSTOMER-FACING SHOP ROUTES (CORRECTED) <===
// =================================================================

app.get('/api/shop/products', async (req, res) => {
    const { category, search, page = 1, limit = 9, minPrice, maxPrice, onSale, sortBy } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryParams = [];
    let whereClauses = ["p.id IN (SELECT product_id FROM product_variants WHERE status = 'active')"];

    if (category) {
        queryParams.push(category);
        whereClauses.push(`p.categories ILIKE $${queryParams.length}`);
    }
    if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(`(p.product_name ILIKE $${queryParams.length} OR p.product_description ILIKE $${queryParams.length})`);
    }
    if (minPrice && maxPrice) {
        queryParams.push(minPrice, maxPrice);
        whereClauses.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price BETWEEN $${queryParams.length - 1} AND $${queryParams.length})`);
    }
    if (onSale === 'true') {
        whereClauses.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.discount_price IS NOT NULL)`);
    }

    const whereString = `WHERE ${whereClauses.join(' AND ')}`;
    
    let orderByString = 'ORDER BY p.created_at DESC';
    if (sortBy === 'newest') {
        orderByString = 'ORDER BY p.created_at DESC';
    }

    const dataQuery = `
        SELECT 
            p.*,
            (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active') as price,
            (SELECT MIN(pv.discount_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active') as discount_price,
            -- NEW: Calculate average rating for each product
            COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) as average_rating
        FROM products p
        ${whereString}
        ${orderByString}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const countQuery = `SELECT COUNT(p.id) FROM products p ${whereString}`;

    try {
        const productsResult = await db.query(dataQuery, dataParams);
        const countResult = await db.query(countQuery, queryParams);
        const totalProducts = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));
        res.json({ products: productsResult.rows, totalProducts, totalPages, currentPage: parseInt(page) });
    } catch (err) {
        console.error('Error fetching shop products:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/shop/product/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT p.*, COALESCE((SELECT json_agg(pv.* ORDER BY pv.size) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active'), '[]'::json) AS variants
            FROM products p WHERE p.id = $1;
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error fetching shop product with ID ${id}:`, err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- WISHLIST MANAGEMENT ROUTES (Correct and Unchanged) ---
app.get('/api/wishlist/ids/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { rows } = await db.query('SELECT product_id FROM wishlist_items WHERE user_id = $1', [userId]);
        res.status(200).json(rows.map(row => row.product_id));
    } catch (err) {
        console.error('Error fetching wishlist IDs:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
app.get('/api/wishlist/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // THIS QUERY IS NOW UPGRADED to include average_rating
        const query = `
            SELECT 
                p.*,
                w.note, -- Include the user's note for the item
                (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active') as price,
                (SELECT MIN(pv.discount_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active') as discount_price,
                COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) as average_rating
            FROM products p
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
app.post('/api/wishlist', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'User ID and Product ID are required.' });
    try {
        const { rows } = await db.query('INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) RETURNING *;', [userId, productId]);
        res.status(201).json({ message: 'Item added to wishlist.', item: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Item is already in the wishlist.' });
        console.error('Error adding to wishlist:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
app.delete('/api/wishlist', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'User ID and Product ID are required.' });
    try {
        const result = await db.query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2;', [userId, productId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Item not found in wishlist.' });
        res.status(200).json({ message: 'Item removed from wishlist.' });
    } catch (err) {
        console.error('Error removing from wishlist:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/wishlist/note', async (req, res) => {
    const { userId, productId, note } = req.body;
    if (!userId || productId === undefined) {
        return res.status(400).json({ error: 'User ID and Product ID are required.' });
    }

    try {
        const query = `
            UPDATE wishlist_items 
            SET note = $1 
            WHERE user_id = $2 AND product_id = $3
            RETURNING *;
        `;
        const { rows } = await db.query(query, [note || null, userId, productId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in wishlist.' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error updating wishlist note:', err.message);
        res.status(500).json({ error: 'Server error while updating note.' });
    }
});

app.get('/api/shop/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                sci.quantity,
                pv.id AS variant_id,
                pv.size,
                pv.price,
                pv.discount_price, -- <-- THIS IS THE NEWLY ADDED FIELD
                p.id AS product_id,
                p.product_name,
                p.image_urls
            FROM shop_cart_items sci
            JOIN product_variants pv ON sci.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE sci.user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching shop cart:', err.message);
        res.status(500).json({ error: 'Server error while fetching shop cart.' });
    }
});

app.post('/api/shop/cart', async (req, res) => {
    const { userId, variantId, quantity = 1 } = req.body;
    if (!userId || !variantId) {
        return res.status(400).json({ error: 'User ID and Variant ID are required.' });
    }
    try {
        const query = `
            INSERT INTO shop_cart_items (user_id, variant_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, variant_id)
            DO UPDATE SET quantity = shop_cart_items.quantity + $3
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId, variantId, quantity]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error adding to shop cart:', err.message);
        res.status(500).json({ error: 'Server error while adding to shop cart.' });
    }
});

app.delete('/api/shop/cart/:userId/:variantId', async (req, res) => {
    const { userId, variantId } = req.params;
    try {
        const query = `DELETE FROM shop_cart_items WHERE user_id = $1 AND variant_id = $2;`;
        await db.query(query, [userId, variantId]);
        res.status(200).json({ message: 'Item removed from shop cart.' });
    } catch (err) {
        console.error('Error removing from shop cart:', err.message);
        res.status(500).json({ error: 'Server error while removing from shop cart.' });
    }
});

app.post('/api/create-payment-intent', async (req, res) => {
    // NEW: Accept voucherId and userId from the request
    const { items, deliveryMethod, voucherId, userId } = req.body;
    const SHIPPING_FEE = 5.00;

    try {
        // --- SECURE SERVER-SIDE CALCULATION ---
        let subtotal = items.reduce((total, item) => total + parseFloat(item.displayPrice), 0);
        let discountAmount = 0;

        // --- SECURE VOUCHER VALIDATION ---
        if (voucherId && userId) {
            // 1. Check if the user actually owns this active voucher
            const voucherRes = await db.query(
                `SELECT v.* 
                 FROM user_vouchers uv
                 JOIN vouchers v ON uv.voucher_id = v.id
                 WHERE uv.id = $1 AND uv.user_id = $2 AND uv.is_active = TRUE`,
                [voucherId, userId]
            );
            
            if (voucherRes.rows.length > 0) {
                const voucher = voucherRes.rows[0];
                // 2. Calculate the discount securely on the server
                discountAmount = (subtotal * voucher.discount_percent / 100);
            } else {
                console.warn(`User ${userId} attempted to use invalid or inactive voucher ${voucherId}.`);
            }
        }
        
        const shippingFee = deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0;
        // 3. Calculate the final total on the server
        const finalTotal = subtotal - discountAmount + shippingFee;

        // 4. Ensure the final amount is not negative and is at least 50 cents (Stripe's minimum)
        const totalAmountInCents = Math.max(50, Math.round(finalTotal * 100));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmountInCents,
            currency: 'usd', // or your currency
        });

        res.send({ clientSecret: paymentIntent.client_secret });

    } catch (e) {
        console.error("Error creating payment intent:", e.message);
        res.status(500).send({ error: { message: "Failed to create payment intent." } });
    }
});

app.post('/api/paypal/create-order', async (req, res) => {
    // ENHANCEMENT: Accept voucherId and userId to correctly calculate the total
    const { items, deliveryMethod, voucherId, userId } = req.body;
    const SHIPPING_FEE = 5.00;

    try {
        // --- SECURE SERVER-SIDE CALCULATION (Same as Stripe) ---
        let subtotal = items.reduce((total, item) => total + parseFloat(item.displayPrice), 0);
        let discountAmount = 0;

        // --- SECURE VOUCHER VALIDATION (Same as Stripe) ---
        if (voucherId && userId) {
            const voucherRes = await db.query(
                `SELECT v.* 
                 FROM user_vouchers uv
                 JOIN vouchers v ON uv.voucher_id = v.id
                 WHERE uv.id = $1 AND uv.user_id = $2 AND uv.is_active = TRUE`,
                [voucherId, userId]
            );
            
            if (voucherRes.rows.length > 0) {
                const voucher = voucherRes.rows[0];
                discountAmount = (subtotal * voucher.discount_percent / 100);
            }
        }
        
        const shippingFee = deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0;
        const finalTotal = subtotal - discountAmount + shippingFee;

        // Ensure total is not negative
        const totalAmount = Math.max(0, finalTotal).toFixed(2);

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: totalAmount,
                },
            }],
        });

        const order = await paypalClient.execute(request);
        res.status(200).json({ orderID: order.result.id });

    } catch (err) {
        // More detailed logging for PayPal errors
        console.error("Error creating PayPal order:", err.statusCode ? err.statusCode : err.message, err.result ? err.result : '');
        res.status(500).send(err.message || 'Failed to create PayPal order');
    }
});


app.post('/api/paypal/capture-order', async (req, res) => {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        res.status(200).json({ capture });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/users/:id/address', async (req, res) => {
    const { id } = req.params;
    const { address, postalCode, country } = req.body;

    if (!address || !postalCode || !country) {
        return res.status(400).json({ error: 'Address, postal code, and country are required.' });
    }

    try {
        const result = await db.query(
            `UPDATE users 
             SET address = $1, postal_code = $2, country = $3 
             WHERE id = $4 
             RETURNING id, address, postal_code, country`,
            [address, postalCode, country, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ message: 'Address updated successfully.', user: result.rows[0] });
    } catch (err) {
        console.error('Error updating user address:', err);
        res.status(500).json({ error: 'Server error while updating address.' });
    }
});

const server = app.listen(5000, () => {
  console.log('Server running on port 5000');
});

// ========== jun hong's WEB SOCKET SERVER CODES ===============
const wss = new WebSocketServer({ server });

// This will store active connections, mapping an orderId to the client watching it.
const orderWatchers = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
        const data = JSON.parse(message);
        // When the client's OrderDelivery page loads, it will send this message.
        if (data.type === 'SUBSCRIBE_TO_ORDER') {
            const orderId = data.orderId;
            console.log(`Client is now watching order #${orderId}`);
            // Store the WebSocket connection for this specific orderId.
            orderWatchers.set(orderId, ws);
        }
    } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Clean up the map when a user navigates away.
    for (const [orderId, clientWs] of orderWatchers.entries()) {
        if (clientWs === ws) {
            orderWatchers.delete(orderId);
            break;
        }
    }
  });
});


// helper function
const simulateDelivery = (orderId) => {
    console.log(`Starting delivery simulation for order #${orderId}`);

    // Step 1: Mark as "Shipped" after a delay (e.g., 10 seconds for demo)
    setTimeout(async () => {
        try {
            const updateQuery = `UPDATE orders SET shipped_at = NOW() WHERE id = $1 RETURNING *;`;
            const result = await db.query(updateQuery, [orderId]);
            const updatedOrder = result.rows[0];
            
            console.log(`Order #${orderId} has been shipped.`);

            // Check if anyone is watching this order.
            if (orderWatchers.has(orderId)) {
                const ws = orderWatchers.get(orderId);
                // Push the update to the specific client watching this order.
                ws.send(JSON.stringify({ type: 'ORDER_STATUS_UPDATE', order: updatedOrder }));
            }
        } catch (err) {
            console.error(`Error updating order #${orderId} to shipped:`, err);
        }
    }, 10000); // 10 seconds

    // Step 2: Mark as "Delivered" after another delay (e.g., 20 seconds total)
    setTimeout(async () => {
        try {
            const updateQuery = `UPDATE orders SET delivered_at = NOW(), review_started_at = NOW() WHERE id = $1 RETURNING *;`;
            const result = await db.query(updateQuery, [orderId]);
            const updatedOrder = result.rows[0];

            console.log(`Order #${orderId} has been delivered.`);
            
            if (orderWatchers.has(orderId)) {
                const ws = orderWatchers.get(orderId);
                ws.send(JSON.stringify({ type: 'ORDER_STATUS_UPDATE', order: updatedOrder }));
            }
        } catch (err) {
            console.error(`Error updating order #${orderId} to delivered:`, err);
        }
    }, 20000); // 20 seconds
};

// server.js

// =========== UPDATED & ENHANCED DASHBOARD ENDPOINT ===========
app.get('/api/dashboard/summary', async (req, res) => {
  // now only two modes: total (yearly) or daily (last 7 days)
  const { period = 'total' } = req.query;
  const now = new Date();

  let currentStartDate, previousStartDate, previousEndDate;
  let graphInterval, graphFormat, graphSeriesStart, graphTrunc;

  switch (period) {
    case 'daily':
      // last 7 days, daily points
      currentStartDate  = new Date(now);
      currentStartDate.setDate(now.getDate() - 6);
      previousStartDate = new Date(currentStartDate);
      previousStartDate.setDate(currentStartDate.getDate() - 7);
      previousEndDate   = new Date(currentStartDate);

      graphInterval    = '1 day';
      graphFormat      = 'MM/DD';
      graphSeriesStart = `NOW() - INTERVAL '6 days'`;
      graphTrunc       = 'day';
      break;

    case 'total':
    default:
      // whole year, monthly points
      currentStartDate  = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      previousEndDate   = new Date(currentStartDate);

      graphInterval    = '1 month';
      graphFormat      = 'Mon';
      graphSeriesStart = `DATE_TRUNC('year', NOW())`;
      graphTrunc       = 'month';
      break;
  }

  const currentEndDate = now;

  // --- fetch counts for customers, profit & orders ---
  const getMetricsForPeriod = async (startDate, endDate) => {
    const customerQ = `
      SELECT COUNT(DISTINCT buyer_id) AS cnt
        FROM orders
       WHERE ordered_at >= $1 AND ordered_at < $2;
    `;
    const profitQ = `
      SELECT COALESCE(SUM(oi.price_at_purchase),0) AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
       WHERE o.ordered_at >= $1
         AND o.ordered_at < $2
         AND oi.item_type = 'shop';
    `;
    const orderQ = `
      SELECT COUNT(id) AS total
        FROM orders
       WHERE ordered_at >= $1 AND ordered_at < $2;
    `;
    const [cRes, pRes, oRes] = await Promise.all([
      db.query(customerQ, [startDate, endDate]),
      db.query(profitQ,   [startDate, endDate]),
      db.query(orderQ,    [startDate, endDate]),
    ]);
    return {
      customers: parseInt(cRes.rows[0].cnt, 10)  || 0,
      profit:    parseFloat(pRes.rows[0].total)  || 0,
      orders:    parseInt(oRes.rows[0].total, 10)|| 0,
    };
  };

  const [current, previous] = await Promise.all([
    getMetricsForPeriod(currentStartDate, currentEndDate),
    getMetricsForPeriod(previousStartDate, previousEndDate),
  ]);

  const calcPct = (cur, prev) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  // --- build the time-series for the chart ---
  const graphSQL = `
    WITH series AS (
      SELECT generate_series(
        (${graphSeriesStart})::date,
        NOW()::date,
        '${graphInterval}'::interval
      ) AS date
    )
    SELECT
      TO_CHAR(series.date, '${graphFormat}') AS report_date,
      COALESCE(SUM(CASE WHEN oi.item_type='shop'        THEN oi.price_at_purchase ELSE 0 END),0) AS "ourProduct",
      COALESCE(SUM(CASE WHEN oi.item_type='marketplace' THEN oi.price_at_purchase ELSE 0 END),0) AS "recycledClothes"
    FROM series
    LEFT JOIN orders o
      ON DATE_TRUNC('${graphTrunc}', o.ordered_at) = series.date
    LEFT JOIN order_items oi
      ON oi.order_id = o.id
    GROUP BY series.date
    ORDER BY series.date;
  `;
  const graphRes = await db.query(graphSQL);

  res.json({
    metrics: {
      customers: {
        value:      current.customers,
        percentage: calcPct(current.customers, previous.customers)
      },
      profit: {
        value:      current.profit,
        percentage: calcPct(current.profit, previous.profit)
      },
      orders: {
        value:      current.orders,
        percentage: calcPct(current.orders, previous.orders)
      }
    },
    graphData: graphRes.rows.map(r => ({
      date:               r.report_date,
      'Our Product':      parseFloat(r.ourProduct),
      'Recycled clothes': parseFloat(r.recycledClothes)
    }))
  });
});


// =========== RECENT TRANSACTIONS ENDPOINT ===========
app.get('/api/dashboard/recent-transactions', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const sql = `
    SELECT
      o.id            AS order_id,
      o.buyer_id,
      o.ordered_at,
      oi.purchased_item_id,
      oi.item_type,
      oi.price_at_purchase,
      u.username,
      CASE
        WHEN oi.item_type='marketplace' THEN mp.title
        ELSE p.product_name
      END AS product_name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN users u    ON o.buyer_id = u.id
    LEFT JOIN marketplaceproducts mp
      ON oi.item_type='marketplace' AND oi.purchased_item_id = mp.id
    LEFT JOIN product_variants pv
      ON oi.item_type='shop' AND oi.purchased_item_id = pv.id
    LEFT JOIN products p
      ON pv.product_id = p.id
    ORDER BY o.ordered_at DESC
    LIMIT $1;
  `;
  const { rows } = await db.query(sql, [limit]);
  res.json(rows);
});

// =================================================================
//  ===> FIXED ANALYTICS API ENDPOINTS <===
// =================================================================

// Get conversion rate (registered users who made purchases)
app.get('/api/analytics/conversion-rate', async (req, res) => {
  try {
    // Get total registered users
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0]?.total) || 0;

    // Get users who have made at least one purchase
    const purchasedUsersResult = await db.query(`
      SELECT COUNT(DISTINCT buyer_id) as total 
      FROM orders
    `);
    const purchasedUsers = parseInt(purchasedUsersResult.rows[0]?.total) || 0;

    const conversionRate = totalUsers > 0 ? (purchasedUsers / totalUsers) * 100 : 0;

    res.json({ 
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalUsers,
      purchasedUsers
    });
  } catch (err) {
    console.error('Error calculating conversion rate:', err);
    res.json({ 
      conversionRate: 0,
      totalUsers: 0,
      purchasedUsers: 0
    });
  }
});

// Get top 5 performing products (SHOP items only)
app.get('/api/analytics/top-products', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.product_name as name,
        p.id,
        COALESCE(SUM(oi.price_at_purchase), 0) as total_sales,
        COUNT(*) as units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.item_type = 'shop' AND oi.purchased_item_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.ordered_at >= NOW() - INTERVAL '30 days'
        AND oi.item_type = 'shop'
      GROUP BY p.id, p.product_name
      HAVING SUM(oi.price_at_purchase) > 0
      ORDER BY total_sales DESC
      LIMIT 5
    `;
    
    const { rows } = await db.query(query);
    
    // Ensure valid data format
    const validRows = rows.map(row => ({
      id: row.id,
      name: row.name || 'Unknown Product',
      total_sales: parseFloat(row.total_sales) || 0,
      units_sold: parseInt(row.units_sold) || 0
    }));
    
    res.json(validRows);
  } catch (err) {
    console.error('Error fetching top products:', err);
    res.json([]);
  }
});

// Get category performance for pie chart (BOTH shop and marketplace)
app.get('/api/analytics/category-performance', async (req, res) => {
  try {
    const query = `
      WITH category_sales AS (
        -- Shop items
        SELECT 
          p.categories as category,
          COALESCE(SUM(oi.price_at_purchase), 0) as total_sales,
          'shop' as source
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN product_variants pv ON oi.item_type = 'shop' AND oi.purchased_item_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE o.ordered_at >= NOW() - INTERVAL '30 days'
          AND oi.item_type = 'shop'
          AND p.categories IS NOT NULL
          AND TRIM(p.categories) != ''
        GROUP BY p.categories
        
        UNION ALL
        
        -- Marketplace items
        SELECT 
          mp.category as category,
          COALESCE(SUM(oi.price_at_purchase), 0) as total_sales,
          'marketplace' as source
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN marketplaceproducts mp ON oi.item_type = 'marketplace' AND oi.purchased_item_id = mp.id
        WHERE o.ordered_at >= NOW() - INTERVAL '30 days'
          AND oi.item_type = 'marketplace'
          AND mp.category IS NOT NULL
          AND TRIM(mp.category) != ''
        GROUP BY mp.category
      ),
      combined_categories AS (
        SELECT 
          category as name,
          SUM(total_sales) as value
        FROM category_sales
        WHERE total_sales > 0
        GROUP BY category
      )
      SELECT 
        name,
        value,
        ROUND((value / NULLIF(SUM(value) OVER (), 0)) * 100, 1) as percentage
      FROM combined_categories
      WHERE value > 0
      ORDER BY value DESC
    `;
    
    const { rows } = await db.query(query);
    
    // Ensure valid data format
    const validRows = rows.map(row => ({
      name: row.name || 'Unknown Category',
      value: parseFloat(row.value) || 0,
      percentage: parseFloat(row.percentage) || 0
    }));
    
    res.json(validRows);
  } catch (err) {
    console.error('Error fetching category performance:', err);
    res.json([]);
  }
});

app.get('/api/dashboard/sales-density', async (req, res) => {
  try {
    const query = `
      SELECT 
        LEFT(u.postal_code::text, 2) AS sector,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(o.total_price), 0) AS total_sales
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE u.postal_code IS NOT NULL
        AND LENGTH(TRIM(u.postal_code::text)) >= 2
        AND o.ordered_at >= NOW() - INTERVAL '30 days'
      GROUP BY sector
      HAVING COUNT(o.id) > 0
      ORDER BY order_count DESC
    `;
    const { rows } = await db.query(query);

    // Format output for your AnalPage.jsx component
    const validRows = rows.map(row => ({
      sector: row.sector || '00',
      order_count: parseInt(row.order_count) || 0,
      total_sales: parseFloat(row.total_sales) || 0
    }));

    res.json(validRows);
  } catch (err) {
    console.error('Error fetching sales density:', err);
    res.json([]);
  }
});
