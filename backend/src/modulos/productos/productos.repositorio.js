const pool = require("../../config/base_datos");

async function crearProducto({ nombre, descripcion, precio, stock, id_categoria, imagen }) {
  const consulta = `
    INSERT INTO productos (nombre, descripcion, precio, stock, id_categoria, imagen)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const valores = [nombre, descripcion || null, precio, stock, id_categoria, imagen || null];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function listarProductos() {
  const consulta = `
    SELECT p.*, c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c ON c.id_categoria = p.id_categoria
    ORDER BY p.id_producto DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

async function actualizarProducto(id_producto, { nombre, descripcion, precio, stock, id_categoria, imagen }) {
  const consulta = `
    UPDATE productos
    SET nombre = $1,
        descripcion = $2,
        precio = $3,
        stock = $4,
        id_categoria = $5,
        imagen = $6
    WHERE id_producto = $7
    RETURNING *
  `;
  const valores = [nombre, descripcion || null, precio, stock, id_categoria, imagen || null, id_producto];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function desactivarProducto(id_producto) {
  const consulta = `
    UPDATE productos
    SET activo = FALSE
    WHERE id_producto = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}

async function existeProducto(id_producto) {
  const consulta = `SELECT id_producto FROM productos WHERE id_producto = $1 LIMIT 1`;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}
async function activarProducto(id_producto) {
  const sql = `
    UPDATE productos
    SET activo = true
    WHERE id_producto = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, [id_producto]);
  return rows[0];
}


module.exports = {
  crearProducto,
  listarProductos,
  actualizarProducto,
  desactivarProducto,
  existeProducto,
  activarProducto,

};
