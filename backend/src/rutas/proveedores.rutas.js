const express = require("express");
const router = express.Router();

const ctrl = require("../modulos/proveedores/proveedores.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.listar
);

// Crear: Admin, Operador
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.crear
);

// Editar: Admin, Operador
router.put(
  "/:id_proveedor",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.editar
);

// Desactivar: Admin
router.delete(
  "/:id_proveedor",
  verificarToken,
  permitirRoles("Administrador"),
  ctrl.desactivar
);

// Activar: Admin, Operador
router.patch(
  "/:id_proveedor/activar",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.activar
);

module.exports = router;
