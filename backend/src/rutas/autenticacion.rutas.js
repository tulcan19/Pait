const express = require("express");
const router = express.Router();

const autenticacionControlador = require("../modulos/autenticacion/autenticacion.controlador");

router.post("/login", autenticacionControlador.login);

module.exports = router;
