const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE correo_electronico = $1", [correo_electronico]);
    if (result.rows.length === 0 || contrasena !== result.rows[0].contrasena) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    res.json({ token: "token-local", usuario: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "Error en login" }); }
});

// APIARIOS
app.get("/api/apiarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apiarios ORDER BY id DESC");
    res.json(result.rows || []);
  } catch (e) { res.json([]); }
});

// COLMENAS (CORREGIDO SIN CARACTERES EXTRAÑOS)
app.get("/api/colmenas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, a.nombre as nombre_apiario 
      FROM colmenas c
      LEFT JOIN apiarios a ON c.apiario_id = a.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error en colmenas:", error);
    res.json([]); 
  }
});

// SENSORES
app.get("/api/sensores", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sensores ORDER BY id DESC");
    res.json(result.rows || []);
  } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend listo en http://localhost:${PORT}`));
