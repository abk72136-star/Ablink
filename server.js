const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000; // <-- Ye line Railway ke liye hai

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database Setup - Railway pe bhi ban jayegi
const db = new sqlite3.Database('./ablink.db', (err) => {
  if (err) {
    console.error('DB Error:', err.message);
  } else {
    console.log('Connected to SQLite DB');
    db.run(`CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      long_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      clicks INTEGER DEFAULT 0
    )`);
  }
});

// Route 1: Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route 2: Short URL Banane Ka API
app.post('/api/shorten', (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl || !longUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL dalo bhai' });
  }

  const shortCode = nanoid(6);
  
  db.run('INSERT INTO links (short_code, long_url) VALUES (?, ?)', [shortCode, longUrl], function(err) {
    if (err) {
      return res.status(500).json({ error: 'DB me save nahi hua' });
    }
    const shortUrl = `${req.headers.host}/${shortCode}`;
    res.json({ shortUrl: `https://${shortUrl}` });
  });
});

// Route 3: Redirect Karne Wala
app.get('/:code', (req, res) => {
  const { code } = req.params;
  db.get('SELECT long_url FROM links WHERE short_code = ?', [code], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Link nahi mila');
    }
    db.run('UPDATE links SET clicks = clicks + 1 WHERE short_code = ?', [code]);
    res.redirect(row.long_url);
  });
});

// Server Start - Ye line sabse important hai
app.listen(PORT, () => {
  console.log(`Ablink server running on PORT: ${PORT}`);
});
