const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.BD_HOST,
  port: Number(process.env.BD_PUERTO),
  user: process.env.BD_USUARIO,
  password: process.env.BD_CONTRASENA,
  database: process.env.BD_NOMBRE,
});

pool.on("error", (err) => {
  console.error("Error inesperado en PostgreSQL:", err);
});

module.exports = pool;
