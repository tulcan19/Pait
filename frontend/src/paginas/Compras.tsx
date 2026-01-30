import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { puedeSubirImagenes } from "../helpers/imagenHelper";

type Proveedor = {
  id_proveedor: number;
  nombre: string;
  activo: boolean;
};

type Producto = {
  id_producto: number;
  nombre: string;
  stock: number;
  activo: boolean;
  imagen?: string | null;
};

type Compra = {
  id_compra: number;
  fecha: string;
  total: string;
  estado: string;
  proveedor: string;
  usuario: string;
};

type DetalleItem = {
  id_detalle: number;
  id_producto: number;
  nombre: string;
  cantidad: number;
  costo: string;
  subtotal: string;
  imagen?: string | null;
};

type CompraDetalle = {
  ok: boolean;
  cabecera: {
    id_compra: number;
    fecha: string;
    total: string;
    estado: string;
    id_proveedor: number;
    proveedor: string;
    id_usuario: number;
    usuario: string;
  };
  detalle: DetalleItem[];
};

type CarritoItem = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  costo: number;
  subtotal: number;
};

const money = (v: number) => v.toFixed(2);

const Compras = ({ volver }: { volver: () => void }) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [detalleCompra, setDetalleCompra] = useState<CompraDetalle | null>(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // formulario
  const [idProveedor, setIdProveedor] = useState<number>(0);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [costo, setCosto] = useState<number>(1);

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const puedeRegistrar = esAdmin() || esOperador(); // Supervisor solo lectura

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const productosActivos = productos.filter((p) => p.activo);
  const proveedoresActivos = proveedores.filter((p) => p.activo);

  const totalCarrito = carrito.reduce((acc, it) => acc + it.subtotal, 0);

  const cargarTodo = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProv, respProd, respComp] = await Promise.all([
        api.get("/proveedores", { headers }),
        api.get("/productos", { headers }),
        api.get("/compras", { headers }),
      ]);

      const listaProv: Proveedor[] = respProv.data.proveedores || [];
      const listaProd: Producto[] = respProd.data.productos || [];
      const listaComp: Compra[] = respComp.data.compras || [];

      setProveedores(listaProv);
      setProductos(listaProd);
      setCompras(listaComp);

      if (listaProv.length > 0) setIdProveedor(listaProv[0].id_proveedor);

      const activos = listaProd.filter((p) => p.activo);
      if (activos.length > 0) setIdProducto(activos[0].id_producto);
    } catch (e: any) {
      console.error("Error cargando compras:", e);
      
      if (e?.response?.data?.mensaje) {
        setMensaje(`❌ ${e.response.data.mensaje}`);
      } else if (e?.response?.status === 401) {
        setMensaje("❌ Token inválido o expirado. Inicia sesión de nuevo.");
      } else if (e?.response?.status === 403) {
        setMensaje("❌ No tienes permisos para acceder a esta sección.");
      } else if (e?.message?.includes("Network Error")) {
        setMensaje("❌ Error de conexión. Verifica que el backend está corriendo.");
      } else {
        setMensaje("❌ Error al cargar proveedores/productos/compras. Revisa backend.");
      }
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
      setMensaje("⛔ Supervisor no puede registrar compras.");
      return;
    }

    if (!idProveedor) return setMensaje("⚠️ Selecciona un proveedor.");
    if (!idProducto) return setMensaje("⚠️ Selecciona un producto.");
    if (!cantidad || cantidad <= 0) return setMensaje("⚠️ Cantidad debe ser > 0.");
    if (!costo || costo <= 0) return setMensaje("⚠️ Costo debe ser > 0.");

    const prod = productos.find((p) => p.id_producto === idProducto);
    if (!prod) return setMensaje("⚠️ Producto no encontrado.");
    if (!prod.activo) return setMensaje("⚠️ Producto inactivo.");

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => x.id_producto === idProducto);
      if (idx >= 0) {
        const copia = [...prev];
        const nuevoCant = copia[idx].cantidad + cantidad;
        copia[idx] = {
          ...copia[idx],
          cantidad: nuevoCant,
          subtotal: nuevoCant * copia[idx].costo,
        };
        return copia;
      }

      return [
        ...prev,
        {
          id_producto: prod.id_producto,
          nombre: prod.nombre,
          cantidad,
          costo,
          subtotal: cantidad * costo,
          imagen: prod.imagen || null,
        },
      ];
    });

    setCantidad(1);
  };

  const quitarItem = (id_producto: number) => {
    setCarrito((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  const vaciar = () => {
    setCarrito([]);
    setDetalleCompra(null);
    setMensaje("");
  };

  const confirmarCompra = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje("⛔ No tienes permisos para registrar compras.");
      return;
    }
    if (!idProveedor) return setMensaje("⚠️ Selecciona un proveedor.");
    if (carrito.length === 0) return setMensaje("⚠️ Agrega al menos un producto.");

    try {
      const payload = {
        id_proveedor: idProveedor,
        detalles: carrito.map((it) => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          costo: it.costo,
        })),
      };

      const resp = await api.post("/compras", payload, { headers });
      const idCompraCreada = resp?.data?.compra?.id_compra;

      setMensaje("✅ Compra registrada");
      await cargarTodo();

      if (idCompraCreada) {
        const det = await api.get(`/compras/${idCompraCreada}`, { headers });
        setDetalleCompra(det.data);
      }

      setCarrito([]);
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;
      if (e?.response?.status === 400) setMensaje(`⚠️ ${msg || "Datos inválidos."}`);
      else if (e?.response?.status === 403) setMensaje("⛔ No tienes permisos.");
      else setMensaje(`❌ Error al registrar compra. ${msg ? `(${msg})` : ""}`);
    }
  };

  const verDetalle = async (id_compra: number) => {
    setMensaje("");
    try {
      const resp = await api.get(`/compras/${id_compra}`, { headers });
      setDetalleCompra(resp.data);
    } catch {
      setMensaje("❌ No se pudo cargar el detalle de la compra.");
    }
  };

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Compras</h1>
          <div className="badge">
            <span>📦</span>
            <span>Registro y control de compras</span>
            <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">Registrar compra</p>

        <div className="form-grid">
          <select
            className="select full"
            value={idProveedor}
            onChange={(e) => setIdProveedor(Number(e.target.value))}
            disabled={!puedeRegistrar}
          >
            {proveedoresActivos.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre}
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

          <input
            className="input"
            type="number"
            value={costo}
            onChange={(e) => setCosto(Number(e.target.value))}
            min={0.01}
            step={0.01}
            disabled={!puedeRegistrar}
            placeholder="Costo"
          />

          <div className="fila" style={{ justifyContent: "center", gap: 10 }}>
            <button className="btn-secundario" onClick={agregarAlCarrito} disabled={!puedeRegistrar}>
              + Agregar
            </button>

            <button className="btn-primario" onClick={confirmarCompra} disabled={!puedeRegistrar}>
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

        <table className="tabla" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>Imagen</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Costo</th>
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
                <td>$ {money(it.costo)}</td>
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

        {!puedeRegistrar && <div className="mensaje">⛔ Supervisor: solo puede visualizar.</div>}
      </div>

      {/* LISTADO + DETALLE */}
      <div className="grid-dos">
        <div className="card">
          <p className="card-titulo">Listado</p>

          {cargando ? (
            <div className="loading">Cargando compras...</div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id_compra}>
                    <td>{new Date(c.fecha).toLocaleString()}</td>
                    <td>{c.proveedor}</td>
                    <td>$ {Number(c.total).toFixed(2)}</td>
                    <td>
                      <span className="pill">{c.estado}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-salir" onClick={() => verDetalle(c.id_compra)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}

                {compras.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: "#cbd5e1" }}>
                      No hay compras registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <p className="card-titulo">Detalle</p>

          {!detalleCompra ? (
            <div className="loading">Selecciona una compra para ver el detalle.</div>
          ) : (
            <>
              <div className="badge" style={{ marginBottom: 12 }}>
                <span className="pill">Compra #{detalleCompra.cabecera.id_compra}</span>
                <span>
                  {detalleCompra.cabecera.proveedor} — $
                  {Number(detalleCompra.cabecera.total).toFixed(2)}
                </span>
                <span className="pill">{detalleCompra.cabecera.estado}</span>
              </div>

              <table className="tabla">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Imagen</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Costo</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleCompra.detalle.map((d) => (
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
                      <td>$ {Number(d.costo).toFixed(2)}</td>
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

export default Compras;
