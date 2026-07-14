const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("AbejaNet API activa. Usa /api/health para validar el servicio.");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "AbejaNet API" });
});

const dbHost = (process.env.DB_HOST || "").trim().toLowerCase();
const isLocalDbHost = ["localhost", "127.0.0.1", "::1"].includes(dbHost);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // En desarrollo local PostgreSQL normalmente no expone SSL.
  ssl: isLocalDbHost ? false : { rejectUnauthorized: false },
});

// ==========================================
// 1. LOGIN CON 2FA
// ==========================================
app.post("/api/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE correo_electronico = $1", [correo_electronico]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];

    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena).catch(() => false);
    const isPlain = contrasena === usuario.contrasena;

    if (!isMatch && !isPlain) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    if (!usuario.secreto_2fa) {
      const secret = speakeasy.generateSecret({ name: `AbejaNet (${usuario.correo_electronico})` });
      const qrImage = await qrcode.toDataURL(secret.otpauth_url);

      return res.json({
        requireSetup2FA: true,
        tempSecret: secret.base32,
        qrCode: qrImage,
        correo: usuario.correo_electronico
      });
    } else {
      return res.json({
        require2FA: true,
        correo: usuario.correo_electronico
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al procesar el login" });
  }
});

app.post("/api/verify-2fa", async (req, res) => {
  const { correo_electronico, token_2fa, tempSecret } = req.body;

  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE correo_electronico = $1", [correo_electronico]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];
    const secretToUse = usuario.secreto_2fa || tempSecret;

    if (!secretToUse) return res.status(400).json({ error: "No hay un secreto 2FA válido" });

    const verified = speakeasy.totp.verify({
      secret: secretToUse,
      encoding: 'base32',
      token: token_2fa,
      window: 1 
    });

    if (verified) {
      if (!usuario.secreto_2fa && tempSecret) {
        await pool.query("UPDATE usuarios SET secreto_2fa = $1 WHERE id = $2", [tempSecret, usuario.id]);
      }

      res.json({
        token: "abejanet-token-v3",
        usuario: { 
          id: usuario.id, 
          nombre: usuario.nombre, 
          correo_electronico: usuario.correo_electronico, 
          rol_id: usuario.rol_id, 
          esta_activo: usuario.esta_activo 
        }
      });
    } else {
      res.status(401).json({ error: "Código 2FA incorrecto o expirado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al verificar 2FA" });
  }
});

// ==========================================
// 2. CRUD USUARIOS 
// ==========================================
app.get("/api/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id DESC");
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

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
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, correo_electronico, contrasena, rol_id, esta_activo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nombre, apellido_paterno, apellido_materno, correo_electronico, hashedPassword, rol_id, esta_activo !== undefined ? esta_activo : true]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/usuarios/:id", async (req, res) => {
  const parametro = req.params.id;
  const isEmail = parametro.includes("@");
  const condicion = isEmail ? "correo_electronico" : "id";
  const { nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, contrasena } = req.body;
  
  try {
    let result;
    if (contrasena && contrasena.trim() !== "") {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      result = await pool.query(
        `UPDATE usuarios SET nombre=$1, apellido_paterno=$2, apellido_materno=$3, correo_electronico=$4, rol_id=$5, esta_activo=$6, contrasena=$7 WHERE ${condicion}=$8 RETURNING *`,
        [nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, hashedPassword, parametro]
      );
    } else {
      result = await pool.query(
        `UPDATE usuarios SET nombre=$1, apellido_paterno=$2, apellido_materno=$3, correo_electronico=$4, rol_id=COALESCE($5, rol_id), esta_activo=COALESCE($6, esta_activo) WHERE ${condicion}=$7 RETURNING *`,
        [nombre, apellido_paterno, apellido_materno, correo_electronico, rol_id, esta_activo, parametro]
      );
    }
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🚨 NUEVA RUTA: RESETEAR 2FA
app.put("/api/usuarios/:id/reset-2fa", async (req, res) => {
  try {
    await pool.query("UPDATE usuarios SET secreto_2fa = NULL WHERE id = $1", [req.params.id]);
    res.json({ message: "Autenticación de 2 pasos reiniciada correctamente. El usuario deberá escanear un nuevo código QR en su próximo inicio de sesión." });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
    res.json({ message: "Usuario eliminado" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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

app.get("/api/colmenas/:id/detalle", async (req, res) => {
  try {
    const { id } = req.params;

    const colmenaResult = await pool.query(
      `SELECT c.*, a.nombre AS apiario
       FROM colmenas c
       LEFT JOIN apiarios a ON c.apiario_id = a.id
       WHERE c.id = $1`,
      [id]
    );
    if (colmenaResult.rows.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    const lecturasResult = await pool.query(
      `SELECT l.*, s.tipo_sensor
       FROM lecturas_ambientales l
       JOIN sensores s ON s.id = l.sensor_id
       WHERE s.colmena_id = $1
       ORDER BY l.fecha_registro DESC`,
      [id]
    );

    res.json({
      colmena: colmenaResult.rows[0],
      lecturas: lecturasResult.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  const { mac_address, colmena_id, tipo_sensor, estado, fecha_instalacion } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO sensores (mac_address, colmena_id, tipo_sensor, estado, fecha_instalacion) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [mac_address, colmena_id, tipo_sensor, estado, fecha_instalacion || null]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/sensores/:id", async (req, res) => {
  const { id } = req.params;
  const { mac_address, colmena_id, tipo_sensor, estado, fecha_instalacion } = req.body;
  try {
    const result = await pool.query(
      "UPDATE sensores SET mac_address = $1, colmena_id = $2, tipo_sensor = $3, estado = $4, fecha_instalacion = $5 WHERE id = $6 RETURNING *",
      [mac_address, colmena_id, tipo_sensor, estado, fecha_instalacion || null, id]
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
// 6. LECTURAS AMBIENTALES
// ==========================================
app.post("/api/lecturas", async (req, res) => {
  try {
    const { sensor_id, temperatura, humedad, peso, sonido, lluvia } = req.body;
    if (!sensor_id) return res.status(400).json({ error: "sensor_id es requerido" });
    if (temperatura === undefined || temperatura === null) {
      return res.status(400).json({ error: "temperatura es requerida" });
    }

    const sensorResult = await pool.query("SELECT id FROM sensores WHERE id = $1", [sensor_id]);
    if (sensorResult.rows.length === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    const lluviaVal =
      lluvia === true || lluvia === 1 || lluvia === "1" ? 1
      : lluvia === false || lluvia === 0 || lluvia === "0" ? 0
      : null;

    const result = await pool.query(
      `INSERT INTO lecturas_ambientales (sensor_id, humedad, temperatura, peso, sonido, lluvia)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parseInt(sensor_id),
        humedad != null ? parseFloat(humedad) : null,
        parseFloat(temperatura),
        peso != null ? parseFloat(peso) : null,
        sonido != null ? parseFloat(sonido) : null,
        lluviaVal,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/lecturas", async (req, res) => {
  try {
    const { sensor_id, colmena_id } = req.query;
    let query = `
      SELECT l.*, s.tipo_sensor, s.colmena_id
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
    `;
    const conditions = [];
    const values = [];
    if (sensor_id) {
      values.push(sensor_id);
      conditions.push(`l.sensor_id = $${values.length}`);
    }
    if (colmena_id) {
      values.push(colmena_id);
      conditions.push(`s.colmena_id = $${values.length}`);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY l.fecha_registro DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json([]);
  }
});

// ==========================================
// 7. REPORTES
// ==========================================
app.get("/api/reportes/resumen", async (req, res) => {
  try {
    const { desde, hasta, apiarioId, colmenaId } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: "desde y hasta son requeridos" });

    const from = desde + " 00:00:00";
    const to = hasta + " 23:59:59";
    const conditions = ["1=1"];
    const baseValues = [];

    if (apiarioId) { baseValues.push(apiarioId); conditions.push(`c.apiario_id = $${baseValues.length}`); }
    if (colmenaId) { baseValues.push(colmenaId); conditions.push(`c.id = $${baseValues.length}`); }
    const whereClause = " WHERE " + conditions.join(" AND ");

    const activas = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS n
       FROM lecturas_ambientales l
       JOIN sensores s ON s.id = l.sensor_id
       JOIN colmenas c ON c.id = s.colmena_id
       ${whereClause}
       AND l.fecha_registro BETWEEN $${baseValues.length + 1} AND $${baseValues.length + 2}`,
      [...baseValues, from, to]
    );

    const promPeso = await pool.query(
      `SELECT AVG(l.peso) AS prom
       FROM lecturas_ambientales l
       JOIN sensores s ON s.id = l.sensor_id
       JOIN colmenas c ON c.id = s.colmena_id
       ${whereClause}
       AND l.fecha_registro BETWEEN $${baseValues.length + 1} AND $${baseValues.length + 2}`,
      [...baseValues, from, to]
    );

    res.json({
      activas: Number(activas.rows[0]?.n) || 0,
      promPeso: Number(promPeso.rows[0]?.prom) || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/reportes/serie-peso", async (req, res) => {
  try {
    const { desde, hasta, colmenaId } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: "desde y hasta son requeridos" });

    const conditions = ["1=1"];
    const values = [];
    if (colmenaId) { values.push(colmenaId); conditions.push(`c.id = $${values.length}`); }
    const idxFrom = values.length + 1;
    const idxTo = values.length + 2;
    values.push(desde + " 00:00:00", hasta + " 23:59:59");

    const result = await pool.query(
      `SELECT to_char(l.fecha_registro, 'YYYY-MM-DD HH24:MI') AS fecha, c.nombre AS colmena, l.peso
       FROM lecturas_ambientales l
       JOIN sensores s ON s.id = l.sensor_id
       JOIN colmenas c ON c.id = s.colmena_id
       WHERE ${conditions.join(" AND ")}
       AND l.fecha_registro BETWEEN $${idxFrom} AND $${idxTo}
       ORDER BY l.fecha_registro`,
      values
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ==========================================
// PUERTO Y ENCENDIDO
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor AbejaNet v3 en http://localhost:${PORT}`);
});