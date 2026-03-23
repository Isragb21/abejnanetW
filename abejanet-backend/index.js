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

// ==========================================
// 1. LOGIN
// ==========================================
app.post("/api/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE correo_electronico = $1", [correo_electronico]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];
    if (contrasena !== usuario.contrasena) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({
      token: "abejanet-token-v3",
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo_electronico, rol: usuario.rol_id }
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ==========================================
// 2. CRUD USUARIOS (Actualizado para Perfil)
// ==========================================
app.get("/api/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id DESC");
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

// GET INTELIGENTE: Busca por ID o por Correo Electrónico
app.get("/api/usuarios/:id", async (req, res) => {
  try {
    const parametro = req.params.id;
    const isEmail = parametro.includes("@");
    const query = isEmail 
      ? "SELECT * FROM usuarios WHERE correo_electronico = $1" 
      : "SELECT * FROM usuarios WHERE id = $1";

    const result = await pool.query(query, [parametro]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/usuarios", async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, correo_electronico, contrasena, rol_id, esta_activo } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, correo_electronico, contrasena, rol_id, esta_activo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nombre, apellido_paterno, apellido_materno, correo_electronico, contrasena, rol_id, esta_activo !== undefined ? esta_activo : true]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT INTELIGENTE: Actualiza por ID o por Correo Electrónico
app.put("/api/usuarios/:id", async (req, res) => {
  const parametro = req.params.id;
  const isEmail = parametro.includes("@");
  const condicion = isEmail ? "correo_electronico" : "id";
  const { nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, contrasena } = req.body;
  
  try {
    let result;
    if (contrasena && contrasena.trim() !== "") {
      result = await pool.query(
        `UPDATE usuarios SET nombre=$1, apellido_paterno=$2, apellido_materno=$3, correo_electronico=$4, rol_id=$5, esta_activo=$6, contrasena=$7 WHERE ${condicion}=$8 RETURNING *`,
        [nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, contrasena, parametro]
      );
    } else {
      // Usamos COALESCE para no borrar datos si desde "Mi Cuenta" no se envían el rol o estado
      result = await pool.query(
        `UPDATE usuarios SET nombre=$1, apellido_paterno=$2, apellido_materno=$3, correo_electronico=$4, rol_id=COALESCE($5, rol_id), esta_activo=COALESCE($6, esta_activo) WHERE ${condicion}=$7 RETURNING *`,
        [nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, parametro]
      );
    }
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
    res.json({ message: "Usuario eliminado" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ROLES
app.get("/api/roles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM roles ORDER BY id ASC");
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

// ==========================================
// 3. CRUD APIARIOS
// ==========================================
app.get("/api/apiarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apiarios ORDER BY id DESC");
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/apiarios/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apiarios WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/apiarios", async (req, res) => {
  const { nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO apiarios (nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/apiarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion_general, direccion_o_coordenadas } = req.body;
  try {
    const result = await pool.query(
      "UPDATE apiarios SET nombre = $1, descripcion_general = $2, direccion_o_coordenadas = $3 WHERE id = $4 RETURNING *",
      [nombre, descripcion_general, direccion_o_coordenadas, id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/apiarios/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM apiarios WHERE id = $1", [req.params.id]);
    res.json({ message: "Apiario eliminado" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 4. CRUD COLMENAS
// ==========================================
app.get("/api/colmenas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, a.nombre as nombre_apiario 
      FROM colmenas c
      LEFT JOIN apiarios a ON c.apiario_id = a.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/colmenas/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colmenas WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/colmenas", async (req, res) => {
  const { apiario_id, nombre, descripcion_especifica } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO colmenas (apiario_id, nombre, descripcion_especifica) VALUES ($1, $2, $3) RETURNING *",
      [apiario_id, nombre, descripcion_especifica]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/colmenas/:id", async (req, res) => {
  const { id } = req.params;
  const { apiario_id, nombre, descripcion_especifica } = req.body;
  try {
    const result = await pool.query(
      "UPDATE colmenas SET apiario_id = $1, nombre = $2, descripcion_especifica = $3 WHERE id = $4 RETURNING *",
      [apiario_id, nombre, descripcion_especifica, id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/colmenas/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM colmenas WHERE id = $1", [req.params.id]);
    res.json({ message: "Colmena eliminada" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 5. CRUD SENSORES
// ==========================================
app.get("/api/sensores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.nombre as nombre_colmena 
      FROM sensores s
      LEFT JOIN colmenas c ON s.colmena_id = c.id
      ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/sensores/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sensores WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/sensores", async (req, res) => {
  const { mac_address, colmena_id, tipo_sensor, estado } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO sensores (mac_address, colmena_id, tipo_sensor, estado) VALUES ($1, $2, $3, $4) RETURNING *",
      [mac_address, colmena_id, tipo_sensor, estado]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/sensores/:id", async (req, res) => {
  const { id } = req.params;
  const { mac_address, colmena_id, tipo_sensor, estado } = req.body;
  try {
    const result = await pool.query(
      "UPDATE sensores SET mac_address = $1, colmena_id = $2, tipo_sensor = $3, estado = $4 WHERE id = $5 RETURNING *",
      [mac_address, colmena_id, tipo_sensor, estado, id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/sensores/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM sensores WHERE id = $1", [req.params.id]);
    res.json({ message: "Sensor eliminado" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// PUERTO Y ENCENDIDO
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor AbejaNet v3 en http://localhost:${PORT}`);
});