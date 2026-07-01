const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { nanoid } = require("nanoid");
const { Pool } = require('pg'); // sqlite3 ki jagah pg

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Supabase Connection - Vercel Env se lega
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase ke liye must
});

// 2. Table Auto Ban jayega
pool.query(`
  CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/shorten", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const shortCode = nanoid(6);
  try {
    await pool.query(
      "INSERT INTO links (short_code, original_url) VALUES ($1, $2)",
      [shortCode, url]
    );
    const shortUrl = `${req.protocol}://${req.get("host")}/${shortCode}`;
    res.json({ shortUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

app.get("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query("SELECT original_url FROM links WHERE short_code = $1", [code]);
    if (result.rows.length === 0) return res.status(404).send("Link not found");
    res.redirect(result.rows[0].original_url);
  } catch (err) {
    res.status(500).send("DB error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
