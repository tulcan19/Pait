import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin } from "../contextos/sesion";
import { 
  validarCorreo, 
  validarContrasena, 
  validarNombre,
  DOMINIO_PERMITIDO 
} from "../helpers/validaciones";

type RolPermitido = "Supervisor" | "Operador";

type FormUsuario = {
  id_usuario?: number;
  nombre: string;
  correo: string;
  contrasena: string;
  rol: RolPermitido;
};

type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  id_rol: number;
  rol: string;
  activo: boolean;
  fecha_creacion?: string;
};

const rolesDisponibles: RolPermitido[] = ["Supervisor", "Operador"];

const Usuarios = ({ volver }: { volver: () => void }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario
  const [form, setForm] = useState<FormUsuario>({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "Operador",
  });
  const [errores, setErrores] = useState<Partial<Record<keyof FormUsuario, string>>>({});
  const [editando, setEditando] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"todos" | RolPermitido>("todos");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const puedeEditar = esAdmin();

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const resp = await api.get("/usuarios", { headers });
      setUsuarios(resp.data.usuarios || []);
    } catch {
      mostrarMensaje("No se pudieron cargar los usuarios", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mostrar mensaje
  const mostrarMensaje = (texto: string, tipo: "exito" | "error" | "advertencia") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (tipo === "exito") {
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  // Validar formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Partial<Record<keyof FormUsuario, string>> = {};

    // Validar nombre
    const validacionNombre = validarNombre(form.nombre, 2, 100);
    if (!validacionNombre.valido) {
      nuevosErrores.nombre = validacionNombre.mensaje;
    }

    // Validar correo con dominio @sierrastock.com
    const validacionCorreo = validarCorreo(form.correo);
    if (!validacionCorreo.valido) {
      nuevosErrores.correo = validacionCorreo.mensaje;
    }

    // Verificar correo duplicado
    if (!nuevosErrores.correo) {
      const correoNormalizado = form.correo.trim().toLowerCase();
      const existeDuplicado = usuarios.some(
        u => u.correo.toLowerCase() === correoNormalizado && u.id_usuario !== form.id_usuario
      );
      if (existeDuplicado) {
        nuevosErrores.correo = "Ya existe un usuario con este correo";
      }
    }

    // Validar contraseña (obligatoria al crear, opcional al editar)
    if (!editando) {
      const validacionContrasena = validarContrasena(form.contrasena);
      if (!validacionContrasena.valido) {
        nuevosErrores.contrasena = validacionContrasena.mensaje;
      }
    } else if (form.contrasena) {
      // Si está editando y puso contraseña, validarla
      const validacionContrasena = validarContrasena(form.contrasena);
      if (!validacionContrasena.valido) {
        nuevosErrores.contrasena = validacionContrasena.mensaje;
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      correo: "",
      contrasena: "",
      rol: "Operador",
    });
    setErrores({});
    setEditando(false);
  };

  // Guardar usuario
  const guardar = async () => {
    if (!puedeEditar) {
      mostrarMensaje("Solo el Administrador puede gestionar usuarios", "error");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);

    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim().toLowerCase(),
        rol: form.rol,
      };

      // Solo incluir contraseña si se proporcionó
      if (form.contrasena) {
        body.contrasena = form.contrasena;
      }

      if (form.id_usuario) {
        await api.put(`/usuarios/${form.id_usuario}`, body, { headers });
        mostrarMensaje("Usuario actualizado correctamente", "exito");
      } else {
        await api.post("/usuarios/crear", body, { headers });
        mostrarMensaje("Usuario creado correctamente", "exito");
      }

      limpiarFormulario();
      await cargarUsuarios();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al guardar el usuario";
      mostrarMensaje(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  // Editar usuario
  const editar = (usuario: Usuario) => {
    if (!puedeEditar) {
      mostrarMensaje("Solo el Administrador puede editar usuarios", "error");
      return;
    }

    // No permitir editar al Administrador
    if (usuario.rol === "Administrador") {
      mostrarMensaje("No se puede editar al usuario Administrador", "advertencia");
      return;
    }

    setForm({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: "",
      rol: usuario.rol as RolPermitido,
    });
    setEditando(true);
    setErrores({});
  };

  // Activar/Desactivar usuario
  const toggleActivo = async (usuario: Usuario) => {
    if (!puedeEditar) {
      mostrarMensaje("Solo el Administrador puede activar/desactivar usuarios", "error");
      return;
    }

    if (usuario.rol === "Administrador") {
      mostrarMensaje("No se puede desactivar al Administrador", "advertencia");
      return;
    }

    try {
      if (usuario.activo) {
        await api.delete(`/usuarios/${usuario.id_usuario}`, { headers });
        mostrarMensaje("Usuario desactivado correctamente", "exito");
      } else {
        await api.patch(`/usuarios/${usuario.id_usuario}/activar`, {}, { headers });
        mostrarMensaje("Usuario activado correctamente", "exito");
      }
      await cargarUsuarios();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al cambiar estado";
      mostrarMensaje(msg, "error");
    }
  };

  // Eliminar usuario permanentemente
  const eliminar = async (id: number) => {
    if (!puedeEditar) {
      mostrarMensaje("Solo el Administrador puede eliminar usuarios", "error");
      return;
    }

    const usuario = usuarios.find(u => u.id_usuario === id);
    if (usuario?.rol === "Administrador") {
      mostrarMensaje("No se puede eliminar al Administrador", "advertencia");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar este usuario permanentemente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await api.delete(`/usuarios/${id}/eliminar`, { headers });
      mostrarMensaje("Usuario eliminado correctamente", "exito");
      await cargarUsuarios();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al eliminar usuario";
      mostrarMensaje(msg, "error");
    }
  };

  // Filtrar usuarios (excluyendo Administrador)
  const usuariosFiltrados = usuarios
    .filter(u => u.rol !== "Administrador") // No mostrar Admin en la lista
    .filter((u) => {
      // Filtro de rol
      if (filtroRol !== "todos" && u.rol !== filtroRol) return false;

      // Filtro de estado
      if (filtroEstado === "activos" && !u.activo) return false;
      if (filtroEstado === "inactivos" && u.activo) return false;

      // Filtro de búsqueda
      const termino = busqueda.trim().toLowerCase();
      if (!termino) return true;
      return (
        u.nombre.toLowerCase().includes(termino) ||
        u.correo.toLowerCase().includes(termino)
      );
    });

  // Generar correo sugerido
  const generarCorreoSugerido = () => {
    if (form.nombre && !form.correo) {
      const nombreLimpio = form.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-z0-9]/g, ".") // Reemplazar caracteres especiales
        .replace(/\.+/g, ".") // Evitar puntos múltiples
        .replace(/^\.|\.$/, ""); // Quitar puntos al inicio/final
      
      return `${nombreLimpio}${DOMINIO_PERMITIDO}`;
    }
    return "";
  };

  if (!esAdmin()) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "var(--espaciado-xl)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "var(--espaciado-md)" }}>🔒</div>
          <h2 style={{ margin: "0 0 var(--espaciado-md)" }}>Acceso Restringido</h2>
          <p style={{ color: "var(--color-texto-muted)", marginBottom: "var(--espaciado-lg)" }}>
            Solo el Administrador puede gestionar usuarios.
          </p>
          <button className="btn-primario" onClick={volver}>
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Usuarios</h1>
          <div className="badge">
            <span>👤</span>
            <span>Gestión de usuarios del sistema</span>
            <span className="pill primario">Solo Administrador</span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Formulario */}
      <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
        <p className="card-titulo">
          {editando ? "Editar Usuario" : "Nuevo Usuario"}
        </p>

        <div className="form-grid">
          {/* Nombre */}
          <div className="campo">
            <label className="label requerido">Nombre completo</label>
            <input
              className={`input ${errores.nombre ? "error" : ""}`}
              placeholder="Nombre del usuario"
              value={form.nombre}
              onChange={(e) => {
                setForm({ ...form, nombre: e.target.value });
                if (errores.nombre) {
                  const val = validarNombre(e.target.value, 2, 100);
                  setErrores(prev => ({ ...prev, nombre: val.valido ? undefined : val.mensaje }));
                }
              }}
              onBlur={() => {
                // Sugerir correo basado en nombre
                if (!form.correo && form.nombre) {
                  const sugerido = generarCorreoSugerido();
                  if (sugerido) setForm(prev => ({ ...prev, correo: sugerido }));
                }
              }}
              maxLength={100}
            />
            {errores.nombre && <span className="campo-error">{errores.nombre}</span>}
          </div>

          {/* Correo */}
          <div className="campo">
            <label className="label requerido">Correo electrónico</label>
            <input
              className={`input ${errores.correo ? "error" : ""}`}
              type="email"
              placeholder={`usuario${DOMINIO_PERMITIDO}`}
              value={form.correo}
              onChange={(e) => {
                setForm({ ...form, correo: e.target.value });
                if (errores.correo) {
                  const val = validarCorreo(e.target.value);
                  setErrores(prev => ({ ...prev, correo: val.valido ? undefined : val.mensaje }));
                }
              }}
            />
            {errores.correo && <span className="campo-error">{errores.correo}</span>}
            <span className="campo-ayuda">Solo correos con dominio {DOMINIO_PERMITIDO}</span>
          </div>

          {/* Contraseña */}
          <div className="campo">
            <label className={`label ${!editando ? "requerido" : ""}`}>
              {editando ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              className={`input ${errores.contrasena ? "error" : ""}`}
              type="password"
              placeholder={editando ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
              value={form.contrasena}
              onChange={(e) => {
                setForm({ ...form, contrasena: e.target.value });
                if (errores.contrasena) {
                  const val = validarContrasena(e.target.value);
                  setErrores(prev => ({ ...prev, contrasena: val.valido ? undefined : val.mensaje }));
                }
              }}
            />
            {errores.contrasena && <span className="campo-error">{errores.contrasena}</span>}
          </div>

          {/* Rol */}
          <div className="campo">
            <label className="label requerido">Rol</label>
            <select
              className="select"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as RolPermitido })}
            >
              {rolesDisponibles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="campo-ayuda">
              {form.rol === "Supervisor" 
                ? "Puede ver reportes, editar y aprobar operaciones" 
                : "Puede registrar ventas y operaciones básicas"}
            </span>
          </div>
        </div>

        <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-start" }}>
          <button
            className="btn-primario"
            onClick={guardar}
            disabled={procesando}
          >
            {procesando ? "Guardando..." : editando ? "Actualizar" : "Crear Usuario"}
          </button>
          {editando && (
            <button className="btn-secundario" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="filtros">
        <input
          className="input"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as typeof filtroRol)}
        >
          <option value="todos">Todos los roles</option>
          <option value="Supervisor">Supervisores</option>
          <option value="Operador">Operadores</option>
        </select>
        <select
          className="select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
        <button className="btn-secundario" onClick={cargarUsuarios} disabled={cargando}>
          {cargando ? "..." : "🔄"}
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando usuarios...
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>{usuario.id_usuario}</td>
                  <td style={{ fontWeight: 600 }}>{usuario.nombre}</td>
                  <td>{usuario.correo}</td>
                  <td>
                    <span className={`pill ${usuario.rol === "Supervisor" ? "primario" : ""}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${usuario.activo ? "exito" : "error"}`}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="acciones">
                      <button
                        className="btn-secundario btn-sm"
                        onClick={() => editar(usuario)}
                      >
                        Editar
                      </button>
                      <button
                        className={`btn-sm ${usuario.activo ? "btn-peligro" : "btn-exito"}`}
                        onClick={() => toggleActivo(usuario)}
                      >
                        {usuario.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn-peligro btn-sm"
                        onClick={() => eliminar(usuario.id_usuario)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="loading">
                    {busqueda || filtroRol !== "todos" || filtroEstado !== "todos"
                      ? "No se encontraron usuarios con ese criterio"
                      : "No hay usuarios Supervisor/Operador registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info de total */}
      <div style={{ marginTop: "var(--espaciado-md)", color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
        Mostrando {usuariosFiltrados.length} usuario(s) (excluyendo Administrador)
      </div>
    </div>
  );
};

export default Usuarios;
