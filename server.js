const express = require('express');
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => res.render('admin'));
app.post('/create', async (req, res) => {
  const { url } = req.body;
  const id = nanoid(6);
  await pool.query('INSERT INTO links(id, url) VALUES($1, $2)', [id, url]);
  res.render('link', { id });
});
app.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT url FROM links WHERE id=$1', [req.params.id]);
  rows[0]? res.redirect(rows[0].url) : res.status(404).send('Link not found');
});

app.listen(PORT);