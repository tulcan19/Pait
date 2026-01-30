const productosRepositorio = require("./productos.repositorio");

async function registrarProducto(datos) {
  const producto = await productosRepositorio.crearProducto(datos);
  return { ok: true, producto };
}

async function obtenerProductos() {
  const productos = await productosRepositorio.listarProductos();
  return { ok: true, productos };
}

async function editarProducto(id_producto, datos) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.actualizarProducto(id_producto, datos);
  return { ok: true, producto };
}

async function eliminarLogicoProducto(id_producto) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.desactivarProducto(id_producto);
  return { ok: true, producto };
}

async function activarProducto(id_producto) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.activarProducto(id_producto);
  return { ok: true, producto };
}



module.exports = {
  registrarProducto,
  obtenerProductos,
  editarProducto,
  eliminarLogicoProducto,
  activarProducto,

};
