// backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Logs de ayuda (buenos para debuguear, quítalos en producción)
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // MODIFICACIÓN AQUÍ: Solo usa SSL si NO estás en localhost o si la base de datos lo exige
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },

  // Opciones del pool
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// Test de conexión
pool
  .connect()
  .then((client) => {
    console.log("✅ Conectado correctamente a la base de datos:", process.env.DB_NAME);
    client.release();
  })
  .catch((err) => {
    console.error("❌ Error de conexión:", err.message);
    console.error("💡 Tip: Si el error es de SSL, prueba comentando la línea de ssl en db.js");
  });

// Cierre limpio (Ctrl+C)
const shutdown = async () => {
  try {
    await pool.end();
    console.log("👋 Pool PostgreSQL cerrado.");
  } catch (e) {
    console.error("Error cerrando pool:", e.message);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = pool;