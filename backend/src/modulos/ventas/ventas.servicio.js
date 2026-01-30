const repo = require("./ventas.repositorio");

async function registrarVenta({ id_cliente, detalles, id_usuario }) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return { ok: false, mensaje: "La venta debe tener al menos un producto" };
  }

  const client = await repo.pool.connect();

  try {
    await client.query("BEGIN");

    // Calcular total
    let total = 0;
    for (const d of detalles) {
      const subtotal = Number(d.cantidad) * Number(d.precio);
      total += subtotal;
    }

    // Crear venta (cabecera)
    const venta = await repo.crearVenta(client, { id_cliente, total, id_usuario });

    // Procesar detalle + stock + movimiento
    for (const d of detalles) {
      const id_producto = Number(d.id_producto);
      const cantidad = Number(d.cantidad);
      const precio = Number(d.precio);

      if (!id_producto || cantidad <= 0 || precio <= 0) {
        throw new Error("Detalle inválido en la venta");
      }

      const producto = await repo.obtenerProducto(client, id_producto);

      if (!producto) throw new Error(`Producto no encontrado: ${id_producto}`);
      if (!producto.activo) throw new Error("Producto inactivo");

      const stock_anterior = Number(producto.stock);
      if (cantidad > stock_anterior) throw new Error("Stock insuficiente");

      const stock_actual = stock_anterior - cantidad;
      const subtotal = cantidad * precio;

      await repo.insertarDetalle(client, {
        id_venta: venta.id_venta,
        id_producto,
        cantidad,
        precio,
        subtotal,
      });

      await repo.actualizarStock(client, id_producto, stock_actual);

      await repo.registrarMovimiento(client, {
        id_producto,
        tipo: "salida",
        cantidad,
        stock_anterior,
        stock_actual,
        id_usuario,
      });
    }

    await client.query("COMMIT");
    return { ok: true, venta, total };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, mensaje: error.message };
  } finally {
    client.release();
  }
}

async function listarVentas() {
  const ventas = await repo.listarVentas();
  return { ok: true, ventas };
}

async function detalleVenta(id_venta) {
  const data = await repo.detalleVenta(id_venta);
  if (!data.cabecera) return { ok: false, mensaje: "Venta no encontrada" };
  return { ok: true, ...data };
}

module.exports = {
  registrarVenta,
  listarVentas,
  detalleVenta,
};
