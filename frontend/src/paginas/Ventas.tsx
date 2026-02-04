import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { 
  formatearDinero, 
  validarCantidad, 
  validarStockDisponible,
  validarNombre 
} from "../helpers/validaciones";

type Cliente = {
  id_cliente: number;
  nombre: string;
  cedula?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo: boolean;
};

type Producto = {
  id_producto: number;
  nombre: string;
  precio: string;
  stock: number;
  activo: boolean;
  imagen?: string | null;
  categoria?: string;
};

type Venta = {
  id_venta: number;
  fecha: string;
  total: string;
  estado: string;
  cliente: string;
  usuario: string;
  metodo_pago?: string;
};

type DetalleItem = {
  id_detalle: number;
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: string;
  subtotal: string;
  imagen?: string | null;
};

type VentaDetalle = {
  ok: boolean;
  cabecera: {
    id_venta: number;
    fecha: string;
    total: string;
    estado: string;
    id_cliente: number;
    cliente: string;
    id_usuario: number;
    usuario: string;
    metodo_pago?: string;
  };
  detalle: DetalleItem[];
};

type CarritoItem = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  stock_disponible: number;
  imagen?: string | null;
};

type MetodoPago = "efectivo" | "transferencia" | "tarjeta";

const metodosPago: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "tarjeta", etiqueta: "Tarjeta" },
];

// Cliente por defecto para consumidor final
const CONSUMIDOR_FINAL = {
  id_cliente: 0,
  nombre: "Consumidor Final",
  activo: true,
};

const Ventas = ({ volver }: { volver: () => void }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [detalleVenta, setDetalleVenta] = useState<VentaDetalle | null>(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario de venta
  const [idCliente, setIdCliente] = useState<number>(0);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // Modal nuevo cliente
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cedula: "", telefono: "" });

  // Permisos
  const puedeRegistrar = esAdmin() || esOperador();
  const puedeAnular = esAdmin() || esSupervisor();

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Productos activos filtrados
  const productosActivos = useMemo(() => {
    let lista = productos.filter((p) => p.activo && p.stock > 0);
    
    if (busquedaProducto.trim()) {
      const termino = busquedaProducto.toLowerCase();
      lista = lista.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        (p.categoria || "").toLowerCase().includes(termino)
      );
    }
    
    return lista;
  }, [productos, busquedaProducto]);

  // Total del carrito
  const totalCarrito = useMemo(
    () => carrito.reduce((acc, it) => acc + it.subtotal, 0),
    [carrito]
  );

  // Mostrar mensaje
  const mostrarMensajeUI = (texto: string, tipo: "exito" | "error" | "advertencia") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (tipo === "exito") {
      setTimeout(() => setMensaje(""), 4000);
    }
  };

  // Cargar datos
  const cargarTodo = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respCli, respProd, respVen] = await Promise.all([
        api.get("/clientes", { headers }),
        api.get("/productos", { headers }),
        api.get("/ventas", { headers }),
      ]);

      const listaCli: Cliente[] = respCli.data.clientes || [];
      const listaProd: Producto[] = respProd.data.productos || [];
      const listaVen: Venta[] = respVen.data.ventas || [];

      // Agregar consumidor final a la lista
      setClientes([CONSUMIDOR_FINAL, ...listaCli.filter((c) => c.activo)]);
      setProductos(listaProd);
      setVentas(listaVen);

      // Seleccionar primer producto disponible
      const activos = listaProd.filter((p) => p.activo && p.stock > 0);
      if (activos.length > 0) setIdProducto(activos[0].id_producto);

    } catch {
      mostrarMensajeUI("No se pudieron cargar los datos. Verifica la conexión.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agregar producto al carrito
  const agregarAlCarrito = () => {
    setMensaje("");

    if (!puedeRegistrar) {
      mostrarMensajeUI("No tienes permisos para registrar ventas", "error");
      return;
    }

    if (!idProducto) {
      mostrarMensajeUI("Selecciona un producto", "advertencia");
      return;
    }

    // Validar cantidad
    const validacionCantidad = validarCantidad(cantidad, 1, 9999);
    if (!validacionCantidad.valido) {
      mostrarMensajeUI(validacionCantidad.mensaje!, "advertencia");
      return;
    }

    const prod = productos.find((p) => p.id_producto === idProducto);
    if (!prod) {
      mostrarMensajeUI("Producto no encontrado", "error");
      return;
    }

    if (!prod.activo) {
      mostrarMensajeUI("Este producto está inactivo y no se puede vender", "advertencia");
      return;
    }

    // Calcular cantidad ya en carrito
    const enCarrito = carrito.find(x => x.id_producto === prod.id_producto);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidad;

    // Validar stock disponible
    const validacionStock = validarStockDisponible(prod.stock, cantidadTotal);
    if (!validacionStock.valido) {
      mostrarMensajeUI(validacionStock.mensaje!, "advertencia");
      return;
    }

    const precioNum = Number(prod.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      mostrarMensajeUI("El producto tiene un precio inválido", "error");
      return;
    }

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => x.id_producto === prod.id_producto);
      
      if (idx >= 0) {
        // Actualizar cantidad existente
        const copia = [...prev];
        copia[idx] = {
          ...copia[idx],
          cantidad: cantidadTotal,
          subtotal: cantidadTotal * copia[idx].precio,
        };
        return copia;
      }

      // Agregar nuevo item
      return [...prev, {
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        cantidad,
        precio: precioNum,
        subtotal: cantidad * precioNum,
        stock_disponible: prod.stock,
        imagen: prod.imagen || null,
      }];
    });

    setCantidad(1);
    setBusquedaProducto("");
    mostrarMensajeUI(`${prod.nombre} agregado al carrito`, "exito");
  };

  // Modificar cantidad en carrito
  const modificarCantidadCarrito = (id_producto: number, nuevaCantidad: number) => {
    const item = carrito.find(x => x.id_producto === id_producto);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      quitarItem(id_producto);
      return;
    }

    const validacionStock = validarStockDisponible(item.stock_disponible, nuevaCantidad);
    if (!validacionStock.valido) {
      mostrarMensajeUI(validacionStock.mensaje!, "advertencia");
      return;
    }

    setCarrito((prev) =>
      prev.map((x) =>
        x.id_producto === id_producto
          ? { ...x, cantidad: nuevaCantidad, subtotal: nuevaCantidad * x.precio }
          : x
      )
    );
  };

  // Quitar item del carrito
  const quitarItem = (id_producto: number) => {
    setCarrito((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  // Vaciar carrito
  const vaciar = () => {
    setCarrito([]);
    setDetalleVenta(null);
    setMensaje("");
    setIdCliente(0);
  };

  // Confirmar venta
  const confirmarVenta = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      mostrarMensajeUI("No tienes permisos para registrar ventas", "error");
      return;
    }

    if (carrito.length === 0) {
      mostrarMensajeUI("Agrega al menos un producto al carrito", "advertencia");
      return;
    }

    setProcesando(true);

    try {
      const payload = {
        id_cliente: idCliente || null, // null para consumidor final
        metodo_pago: metodoPago,
        detalles: carrito.map((it) => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio: it.precio,
        })),
      };

      const resp = await api.post("/ventas", payload, { headers });
      const idVentaCreada = resp?.data?.venta?.id_venta;

      mostrarMensajeUI("Venta registrada exitosamente", "exito");

      // Refrescar datos
      await cargarTodo();

      // Mostrar detalle de la venta
      if (idVentaCreada) {
        const det = await api.get(`/ventas/${idVentaCreada}`, { headers });
        setDetalleVenta(det.data);
      }

      setCarrito([]);
      setIdCliente(0);
      setMetodoPago("efectivo");

    } catch (error: any) {
      const msg = error?.response?.data?.mensaje;
      if (error?.response?.status === 400) {
        mostrarMensajeUI(msg || "Datos inválidos o stock insuficiente", "error");
      } else if (error?.response?.status === 403) {
        mostrarMensajeUI("No tienes permisos para esta acción", "error");
      } else {
        mostrarMensajeUI(`Error al registrar venta. ${msg || ""}`, "error");
      }
    } finally {
      setProcesando(false);
    }
  };

  // Ver detalle de venta
  const verDetalle = async (id_venta: number) => {
    setMensaje("");
    try {
      const resp = await api.get(`/ventas/${id_venta}`, { headers });
      setDetalleVenta(resp.data);
    } catch {
      mostrarMensajeUI("No se pudo cargar el detalle de la venta", "error");
    }
  };

  // Abrir PDF
  const abrirPdf = (id_venta: number) => {
    const token = obtenerToken();
    const url = `http://localhost:3000/api/reportes/ventas/${id_venta}/pdf?token=${token}`;
    window.open(url, "_blank");
  };

  // Anular venta
  const anularVenta = async (id_venta: number) => {
    if (!puedeAnular) {
      mostrarMensajeUI("Solo Administrador o Supervisor pueden anular ventas", "error");
      return;
    }

    const motivo = window.prompt("Ingresa el motivo de la anulación (obligatorio):");
    if (!motivo || !motivo.trim()) {
      mostrarMensajeUI("Debes ingresar un motivo para anular", "advertencia");
      return;
    }

    try {
      await api.patch(`/ventas/${id_venta}/anular`, { motivo: motivo.trim() }, { headers });
      mostrarMensajeUI("Venta anulada correctamente. Stock revertido.", "exito");
      await cargarTodo();
      setDetalleVenta(null);
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al anular la venta";
      mostrarMensajeUI(msg, "error");
    }
  };

  // Crear nuevo cliente rápido
  const crearClienteRapido = async () => {
    const validacion = validarNombre(nuevoCliente.nombre, 2, 150);
    if (!validacion.valido) {
      mostrarMensajeUI(validacion.mensaje!, "advertencia");
      return;
    }

    try {
      const resp = await api.post("/clientes", {
        nombre: nuevoCliente.nombre.trim(),
        cedula: nuevoCliente.cedula.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null,
      }, { headers });

      const nuevoId = resp.data.cliente?.id_cliente;
      
      await cargarTodo();
      
      if (nuevoId) {
        setIdCliente(nuevoId);
      }
      
      setMostrarNuevoCliente(false);
      setNuevoCliente({ nombre: "", cedula: "", telefono: "" });
      mostrarMensajeUI("Cliente creado y seleccionado", "exito");
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al crear cliente";
      mostrarMensajeUI(msg, "error");
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Ventas</h1>
          <div className="badge">
            <span>🧾</span>
            <span>Registro y control de ventas</span>
            <span className={`pill ${esSupervisor() ? "advertencia" : "primario"}`}>
              {esSupervisor() ? "Solo lectura" : "Registro habilitado"}
            </span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Formulario de venta */}
      {puedeRegistrar && (
        <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
          <p className="card-titulo">Nueva Venta</p>

          <div className="form-grid">
            {/* Cliente */}
            <div className="campo">
              <label className="label">Cliente</label>
              <div style={{ display: "flex", gap: "var(--espaciado-sm)" }}>
                <select
                  className="select"
                  style={{ flex: 1 }}
                  value={idCliente}
                  onChange={(e) => setIdCliente(Number(e.target.value))}
                >
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} {c.cedula ? `(${c.cedula})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secundario"
                  onClick={() => setMostrarNuevoCliente(true)}
                  title="Crear nuevo cliente"
                >
                  +
                </button>
              </div>
            </div>

            {/* Método de pago */}
            <div className="campo">
              <label className="label">Método de pago</label>
              <select
                className="select"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
              >
                {metodosPago.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {/* Buscar producto */}
            <div className="campo full">
              <label className="label">Buscar producto</label>
              <input
                className="input"
                placeholder="Escribe para filtrar productos..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
              />
            </div>

            {/* Producto */}
            <div className="campo">
              <label className="label">Producto</label>
              <select
                className="select"
                value={idProducto}
                onChange={(e) => setIdProducto(Number(e.target.value))}
              >
                <option value={0}>-- Seleccionar --</option>
                {productosActivos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre} | Stock: {p.stock} | ${formatearDinero(p.precio)}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="campo">
              <label className="label">Cantidad</label>
              <div style={{ display: "flex", gap: "var(--espaciado-sm)", alignItems: "center" }}>
                <button
                  className="btn-secundario btn-sm"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                >
                  -
                </button>
                <input
                  className="input"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  min={1}
                  style={{ width: 80, textAlign: "center" }}
                />
                <button
                  className="btn-secundario btn-sm"
                  onClick={() => setCantidad(cantidad + 1)}
                >
                  +
                </button>
                <button className="btn-primario" onClick={agregarAlCarrito}>
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Carrito */}
          <div style={{ marginTop: "var(--espaciado-md)" }}>
            <div className="fila-entre" style={{ marginBottom: "var(--espaciado-sm)" }}>
              <span style={{ fontWeight: 600 }}>Carrito ({carrito.length} items)</span>
              <div className="badge">
                <span>Total:</span>
                <span className="pill primario" style={{ fontSize: "var(--texto-lg)" }}>
                  $ {formatearDinero(totalCarrito)}
                </span>
              </div>
            </div>

            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Img</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.id_producto}>
                      <td>
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="tabla-imagen"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="tabla-imagen-placeholder">📦</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                      <td>$ {formatearDinero(item.precio)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--espaciado-xs)" }}>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => modificarCantidadCarrito(item.id_producto, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <span style={{ minWidth: 30, textAlign: "center" }}>{item.cantidad}</span>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => modificarCantidadCarrito(item.id_producto, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>$ {formatearDinero(item.subtotal)}</td>
                      <td>
                        <button
                          className="btn-peligro btn-sm"
                          onClick={() => quitarItem(item.id_producto)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carrito.length === 0 && (
                    <tr>
                      <td colSpan={6} className="loading">
                        No hay productos en el carrito
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-end" }}>
              <button className="btn-secundario" onClick={vaciar} disabled={carrito.length === 0}>
                Vaciar carrito
              </button>
              <button
                className="btn-primario"
                onClick={confirmarVenta}
                disabled={procesando || carrito.length === 0}
              >
                {procesando ? "Procesando..." : `Confirmar Venta ($${formatearDinero(totalCarrito)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      {/* Grid de listado y detalle */}
      <div className="grid-dos">
        {/* Listado de ventas */}
        <div className="card">
          <p className="card-titulo">Historial de Ventas</p>

          {cargando ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando ventas...
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.id_venta}>
                      <td>{new Date(v.fecha).toLocaleDateString()}</td>
                      <td className="truncar" style={{ maxWidth: 120 }}>{v.cliente}</td>
                      <td style={{ fontWeight: 600 }}>$ {formatearDinero(v.total)}</td>
                      <td>
                        <span className={`pill ${v.estado === "registrada" ? "exito" : v.estado === "anulada" ? "error" : ""}`}>
                          {v.estado}
                        </span>
                      </td>
                      <td>
                        <div className="acciones">
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => verDetalle(v.id_venta)}
                          >
                            Ver
                          </button>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => abrirPdf(v.id_venta)}
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ventas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="loading">
                        No hay ventas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detalle de venta */}
        <div className="card">
          <p className="card-titulo">Detalle de Venta</p>

          {!detalleVenta ? (
            <div className="loading">
              Selecciona una venta para ver el detalle
            </div>
          ) : (
            <>
              <div className="badge" style={{ marginBottom: "var(--espaciado-md)", flexWrap: "wrap" }}>
                <span className="pill primario">#{detalleVenta.cabecera.id_venta}</span>
                <span>{detalleVenta.cabecera.cliente}</span>
                <span className="pill">{detalleVenta.cabecera.metodo_pago || "efectivo"}</span>
                <span className={`pill ${detalleVenta.cabecera.estado === "registrada" ? "exito" : "error"}`}>
                  {detalleVenta.cabecera.estado}
                </span>
              </div>

              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>Img</th>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVenta.detalle.map((d) => (
                      <tr key={d.id_detalle}>
                        <td>
                          {d.imagen ? (
                            <img src={d.imagen} alt={d.nombre} className="tabla-imagen" />
                          ) : (
                            <div className="tabla-imagen-placeholder">📦</div>
                          )}
                        </td>
                        <td>{d.nombre}</td>
                        <td>{d.cantidad}</td>
                        <td>$ {formatearDinero(d.precio)}</td>
                        <td style={{ fontWeight: 600 }}>$ {formatearDinero(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>TOTAL:</td>
                      <td style={{ fontWeight: 700, fontSize: "var(--texto-lg)" }}>
                        $ {formatearDinero(detalleVenta.cabecera.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ marginTop: "var(--espaciado-md)", fontSize: "var(--texto-sm)", color: "var(--color-texto-muted)" }}>
                <div>Fecha: {new Date(detalleVenta.cabecera.fecha).toLocaleString()}</div>
                <div>Vendedor: {detalleVenta.cabecera.usuario}</div>
              </div>

              {puedeAnular && detalleVenta.cabecera.estado === "registrada" && (
                <div style={{ marginTop: "var(--espaciado-md)" }}>
                  <button
                    className="btn-peligro"
                    onClick={() => anularVenta(detalleVenta.cabecera.id_venta)}
                  >
                    Anular Venta
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {mostrarNuevoCliente && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "var(--z-modal)",
            padding: "var(--espaciado-md)",
          }}
          onClick={() => setMostrarNuevoCliente(false)}
        >
          <div 
            className="card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-titulo">Nuevo Cliente Rápido</p>
            
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="campo">
                <label className="label requerido">Nombre</label>
                <input
                  className="input"
                  placeholder="Nombre del cliente"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="campo">
                <label className="label">Cédula</label>
                <input
                  className="input"
                  placeholder="Cédula (opcional)"
                  value={nuevoCliente.cedula}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })}
                  maxLength={10}
                />
              </div>
              <div className="campo">
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  placeholder="Teléfono (opcional)"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-end" }}>
              <button className="btn-secundario" onClick={() => setMostrarNuevoCliente(false)}>
                Cancelar
              </button>
              <button className="btn-primario" onClick={crearClienteRapido}>
                Crear y Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
