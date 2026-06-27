const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000; // <- Railway PORT dega

const db = new sqlite3.Database('./links.db');
db.run(`CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, short_code TEXT UNIQUE NOT NULL, original_url TEXT NOT NULL)`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));
app.post('/shorten', (req, res) => {
  const { url } = req.body; if (!url) return res.status(400).send('URL required');
  const shortCode = nanoid(7);
  db.run('INSERT INTO links (short_code, original_url) VALUES (?, ?)', [shortCode, url]);
  const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
  res.render('index', { shortUrl });
});
app.get('/:code', (req, res) => {
  db.get('SELECT original_url FROM links WHERE short_code = ?', [req.params.code], (err, row) => {
    if (err || !row) return res.status(404).send('Link not found');
    res.redirect(row.original_url);
  });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`)); // <- Ye Vercel me nahi tha
