import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/productos.css"; // reutilizamos estilos de tabla/botones
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";

type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
};

const Clientes = ({ volver }: { volver: () => void }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  // editar
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // filtros
  const [busqueda, setBusqueda] = useState("");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const puedeEscribir = esAdmin() || esOperador(); // Supervisor solo lectura

  const limpiarFormulario = () => {
    setNombre("");
    setTelefono("");
    setCorreo("");
    setEditandoId(null);
  };

  const cargarClientes = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const resp = await api.get("/clientes", { headers });
      setClientes(resp.data.clientes || []);
    } catch {
      setMensaje("❌ No se pudo cargar clientes. Revisa token/backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async () => {
    setMensaje("");

    if (!puedeEscribir) {
      setMensaje("⛔ Supervisor: no puede crear/editar clientes.");
      return;
    }

    if (!nombre.trim()) {
      setMensaje("⚠️ El nombre es obligatorio.");
      return;
    }

    const body = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      correo: correo.trim() || null,
    };

    try {
      if (editandoId) {
        // ✅ BACKEND: PATCH /clientes/:id_cliente
        await api.patch(`/clientes/${editandoId}`, body, { headers });
        setMensaje("✅ Cliente actualizado");
      } else {
        // ✅ BACKEND: POST /clientes
        await api.post("/clientes", body, { headers });
        setMensaje("✅ Cliente creado");
      }

      limpiarFormulario();
      await cargarClientes();
    } catch (e: any) {
      if (e?.response?.status === 400) setMensaje("⚠️ Datos inválidos.");
      else if (e?.response?.status === 403) setMensaje("⛔ No tienes permisos.");
      else setMensaje("❌ Error al guardar. Revisa backend.");
    }
  };

  const editar = (c: Cliente) => {
    setMensaje("");
    setEditandoId(c.id_cliente);
    setNombre(c.nombre || "");
    setTelefono(c.telefono || "");
    setCorreo(c.correo || "");
  };

  const desactivar = async (id_cliente: number) => {
    setMensaje("");

    if (!esAdmin()) {
      setMensaje("⛔ Solo Administrador puede desactivar.");
      return;
    }

    try {
      // ✅ BACKEND: PATCH /clientes/:id_cliente/desactivar
      await api.patch(`/clientes/${id_cliente}/desactivar`, {}, { headers });
      setMensaje("✅ Cliente desactivado");
      await cargarClientes();
    } catch {
      setMensaje("❌ No pude desactivar. Revisa backend.");
    }
  };

  const activar = async (id_cliente: number) => {
    setMensaje("");

    if (!esAdmin()) {
      setMensaje("⛔ Solo Administrador puede activar.");
      return;
    }

    try {
      // ✅ BACKEND: PATCH /clientes/:id_cliente/activar
      await api.patch(`/clientes/${id_cliente}/activar`, {}, { headers });
      setMensaje("✅ Cliente activado");
      await cargarClientes();
    } catch {
      setMensaje("❌ No pude activar. Revisa backend.");
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const b = busqueda.trim().toLowerCase();
    if (!b) return true;
    return (
      (c.nombre || "").toLowerCase().includes(b) ||
      (c.telefono || "").toLowerCase().includes(b) ||
      (c.correo || "").toLowerCase().includes(b)
    );
  });

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Clientes</h1>
          <div className="badge">
            <span>👥</span>
            <span>Gestión de clientes</span>
            <span className="pill">
              {esSupervisor() ? "Solo lectura" : "Edición habilitada"}
            </span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">{editandoId ? "Editar cliente" : "Nuevo cliente"}</p>

        <div className="form-grid">
          <input
            className="input full"
            placeholder="Nombre (obligatorio)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={!puedeEscribir}
          />

          <input
            className="input"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={!puedeEscribir}
          />

          <input
            className="input"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={!puedeEscribir}
          />

          <div className="fila" style={{ justifyContent: "flex-end" }}>
            {editandoId && (
              <button className="btn-secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}

            <button className="btn-primario" onClick={guardar} disabled={!puedeEscribir}>
              {editandoId ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>

        {!puedeEscribir && (
          <div className="mensaje">⛔ Supervisor: solo puede visualizar.</div>
        )}
      </div>

      {/* BUSCAR + RECARGAR */}
      <div className="fila" style={{ marginBottom: 10 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Buscar por nombre / teléfono / correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button className="btn-secundario" onClick={cargarClientes}>
          Recargar
        </button>
      </div>

      {/* TABLA */}
      {cargando ? (
        <div className="loading">Cargando clientes...</div>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th style={{ width: 220 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c) => (
              <tr key={c.id_cliente}>
                <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                <td>{c.telefono || "-"}</td>
                <td>{c.correo || "-"}</td>
                <td>
                  <span className="pill">{c.activo ? "Activo" : "Inactivo"}</span>
                </td>
                <td>
                  <div className="fila" style={{ gap: 8, justifyContent: "flex-start" }}>
                    <button
                      className="btn-secundario"
                      onClick={() => editar(c)}
                      disabled={!puedeEscribir}
                    >
                      Editar
                    </button>

                    {c.activo ? (
                      <button
                        className="btn-secundario"
                        onClick={() => desactivar(c.id_cliente)}
                        disabled={!esAdmin()}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="btn-secundario"
                        onClick={() => activar(c.id_cliente)}
                        disabled={!esAdmin()}
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay clientes para esa búsqueda.
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

export default Clientes;
