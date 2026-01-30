import { useEffect, useState } from "react";
import api from "../api/api";
import { cerrarSesion, obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";

import Productos from "./Productos";
import Movimientos from "./Movimientos";
import Gastos from "./Gastos";
import Ventas from "./Ventas";
import Clientes from "./Clientes";
import Compras from "./Compras";
import Usuarios from "./Usuarios";
import Estadisticas from "./Estadisticas";

type Resumen = {
  total_ventas: string;
  total_compras: string;
  total_gastos: string;
};

type Popular = {
  id_producto: number;
  nombre: string;
  unidades_vendidas: string;
  imagen?: string | null;
};

type Movimiento = {
  id_movimiento: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  fecha: string;
  producto: string;
  usuario: string;
  imagen?: string | null;
};

type DashboardData = {
  ok: boolean;
  resumen: Resumen;
  productos_populares: Popular[];
  actividad_reciente: Movimiento[];
  stock_bajo: { id_producto: number; nombre: string; stock: number; imagen?: string | null }[];
};

type Pantalla =
  | "dashboard"
  | "productos"
  | "movimientos"
  | "clientes"
  | "ventas"
  | "compras"
  | "gastos"
  | "usuarios"
  | "estadisticas"
  | "denegado";

function formatearDinero(valor: string) {
  const n = Number(valor);
  if (Number.isNaN(n)) return valor;
  return n.toFixed(2); 
}

const Dashboard = ({ onSalir }: { onSalir: () => void }) => {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState<Pantalla>("dashboard");

  const usuario = localStorage.getItem("usuario");
  const usuarioObj = usuario ? JSON.parse(usuario) : null;

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const token = obtenerToken();
      if (!token) {
        onSalir();
        return;
      }

      const resp = await api.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDatos(resp.data);
    } catch {
      cerrarSesion();
      onSalir();
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salir = () => {
    cerrarSesion();
    onSalir();
  };

  // ✅ AHORA ir() ACEPTA "ventas" TAMBIÉN
  const ir = (p: Pantalla) => {
    const puedeVerGastos = esAdmin();
    const puedeVerMovimientos = esAdmin() || esOperador() || esSupervisor();
    const puedeVerProductos = esAdmin() || esOperador() || esSupervisor();
    const puedeVerClientes = esAdmin() || esOperador() || esSupervisor();
    const puedeVerVentas = esAdmin() || esOperador() || esSupervisor();
    const puedeVerCompras = esAdmin() || esOperador() || esSupervisor();
    const puedeVerUsuarios = esAdmin();
    const puedeVerEstadisticas = esAdmin() || esOperador() || esSupervisor();

    if (p === "gastos" && !puedeVerGastos) return setPantalla("denegado");
    if (p === "movimientos" && !puedeVerMovimientos) return setPantalla("denegado");
    if (p === "productos" && !puedeVerProductos) return setPantalla("denegado");
    if (p === "clientes" && !puedeVerClientes) return setPantalla("denegado");
    if (p === "ventas" && !puedeVerVentas) return setPantalla("denegado");
    if (p === "compras" && !puedeVerCompras) return setPantalla("denegado");
    if (p === "usuarios" && !puedeVerUsuarios) return setPantalla("denegado");
    if (p === "estadisticas" && !puedeVerEstadisticas) return setPantalla("denegado");

    setPantalla(p);
  };


  const VistaMovimientos = () => (
    <Movimientos
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaProductos = () => (
    <Productos
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaGastos = () => (
    <Gastos
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaVentas = () => (
    <Ventas
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaClientes = () => (
    <Clientes
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaCompras = () => (
    <Compras
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );

  const VistaUsuarios = () => (
    <Usuarios
      volver={() => {
        setPantalla("dashboard");
        cargarDashboard();
      }}
    />
  );



  const VistaDenegado = () => (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>⛔ Acceso denegado</h2>
      <p>No tienes permisos para acceder a esta sección.</p>

      <button className="btn-salir" onClick={() => setPantalla("dashboard")}>
        Volver al Dashboard
      </button>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-contenedor">
        {/* TOPBAR */}
        <div className="topbar">
          <div>
            <h1>Dashboard de Inventario</h1>
            <div className="badge">
              <span>👤</span>
              <span>{usuarioObj?.nombre || "Usuario"}</span>
              <span className="pill">{usuarioObj?.rol || "Rol"}</span>
            </div>
          </div>

          <button className="btn-salir" onClick={salir}>
            Cerrar sesión
          </button>
        </div>

        {/* MENU */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button className="btn-salir" onClick={() => ir("dashboard")}>
            Dashboard
          </button>

          <button className="btn-salir" onClick={() => ir("productos")}>
            Productos
          </button>

          <button className="btn-salir" onClick={() => ir("movimientos")}>
            Movimientos
          </button>

          <button className="btn-salir" onClick={() => ir("clientes")}>
            Clientes
          </button>

          <button className="btn-salir" onClick={() => ir("ventas")}>
            Ventas
          </button>
          <button className="btn-salir" onClick={() => ir("compras")}>
            Compras
          </button>

          {esAdmin() && (
            <button className="btn-salir" onClick={() => ir("gastos")}>
              Gastos
            </button>
          )}
          {esAdmin() && (
            <button className="btn-salir" onClick={() => ir("usuarios")}>
              Usuarios
            </button>
          )}
          <button className="btn-salir" onClick={() => ir("estadisticas")}>
            Estadísticas
          </button>
        </div>

        {/* (Filtro de periodo eliminado del dashboard principal.
            El periodo y gráficos viven en la pestaña "Estadísticas".) */}

        {/* CONTENIDO */}
        {pantalla === "dashboard" && (
          <>
            {cargando && <div className="loading">Cargando datos...</div>}

            {!cargando && datos && (
              <>
                <div
                  className="grid-metricas"
                  style={{
                    gridTemplateColumns: esAdmin() ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
                  }}
                >
                  <div className="card">
                    <p className="card-titulo">Total Ventas</p>
                    <p className="card-valor">$ {formatearDinero(datos.resumen.total_ventas)}</p>
                  </div>

                  <div className="card">
                    <p className="card-titulo">Total Compras</p>
                    <p className="card-valor">$ {formatearDinero(datos.resumen.total_compras)}</p>
                  </div>

                  {esAdmin() && (
                    <div className="card">
                      <p className="card-titulo">Total Gastos</p>
                      <p className="card-valor">$ {formatearDinero(datos.resumen.total_gastos)}</p>
                    </div>
                  )}
                </div>

                <div className="grid-dos">
                  <div className="card">
                    <p className="card-titulo">Actividad reciente</p>

                    <table className="tabla">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Imagen</th>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Producto</th>
                          <th>Cant.</th>
                          <th>Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.actividad_reciente.map((m) => (
                          <tr key={m.id_movimiento}>
                            <td>
                              {m.imagen ? (
                                <img
                                  src={m.imagen}
                                  alt={m.producto}
                                  style={{
                                    width: 40,
                                    height: 40,
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
                                    width: 40,
                                    height: 40,
                                    backgroundColor: "#1e293b",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#64748b",
                                    fontSize: 18,
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
                            <td>{m.producto}</td>
                            <td>{m.cantidad}</td>
                            <td>{m.usuario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="card">
                    <p className="card-titulo">Productos populares</p>

                    <table className="tabla">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Imagen</th>
                          <th>Producto</th>
                          <th>Unidades</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.productos_populares.map((p) => (
                          <tr key={p.id_producto}>
                            <td>
                              {p.imagen ? (
                                <img
                                  src={p.imagen}
                                  alt={p.nombre}
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
                            <td>{p.nombre}</td>
                            <td>{p.unidades_vendidas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ height: 14 }} />

                    <p className="card-titulo">Stock bajo</p>

                    {datos.stock_bajo.length === 0 ? (
                      <div className="loading">✅ No hay productos con stock bajo.</div>
                    ) : (
                      <table className="tabla">
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}>Imagen</th>
                            <th>Producto</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.stock_bajo.map((s) => (
                            <tr key={s.id_producto}>
                              <td>
                                {s.imagen ? (
                                  <img
                                    src={s.imagen}
                                    alt={s.nombre}
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
                              <td>{s.nombre}</td>
                              <td>{s.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {pantalla === "productos" && <VistaProductos />}
        {pantalla === "movimientos" && <VistaMovimientos />}
        {pantalla === "ventas" && <VistaVentas />}
        {pantalla === "gastos" && <VistaGastos />}
        {pantalla === "usuarios" && <VistaUsuarios />}
        {pantalla === "estadisticas" && <Estadisticas volver={() => setPantalla("dashboard")} />}
        {pantalla === "denegado" && <VistaDenegado />}
        {pantalla === "clientes" && <VistaClientes />}
        {pantalla === "compras" && <VistaCompras />}



      </div>
    </div>
  );
};

export default Dashboard;
