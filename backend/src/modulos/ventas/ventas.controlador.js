const ventasServicio = require("./ventas.servicio");

async function crear(req, res) {
  try {
    const { id_cliente, detalles } = req.body;

    if (!id_cliente || !detalles) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const id_usuario = req.usuario.id_usuario;

    const resultado = await ventasServicio.registrarVenta({
      id_cliente: Number(id_cliente),
      detalles,
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Venta registrada", ...resultado });
  } catch (error) {
    console.error("Error crear venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await ventasServicio.listarVentas();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar ventas:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function detalle(req, res) {
  try {
    const id_venta = Number(req.params.id_venta);
    if (!id_venta) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await ventasServicio.detalleVenta(id_venta);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json(resultado);
  } catch (error) {
    console.error("Error detalle venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  listar,
  detalle,
};
