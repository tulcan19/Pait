const pool = require("../../config/base_datos");

async function listarClientes() {
  const res = await pool.query(
    "SELECT id_cliente, nombre, telefono, correo, activo FROM clientes ORDER BY id_cliente"
  );
  return res.rows;
}

async function crearCliente({ nombre, telefono, correo }) {
  const res = await pool.query(
    `INSERT INTO clientes (nombre, telefono, correo)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre, telefono || null, correo || null]
  );
  return res.rows[0];
}
async function editarCliente({ id_cliente, nombre, telefono, correo }) {
  const res = await pool.query(
    `UPDATE clientes
     SET nombre = $1,
         telefono = $2,
         correo = $3
     WHERE id_cliente = $4
     RETURNING *`,
    [nombre, telefono || null, correo || null, id_cliente]
  );

  return res.rows[0];
}

async function cambiarEstadoCliente(id_cliente, activo) {
  const res = await pool.query(
    `UPDATE clientes
     SET activo = $1
     WHERE id_cliente = $2
     RETURNING *`,
    [activo, id_cliente]
  );

  return res.rows[0];
}

module.exports = {
  listarClientes,
  crearCliente,
  editarCliente,
  cambiarEstadoCliente,
};
