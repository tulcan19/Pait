import { useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";

type RolPermitido = "Supervisor" | "Operador";

type FormUsuario = {
  id_usuario?: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  rol: RolPermitido;
  activo?: boolean;
};

type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  id_rol: number;
  rol: RolPermitido;
  activo: boolean;
};

const rolesDisponibles: RolPermitido[] = ["Supervisor", "Operador"];

const Usuarios = ({ volver }: { volver: () => void }) => {
  const [form, setForm] = useState<FormUsuario>({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "Supervisor",
  });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargar = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const resp = await api.get("/usuarios", { headers });
      setUsuarios(resp.data.usuarios || []);
    } catch {
      setMensaje("❌ No se pudo cargar usuarios. Revisa token/backend.");
    } finally {
      setCargando(false);
    }
  };

  const resetForm = () =>
    setForm({ nombre: "", correo: "", contrasena: "", rol: "Supervisor" });

  const crear = async () => {
    setMensaje("");

    if (!form.nombre || !form.correo) return setMensaje("⚠️ Nombre y correo son obligatorios.");
    if (!form.id_usuario && !form.contrasena)
      return setMensaje("⚠️ Contraseña obligatoria al crear.");

    try {
      setProcesando(true);
      if (form.id_usuario) {
        // actualizar
        await api.put(
          `/usuarios/${form.id_usuario}`,
          {
            nombre: form.nombre,
            correo: form.correo,
            rol: form.rol,
            ...(form.contrasena ? { contrasena: form.contrasena } : {}),
          },
          { headers }
        );
        setMensaje("✅ Usuario actualizado.");
      } else {
        // crear
        await api.post(
          "/usuarios/crear",
          {
            nombre: form.nombre,
            correo: form.correo,
            contrasena: form.contrasena,
            rol: form.rol,
          },
          { headers }
        );
        setMensaje("✅ Usuario creado/actualizado (Supervisor/Operador).");
      }

      resetForm();
      await cargar();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setMensaje("⛔ Solo el Administrador puede crear usuarios.");
      } else {
        setMensaje(e?.response?.data?.mensaje || "❌ Error al crear usuario.");
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
      <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Gestión de usuarios</h1>
          <div className="badge">
            <span>🧑‍💼</span>
            <span>Solo administrador</span>
            <span className="pill">CRUD Supervisor / Operador</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      <div className="form-grid" style={{ maxWidth: 520 }}>
        <input
          className="input full"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          className="input full"
          type="email"
          placeholder="Correo"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
        />
        <input
          className="input full"
          type="password"
          placeholder={form.id_usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
          value={form.contrasena}
          onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
        />
        <select
          className="select full"
          value={form.rol}
          onChange={(e) =>
            setForm({ ...form, rol: e.target.value as FormUsuario["rol"] })
          }
        >
          {rolesDisponibles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="fila" style={{ marginTop: 16, justifyContent: "flex-start" }}>
        <button className="btn-primario" onClick={crear} disabled={procesando}>
          {procesando ? "Creando..." : "Crear usuario"}
        </button>
        <button className="btn-secundario" onClick={resetForm}>
          Limpiar
        </button>
      </div>

      {mensaje && <div className="mensaje" style={{ marginTop: 12 }}>{mensaje}</div>}

      <div className="mensaje" style={{ marginTop: 12, color: "#cbd5e1" }}>
        Solo se permiten roles Supervisor y Operador. El backend valida que no se creen
        administradores adicionales.
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="topbar" style={{ marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>Listado</h2>
            <div className="badge">
              <span>📋</span>
              <span>Supervisores y Operadores</span>
            </div>
          </div>
          <button className="btn-secundario" onClick={cargar} disabled={cargando}>
            {cargando ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {cargando ? (
          <div className="loading">Cargando usuarios...</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ width: 260 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id_usuario}>
                  <td>{u.id_usuario}</td>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>
                    <span className="pill">{u.rol}</span>
                  </td>
                  <td>
                    <span className="pill">{u.activo ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td>
                    <div className="acciones">
                      <button
                        className="btn-secundario"
                        onClick={() =>
                          setForm({
                            id_usuario: u.id_usuario,
                            nombre: u.nombre,
                            correo: u.correo,
                            rol: u.rol,
                            contrasena: "",
                          })
                        }
                      >
                        Editar
                      </button>
                      {u.activo ? (
                        <>
                          <button
                            className="btn-secundario"
                            onClick={async () => {
                              setMensaje("");
                              try {
                                await api.delete(`/usuarios/${u.id_usuario}`, { headers });
                                setMensaje("✅ Usuario desactivado");
                                await cargar();
                              } catch (e: any) {
                                setMensaje(
                                  e?.response?.data?.mensaje || "❌ Error al desactivar."
                                );
                              }
                            }}
                          >
                            Desactivar
                          </button>
                          <button
                            className="btn-secundario"
                            onClick={async () => {
                              if (!window.confirm("¿Eliminar usuario definitivamente?")) return;
                              setMensaje("");
                              try {
                                await api.delete(`/usuarios/${u.id_usuario}/eliminar`, {
                                  headers,
                                });
                                setMensaje("✅ Usuario eliminado");
                                await cargar();
                              } catch (e: any) {
                                setMensaje(
                                  e?.response?.data?.mensaje || "❌ Error al eliminar."
                                );
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-secundario"
                            onClick={async () => {
                              setMensaje("");
                              try {
                                await api.patch(`/usuarios/${u.id_usuario}/activar`, {}, { headers });
                                setMensaje("✅ Usuario activado");
                                await cargar();
                              } catch (e: any) {
                                setMensaje(
                                  e?.response?.data?.mensaje || "❌ Error al activar."
                                );
                              }
                            }}
                          >
                            Activar
                          </button>
                          <button
                            className="btn-secundario"
                            onClick={async () => {
                              if (!window.confirm("¿Eliminar usuario definitivamente?")) return;
                              setMensaje("");
                              try {
                                await api.delete(`/usuarios/${u.id_usuario}/eliminar`, {
                                  headers,
                                });
                                setMensaje("✅ Usuario eliminado");
                                await cargar();
                              } catch (e: any) {
                                setMensaje(
                                  e?.response?.data?.mensaje || "❌ Error al eliminar."
                                );
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#cbd5e1" }}>
                    No hay usuarios Supervisor/Operador.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
