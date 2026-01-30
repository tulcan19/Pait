import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { puedeSubirImagenes } from "../helpers/imagenHelper";

type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  activo: boolean;
};

type Producto = {
  id_producto: number;
  nombre: string;
  precio: string; // viene como string desde Postgres
  stock: number;
  activo: boolean;
  imagen?: string | null;
};

type Venta = {
  id_venta: number;
  fecha: string;
  total: string;
  estado: string;
  cliente: string;
  usuario: string;
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
  };
  detalle: DetalleItem[];
};

type CarritoItem = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number; // number para cálculos
  subtotal: number;
  imagen?: string | null;
};

const money = (v: number) => v.toFixed(2);


const Ventas = ({ volver }: { volver: () => void }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [detalleVenta, setDetalleVenta] = useState<VentaDetalle | null>(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  
const abrirPdf = (id_venta: number) => {
  const token = obtenerToken();
  const url = `http://localhost:3000/api/reportes/ventas/${id_venta}/pdf?token=${token}`;
  window.open(url, "_blank");
};

  // formulario
  const [idCliente, setIdCliente] = useState<number>(0);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);

  // carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const puedeRegistrar = esAdmin() || esOperador(); // Supervisor solo lectura

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const productosActivos = useMemo(
    () => productos.filter((p) => p.activo),
    [productos]
  );

  const totalCarrito = useMemo(
    () => carrito.reduce((acc, it) => acc + it.subtotal, 0),
    [carrito]
  );

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

      setClientes(listaCli.filter((c) => c.activo));
      setProductos(listaProd);
      setVentas(listaVen);

      // defaults
      if (listaCli.length > 0) setIdCliente(listaCli[0].id_cliente);

      const activos = listaProd.filter((p) => p.activo);
      if (activos.length > 0) setIdProducto(activos[0].id_producto);
    } catch (e: any) {
      setMensaje("❌ No se pudo cargar clientes/productos/ventas. Revisa token/backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregarAlCarrito = () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje("⛔ Supervisor no puede registrar ventas.");
      return;
    }

    if (!idCliente) {
      setMensaje("⚠️ Selecciona un cliente.");
      return;
    }

    if (!idProducto) {
      setMensaje("⚠️ Selecciona un producto.");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setMensaje("⚠️ La cantidad debe ser mayor a 0.");
      return;
    }

    const prod = productos.find((p) => p.id_producto === idProducto);
    if (!prod) {
      setMensaje("⚠️ Producto no encontrado.");
      return;
    }

    if (!prod.activo) {
      setMensaje("⚠️ Producto inactivo. No se puede vender.");
      return;
    }

    if (cantidad > prod.stock) {
      setMensaje("⚠️ Stock insuficiente para ese producto.");
      return;
    }

    const precioNum = Number(prod.precio);
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      setMensaje("⚠️ Precio inválido en el producto.");
      return;
    }

    setCarrito((prev) => {
      // si ya existe, sumamos cantidad
      const idx = prev.findIndex((x) => x.id_producto === prod.id_producto);
      if (idx >= 0) {
        const copia = [...prev];
        const nuevoCant = copia[idx].cantidad + cantidad;

        if (nuevoCant > prod.stock) {
          setMensaje("⚠️ Con esa suma, se excede el stock disponible.");
          return prev;
        }

        copia[idx] = {
          ...copia[idx],
          cantidad: nuevoCant,
          subtotal: nuevoCant * copia[idx].precio,
        };
        return copia;
      }

      const item: CarritoItem = {
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        cantidad,
        precio: precioNum,
        subtotal: cantidad * precioNum,
        imagen: prod.imagen || null,
      };
      return [...prev, item];
    });

    setCantidad(1);
  };

  const quitarItem = (id_producto: number) => {
    setCarrito((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  const vaciar = () => {
    setCarrito([]);
    setDetalleVenta(null);
    setMensaje("");
  };

  const confirmarVenta = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje("⛔ No tienes permisos para registrar ventas.");
      return;
    }

    if (!idCliente) {
      setMensaje("⚠️ Selecciona un cliente.");
      return;
    }

    if (carrito.length === 0) {
      setMensaje("⚠️ Agrega al menos un producto.");
      return;
    }

    try {
      const payload = {
        id_cliente: idCliente,
        detalles: carrito.map((it) => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio: it.precio, // backend lo acepta como number
        })),
      };

      const resp = await api.post("/ventas", payload, { headers });

      const idVentaCreada = resp?.data?.venta?.id_venta;
      setMensaje("✅ Venta registrada");

      // refrescar listas + stocks
      await cargarTodo();

      // traer detalle para mostrarlo a la derecha (si vino id)
      if (idVentaCreada) {
        const det = await api.get(`/ventas/${idVentaCreada}`, { headers });
        setDetalleVenta(det.data);
      }

      setCarrito([]);
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;
      if (e?.response?.status === 400) {
        setMensaje(`⚠️ ${msg || "Datos inválidos o stock insuficiente."}`);
      } else if (e?.response?.status === 403) {
        setMensaje("⛔ No tienes permisos para esta acción.");
      } else {
        setMensaje(`❌ Error al registrar venta. ${msg ? `(${msg})` : ""}`);
      }
    }
  };

  const verDetalle = async (id_venta: number) => {
    setMensaje("");
    try {
      const resp = await api.get(`/ventas/${id_venta}`, { headers });
      setDetalleVenta(resp.data);
    } catch {
      setMensaje("❌ No se pudo cargar el detalle de la venta.");
    }
  };

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Ventas</h1>
          <div className="badge">
            <span>🧾</span>
            <span>Registro y control de ventas</span>
            <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORM REGISTRAR VENTA */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">Registrar venta</p>

        <div className="form-grid">
          <select
            className="select full"
            value={idCliente}
            onChange={(e) => setIdCliente(Number(e.target.value))}
            disabled={!puedeRegistrar}
          >
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            className="select full"
            value={idProducto}
            onChange={(e) => setIdProducto(Number(e.target.value))}
            disabled={!puedeRegistrar}
          >
            {productosActivos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre} (stock: {p.stock})
              </option>
            ))}
          </select>

          <input
            className="input"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            min={1}
            disabled={!puedeRegistrar}
            placeholder="Cantidad"
          />

          <div className="fila" style={{ justifyContent: "center", gap: 10 }}>
            <button className="btn-secundario" onClick={agregarAlCarrito} disabled={!puedeRegistrar}>
              + Agregar
            </button>

            <button className="btn-primario" onClick={confirmarVenta} disabled={!puedeRegistrar}>
              Confirmar
            </button>
          </div>
        </div>

        <div className="fila" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div className="badge">
            <span>Total:</span>
            <span className="pill">$ {money(totalCarrito)}</span>
          </div>

          <button className="btn-salir" onClick={vaciar}>
            Vaciar
          </button>
        </div>

        {/* TABLA CARRITO */}
        <table className="tabla" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>Imagen</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((it) => (
              <tr key={it.id_producto}>
                <td>
                  {it.imagen ? (
                    <img
                      src={it.imagen}
                      alt={it.nombre}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: "1px solid #334155",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: "#1e293b",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        fontSize: 20,
                      }}
                    >
                      📦
                    </div>
                  )}
                </td>
                <td>{it.nombre}</td>
                <td>{it.cantidad}</td>
                <td>$ {money(it.precio)}</td>
                <td>$ {money(it.subtotal)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn-salir" onClick={() => quitarItem(it.id_producto)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}

            {carrito.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay productos agregados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!puedeRegistrar && (
          <div className="mensaje">⛔ Supervisor: solo puede visualizar.</div>
        )}
      </div>

      {/* LISTADO + DETALLE */}
      <div className="grid-dos">
        <div className="card">
          <p className="card-titulo">Listado</p>

          {cargando ? (
            <div className="loading">Cargando ventas...</div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id_venta}>
                    <td>{new Date(v.fecha).toLocaleString()}</td>
                    <td>{v.cliente}</td>
                    <td>$ {Number(v.total).toFixed(2)}</td>
                    <td>
                      <span className="pill">{v.estado}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-salir" onClick={() => verDetalle(v.id_venta)}>
                        Ver
                      </button>

                        <button className="btn-secundario" onClick={() => abrirPdf(v.id_venta)}>
    PDF
  </button>
                    </td>
                  </tr>
                ))}

                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: "#cbd5e1" }}>
                      No hay ventas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <p className="card-titulo">Detalle</p>

          {!detalleVenta ? (
            <div className="loading">Selecciona una venta para ver el detalle.</div>
          ) : (
            <>
              <div className="badge" style={{ marginBottom: 12 }}>
                <span className="pill">
                  Venta #{detalleVenta.cabecera.id_venta}
                </span>
                <span>
                  {detalleVenta.cabecera.cliente} — $ {Number(detalleVenta.cabecera.total).toFixed(2)}
                </span>
                <span className="pill">{detalleVenta.cabecera.estado}</span>
              </div>

              <table className="tabla">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Imagen</th>
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
                          <img
                            src={d.imagen}
                            alt={d.nombre}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #334155",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              backgroundColor: "#1e293b",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#64748b",
                              fontSize: 24,
                            }}
                          >
                            📦
                          </div>
                        )}
                      </td>
                      <td>{d.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>$ {Number(d.precio).toFixed(2)}</td>
                      <td>$ {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {mensaje && <div className="mensaje">{mensaje}</div>}
    </div>
  );
};

export default Ventas;
