const pool = require("../../config/base_datos");

async function crearGasto({ concepto, monto, observacion, id_usuario }) {
  const consulta = `
    INSERT INTO gastos (concepto, monto, observacion, id_usuario)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const valores = [concepto, monto, observacion || null, id_usuario];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function listarGastos() {
  const consulta = `
    SELECT g.*, u.nombre AS usuario
    FROM gastos g
    INNER JOIN usuarios u ON u.id_usuario = g.id_usuario
    ORDER BY g.id_gasto DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

module.exports = {
  crearGasto,
  listarGastos,
};
