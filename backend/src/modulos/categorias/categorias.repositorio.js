const pool = require("../../config/base_datos");

async function crearCategoria({ nombre, descripcion }) {
  const consulta = `
    INSERT INTO categorias (nombre, descripcion)
    VALUES ($1, $2)
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [nombre, descripcion || null]);
  return resultado.rows[0];
}

async function listarCategorias() {
  const consulta = `SELECT * FROM categorias ORDER BY id_categoria DESC`;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

module.exports = {
  crearCategoria,
  listarCategorias,
};
