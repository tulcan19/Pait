const autenticacionServicio = require("./autenticacion.servicio");

async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    const resultado = await autenticacionServicio.iniciarSesion(correo, contrasena);

    if (!resultado.ok) {
      return res.status(401).json({ mensaje: resultado.mensaje });
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  login,
};
