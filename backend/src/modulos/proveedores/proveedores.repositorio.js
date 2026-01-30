const pool = require("../../config/base_datos");

async function listarProveedores() {
  const res = await pool.query(
    "SELECT id_proveedor, nombre, telefono, correo, activo FROM proveedores ORDER BY nombre"
  );
  return res.rows;
}

async function crearProveedor({ nombre, telefono, correo }) {
  const res = await pool.query(
    `INSERT INTO proveedores (nombre, telefono, correo)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre, telefono || null, correo || null]
  );
  return res.rows[0];
}

async function editarProveedor(id_proveedor, { nombre, telefono, correo }) {
  const res = await pool.query(
    `UPDATE proveedores
     SET nombre = $1,
         telefono = $2,
         correo = $3
     WHERE id_proveedor = $4
     RETURNING *`,
    [nombre, telefono || null, correo || null, id_proveedor]
  );

  return res.rows[0];
}

async function cambiarEstadoProveedor(id_proveedor, activo) {
  const res = await pool.query(
    `UPDATE proveedores
     SET activo = $1
     WHERE id_proveedor = $2
     RETURNING *`,
    [activo, id_proveedor]
  );

  return res.rows[0];
}

module.exports = {
  listarProveedores,
  crearProveedor,
  editarProveedor,
  cambiarEstadoProveedor,
};
