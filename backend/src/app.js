const express = require("express");
const cors = require("cors");
const autenticacionRutas = require("./rutas/autenticacion.rutas");
const usuariosRutas = require("./rutas/usuarios.rutas");
const productosRutas = require("./rutas/productos.rutas");
const categoriasRutas = require("./rutas/categorias.rutas");
const proveedoresRutas = require("./rutas/proveedores.rutas");

const inventarioRutas = require("./rutas/inventario.rutas");
const comprasRutas = require("./rutas/compras.rutas");
const ventasRutas = require("./rutas/ventas.rutas");
const dashboardRutas = require("./rutas/dashboard.rutas");
const gastosRutas = require("./rutas/gastos.rutas");
const movimientosRutas = require("./rutas/movimientos.rutas");
const clientesRutas = require("./rutas/clientes.rutas");
const reportesRutas = require("./rutas/reportes.rutas");

const app = express();

// Middlewares generales
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ruta de prueba (salud)
app.get("/api/salud", (req, res) => {
  res.json({ mensaje: "✅ API funcionando correctamente" });
});
app.use("/api/autenticacion", autenticacionRutas);
app.use("/api/usuarios", usuariosRutas);

app.use("/api/productos", productosRutas);
app.use("/api/categorias", categoriasRutas);
app.use("/api/proveedores", proveedoresRutas);
app.use("/api/inventario", inventarioRutas);
app.use("/api/compras", comprasRutas);
app.use("/api/ventas", ventasRutas);
app.use("/api/dashboard", dashboardRutas);
app.use("/api/gastos", gastosRutas);
app.use("/api/movimientos", movimientosRutas);
app.use("/api/clientes", clientesRutas);
app.use("/api/reportes", reportesRutas);

module.exports = app;
