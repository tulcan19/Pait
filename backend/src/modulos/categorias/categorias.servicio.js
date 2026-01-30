const categoriasRepositorio = require("./categorias.repositorio");

async function registrarCategoria({ nombre, descripcion }) {
  const categoria = await categoriasRepositorio.crearCategoria({ nombre, descripcion });
  return { ok: true, categoria };
}

async function obtenerCategorias() {
  const categorias = await categoriasRepositorio.listarCategorias();
  return { ok: true, categorias };
}

module.exports = {
  registrarCategoria,
  obtenerCategorias,
};
