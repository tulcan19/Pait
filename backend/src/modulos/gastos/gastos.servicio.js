const gastosRepositorio = require("./gastos.repositorio");

async function registrarGasto({ concepto, monto, observacion, id_usuario }) {
  if (!concepto) return { ok: false, mensaje: "El concepto es obligatorio" };
  if (monto == null || Number(monto) <= 0) return { ok: false, mensaje: "Monto inválido" };

  const gasto = await gastosRepositorio.crearGasto({
    concepto,
    monto: Number(monto),
    observacion,
    id_usuario,
  });

  return { ok: true, gasto };
}

async function obtenerGastos() {
  const gastos = await gastosRepositorio.listarGastos();
  return { ok: true, gastos };
}

module.exports = {
  registrarGasto,
  obtenerGastos,
};
