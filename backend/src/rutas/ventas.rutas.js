const express = require("express");
const router = express.Router();

const ventasControlador = require("../modulos/ventas/ventas.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { validarImagenSubida, validarDatosImagen } = require("../middlewares/imagen.middleware");

// Listar ventas: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ventasControlador.listar
);

// Detalle de una venta: Admin, Operador, Supervisor
router.get(
  "/:id_venta",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ventasControlador.detalle
);

// Crear venta: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  ventasControlador.crear
);

module.exports = router;
