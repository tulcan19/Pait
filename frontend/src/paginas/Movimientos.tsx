import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { puedeSubirImagenes } from "../helpers/imagenHelper";

type Producto = {
  id_producto: number;
  nombre: string;
};

type Movimiento = {
  id_movimiento: number;
  id_producto: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  fecha: string;
  id_usuario: number;
  producto?: string;
  usuario?: string;
  imagen?: string | null;
};

const Movimientos = ({ volver }: { volver: () => void }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [idProducto, setIdProducto] = useState<number>(0);
  const [tipo, setTipo] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [cantidad, setCantidad] = useState<number>(1);

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "salida" | "ajuste">("todos");
  const [filtroProducto, setFiltroProducto] = useState<number | "todos">("todos");

  const puedeRegistrar = esAdmin() || esOperador(); // Supervisor: solo lectura

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  // ✅ ABRIR PDF DESDE FRONTEND
  const abrirPdfKardex = () => {
    const token = obtenerToken();
    if (!token) {
      setMensaje("⚠️ No hay token. Inicia sesión nuevamente.");
      return;
    }

    // Armamos query params según filtros
    const params = new URLSearchParams();
    params.set("token", token);

    if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
    if (filtroProducto !== "todos") params.set("id_producto", String(filtroProducto));

    const url = `http://localhost:3000/api/reportes/movimientos/pdf?${params.toString()}`;
    window.open(url, "_blank");
  };

  const cargarTodo = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProd, respMov] = await Promise.all([
        api.get("/productos", { headers }),
        api.get("/movimientos", { headers }),
      ]);

      const listaProd = respProd.data.productos || [];
      setProductos(listaProd.map((p: any) => ({ id_producto: p.id_producto, nombre: p.nombre })));

      setMovimientos(respMov.data.movimientos || []);

      if (listaProd.length > 0 && !idProducto) {
        setIdProducto(listaProd[0].id_producto);
      }
    } catch {
      setMensaje("❌ No se pudo cargar productos o movimientos. Revisa token/backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registrarMovimiento = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje("⛔ Supervisor no puede registrar movimientos.");
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

    try {
      await api.post(
        "/movimientos",
        { id_producto: idProducto, tipo, cantidad },
        { headers }
      );

      setMensaje("✅ Movimiento registrado");
      await cargarTodo();
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;

      if (msg) {
        setMensaje(`❌ ${msg}`);
      } else if (e?.response?.status === 400) {
        setMensaje("⚠️ Datos inválidos (revisa cantidad, tipo, producto).");
      } else if (e?.response?.status === 403) {
        setMensaje("⛔ No tienes permisos para esta acción.");
      } else {
        setMensaje("❌ Error al registrar movimiento. Revisa el backend.");
      }
    }
  };

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const okTipo = filtroTipo === "todos" ? true : m.tipo === filtroTipo;
      const okProd = filtroProducto === "todos" ? true : m.id_producto === filtroProducto;
      return okTipo && okProd;
    });
  }, [movimientos, filtroTipo, filtroProducto]);

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Movimientos </h1>
          <div className="badge">
            <span>🧾</span>
            <span>Entradas / Salidas / Ajustes</span>
            <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORMULARIO REGISTRO */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">Registrar movimiento</p>

        <div className="form-grid">
          <select
            className="select full"
            value={idProducto}
            onChange={(e) => setIdProducto(Number(e.target.value))}
            disabled={!puedeRegistrar}
          >
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            disabled={!puedeRegistrar}
          >
            <option value="entrada">entrada</option>
            <option value="salida">salida</option>
            <option value="ajuste">ajuste</option>
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

          <div className="fila" style={{ justifyContent: "flex-end", marginBottom: 0 }}>
            <button className="btn-primario" onClick={registrarMovimiento} disabled={!puedeRegistrar}>
              Registrar
            </button>
          </div>
        </div>

        {!puedeRegistrar && (
          <div className="mensaje">⛔ Supervisor: solo puede visualizar.</div>
        )}
      </div>

      {/* FILTROS */}
      <div className="fila" style={{ gap: 10, marginBottom: 10 }}>
        <select
          className="select"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as any)}
        >
          <option value="todos">Todos los tipos</option>
          <option value="entrada">entrada</option>
          <option value="salida">salida</option>
          <option value="ajuste">ajuste</option>
        </select>

        <select
          className="select"
          value={filtroProducto}
          onChange={(e) =>
            setFiltroProducto(e.target.value === "todos" ? "todos" : Number(e.target.value))
          }
        >
          <option value="todos">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </option>
          ))}
        </select>

        <button className="btn-secundario" onClick={cargarTodo}>
          Recargar
        </button>

        {/* ✅ BOTÓN PDF */}
        <button className="btn-secundario" onClick={abrirPdfKardex}>
          PDF
        </button>
      </div>

      {/* TABLA */}
      {cargando ? (
        <div className="loading">Cargando movimientos...</div>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Imagen</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Stock ant.</th>
              <th>Stock act.</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((m) => (
              <tr key={m.id_movimiento}>
                <td>
                  {m.imagen ? (
                    <img
                      src={m.imagen}
                      alt={m.producto || String(m.id_producto)}
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
                <td>{new Date(m.fecha).toLocaleString()}</td>
                <td>
                  <span className="pill">{m.tipo}</span>
                </td>
                <td>{m.producto || m.id_producto}</td>
                <td>{m.cantidad}</td>
                <td>{m.stock_anterior}</td>
                <td>{m.stock_actual}</td>
                <td>{m.usuario || "-"}</td>
              </tr>
            ))}

            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay movimientos para esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {mensaje && <div className="mensaje">{mensaje}</div>}
    </div>
  );
};

export default Movimientos;
