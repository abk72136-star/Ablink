const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const { nanoid } = require("nanoid");

const app = express();

// Railway ka PORT use karo. Local pe 3000 chalega
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// DB file Railway me /data folder me banegi
const dbPath = path.join(__dirname, "links.db");
const db = new sqlite3.Database(dbPath);

db.run(`CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/shorten", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const shortCode = nanoid(6);

  db.run(
    "INSERT INTO links (short_code, original_url) VALUES (?, ?)",
    [shortCode, url],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      const shortUrl = `${req.protocol}://${req.get("host")}/${shortCode}`;
      res.json({ shortUrl });
    }
  );
});

app.get("/:code", (req, res) => {
  const { code } = req.params;
  db.get("SELECT original_url FROM links WHERE short_code = ?", [code], (err, row) => {
    if (err) return res.status(500).send("DB error");
    if (!row) return res.status(404).send("Link not found");
    res.redirect(row.original_url);
  });
});

// Yahan PORT variable use hua hai
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
