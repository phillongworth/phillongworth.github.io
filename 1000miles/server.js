const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'your-db-user',
  host: 'localhost',
  database: 'your-db-name',
  password: 'your-db-password',
  port: 5432,
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to upload GPX files
app.post('/upload', upload.single('gpxFile'), async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.originalname;

  // Read the GPX file content
  const gpxData = fs.readFileSync(filePath, 'utf8');

  // Parse GPX data (you can use a GPX parsing library here)
  // For simplicity, we'll assume distance and elevation are parsed correctly
  const distanceMiles = 0; // Replace with actual parsing logic
  const elevationGainFeet = 0; // Replace with actual parsing logic

  // Insert metadata into the database
  const result = await pool.query(
    'INSERT INTO tracks (name, distance, elevation, url) VALUES ($1, $2, $3, $4) RETURNING *',
    [fileName, distanceMiles, elevationGainFeet, `/uploads/${req.file.filename}`]
  );

  res.json(result.rows[0]);
});

// Endpoint to get all tracks
app.get('/tracks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tracks');
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
