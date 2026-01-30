const categoriasServicio = require("./categorias.servicio");

async function crear(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    const resultado = await categoriasServicio.registrarCategoria({ nombre, descripcion });
    return res.status(201).json({ mensaje: "✅ Categoría creada", ...resultado });
  } catch (error) {
    console.error("Error crear categoría:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await categoriasServicio.obtenerCategorias();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar categorías:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  listar,
};
