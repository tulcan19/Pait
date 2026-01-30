const productosServicio = require("./productos.servicio");

async function crear(req, res) {
  try {
    const { nombre, descripcion, precio, stock, id_categoria, imagen } = req.body;

    if (!nombre || precio == null || stock == null || !id_categoria) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const resultado = await productosServicio.registrarProducto({
      nombre,
      descripcion,
      precio,
      stock,
      id_categoria,
      imagen,
    });

    return res.status(201).json({ mensaje: "✅ Producto creado", ...resultado });
  } catch (error) {
    console.error("Error crear producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await productosServicio.obtenerProductos();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar productos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    const { nombre, descripcion, precio, stock, id_categoria, imagen } = req.body;

    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.editarProducto(id_producto, {
      nombre,
      descripcion,
      precio,
      stock,
      id_categoria,
      imagen,
    });

    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json({ mensaje: "✅ Producto actualizado", ...resultado });
  } catch (error) {
    console.error("Error actualizar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function desactivar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.eliminarLogicoProducto(id_producto);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json({ mensaje: "✅ Producto desactivado", ...resultado });
  } catch (error) {
    console.error("Error desactivar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function activar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    // ✅ Llamar al servicio correcto
    const resultado = await productosServicio.activarProducto(id_producto);

    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.status(200).json({ mensaje: "✅ Producto activado", ...resultado });
  } catch (error) {
    console.error("Error activar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}



module.exports = {
  crear,
  listar,
  actualizar,
  desactivar,
  activar,
};
