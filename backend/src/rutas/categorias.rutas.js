const express = require("express");
const router = express.Router();

const categoriasControlador = require("../modulos/categorias/categorias.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  categoriasControlador.listar
);

// Crear: Admin, Operador
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  categoriasControlador.crear
);

module.exports = router;
