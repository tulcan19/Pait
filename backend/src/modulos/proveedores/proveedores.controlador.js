const servicio = require("./proveedores.servicio");

async function listar(req, res) {
  try {
    const resultado = await servicio.obtenerProveedores();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar proveedores:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function crear(req, res) {
  try {
    const { nombre, telefono, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: "Nombre es obligatorio" });
    }

    const resultado = await servicio.registrarProveedor({
      nombre,
      telefono,
      correo,
    });

    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    return res.status(201).json(resultado);
  } catch (error) {
    console.error("Error crear proveedor:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function editar(req, res) {
  try {
    const id_proveedor = Number(req.params.id_proveedor);
    const { nombre, telefono, correo } = req.body;

    if (!id_proveedor) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const resultado = await servicio.editarProveedor(id_proveedor, {
      nombre,
      telefono,
      correo,
    });

    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error editar proveedor:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function desactivar(req, res) {
  try {
    const id_proveedor = Number(req.params.id_proveedor);

    if (!id_proveedor) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const resultado = await servicio.cambiarEstadoProveedor(id_proveedor, false);

    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error desactivar proveedor:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function activar(req, res) {
  try {
    const id_proveedor = Number(req.params.id_proveedor);

    if (!id_proveedor) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const resultado = await servicio.cambiarEstadoProveedor(id_proveedor, true);

    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error activar proveedor:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  crear,
  editar,
  desactivar,
  activar,
};
