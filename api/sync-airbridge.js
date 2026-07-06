import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    const response = await fetch(`https://api.airbridge.io/reports/v1/events?app_name=${process.env.AIRBRIDGE_APP_NAME}&start_date=2024-01-01&limit=100`, {
      headers: { 'Authorization': `Bearer ${process.env.AIRBRIDGE_API_TOKEN}` }
    });
    
    const data = await response.json();
    
    const client = await pool.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS airbridge_events(id serial primary key, event_name text, user_id text, created_at timestamptz)`);
    
    for (const e of data.data || []) {
      await client.query('INSERT INTO airbridge_events(event_name, user_id, created_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [e.event, e.user_id, e.occurred_at]);
    }
    client.release();
    
    res.status(200).json({ success: true, count: data.data?.length || 0 });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
