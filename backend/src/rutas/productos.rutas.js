const express = require("express");
const router = express.Router();

const productosControlador = require("../modulos/productos/productos.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { validarImagenSubida, validarDatosImagen } = require("../middlewares/imagen.middleware");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  productosControlador.listar
);

// Crear: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  productosControlador.crear
);

// Actualizar: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.put(
  "/:id_producto",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  productosControlador.actualizar
);

// Desactivar: SOLO Admin
router.delete(
  "/:id_producto",
  verificarToken,
  permitirRoles("Administrador"),
  productosControlador.desactivar
);
// Activar: Admin, Operador
router.patch(
  "/:id_producto/activar",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  productosControlador.activar
);

module.exports = router;
