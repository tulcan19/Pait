const express = require("express");
const router = express.Router();

const inventarioControlador = require("../modulos/inventario/inventario.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Listar movimientos: Admin, Operador, Supervisor
router.get(
  "/movimientos",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  inventarioControlador.listar
);

// Registrar movimiento: Admin, Operador
router.post(
  "/movimientos",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  inventarioControlador.registrar
);

module.exports = router;
