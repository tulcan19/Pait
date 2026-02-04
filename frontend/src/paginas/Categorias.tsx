import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin } from "../contextos/sesion";
import { validarNombre } from "../helpers/validaciones";

type Categoria = {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

type FormCategoria = {
  id_categoria?: number;
  nombre: string;
  descripcion: string;
};

const Categorias = ({ volver }: { volver: () => void }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario
  const [form, setForm] = useState<FormCategoria>({
    nombre: "",
    descripcion: "",
  });
  const [errores, setErrores] = useState<{ nombre?: string; descripcion?: string }>({});
  const [editando, setEditando] = useState(false);

  // Filtro
  const [busqueda, setBusqueda] = useState("");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const puedeEditar = esAdmin();

  // Cargar categorías
  const cargarCategorias = async () => {
    setCargando(true);
    try {
      const resp = await api.get("/categorias", { headers });
      setCategorias(resp.data.categorias || []);
    } catch {
      mostrarMensaje("No se pudieron cargar las categorías", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
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
    const nuevosErrores: { nombre?: string; descripcion?: string } = {};

    const validacionNombre = validarNombre(form.nombre, 2, 100);
    if (!validacionNombre.valido) {
      nuevosErrores.nombre = validacionNombre.mensaje;
    }

    // Verificar duplicados (solo si es nuevo o cambió el nombre)
    const nombreNormalizado = form.nombre.trim().toLowerCase();
    const existeDuplicado = categorias.some(
      c => c.nombre.toLowerCase() === nombreNormalizado && c.id_categoria !== form.id_categoria
    );
    if (existeDuplicado) {
      nuevosErrores.nombre = "Ya existe una categoría con este nombre";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setForm({ nombre: "", descripcion: "" });
    setErrores({});
    setEditando(false);
  };

  // Guardar categoría
  const guardar = async () => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);

    try {
      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
      };

      if (form.id_categoria) {
        await api.put(`/categorias/${form.id_categoria}`, body, { headers });
        mostrarMensaje("Categoría actualizada correctamente", "exito");
      } else {
        await api.post("/categorias", body, { headers });
        mostrarMensaje("Categoría creada correctamente", "exito");
      }

      limpiarFormulario();
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al guardar la categoría";
      mostrarMensaje(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  // Editar categoría
  const editar = (categoria: Categoria) => {
    setForm({
      id_categoria: categoria.id_categoria,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    setEditando(true);
    setErrores({});
  };

  // Activar/Desactivar categoría
  const toggleActivo = async (categoria: Categoria) => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    try {
      const endpoint = categoria.activo
        ? `/categorias/${categoria.id_categoria}/desactivar`
        : `/categorias/${categoria.id_categoria}/activar`;

      await api.patch(endpoint, {}, { headers });
      mostrarMensaje(
        `Categoría ${categoria.activo ? "desactivada" : "activada"} correctamente`,
        "exito"
      );
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al cambiar estado";
      mostrarMensaje(msg, "error");
    }
  };

  // Eliminar categoría
  const eliminar = async (id: number) => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await api.delete(`/categorias/${id}`, { headers });
      mostrarMensaje("Categoría eliminada correctamente", "exito");
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "No se puede eliminar la categoría (tiene productos asociados)";
      mostrarMensaje(msg, "error");
    }
  };

  // Filtrar categorías
  const categoriasFiltradas = categorias.filter((c) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      c.nombre.toLowerCase().includes(termino) ||
      (c.descripcion || "").toLowerCase().includes(termino)
    );
  });

  return (
    <div className="card">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Categorías</h1>
          <div className="badge">
            {/* <span>📁</span> */}
            <span>Gestión de categorías de productos</span>
            <span className="pill primario">Solo Administrador</span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Formulario */}
      {puedeEditar && (
        <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
          <p className="card-titulo">
            {editando ? "Editar Categoría" : "Nueva Categoría"}
          </p>

          <div className="form-grid">
            <div className="campo">
              <label className="label requerido">Nombre</label>
              <input
                className={`input ${errores.nombre ? "error" : ""}`}
                placeholder="Nombre de la categoría"
                value={form.nombre}
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value });
                  if (errores.nombre) {
                    const val = validarNombre(e.target.value, 2, 100);
                    setErrores(prev => ({ ...prev, nombre: val.valido ? undefined : val.mensaje }));
                  }
                }}
                maxLength={100}
              />
              {errores.nombre && <span className="campo-error">{errores.nombre}</span>}
            </div>

            <div className="campo">
              <label className="label">Descripción</label>
              <input
                className="input"
                placeholder="Descripción (opcional)"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                maxLength={255}
              />
            </div>
          </div>

          <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-start" }}>
            <button
              className="btn-primario"
              onClick={guardar}
              disabled={procesando}
            >
              {procesando ? "Guardando..." : editando ? "Actualizar" : "Crear Categoría"}
            </button>
            {editando && (
              <button className="btn-secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      {/* Filtro y listado */}
      <div className="fila" style={{ marginBottom: "var(--espaciado-md)" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn-secundario" onClick={cargarCategorias} disabled={cargando}>
          {cargando ? "Cargando..." : "🔄 Recargar"}
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando categorías...
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                {puedeEditar && <th style={{ width: 200 }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((categoria) => (
                <tr key={categoria.id_categoria}>
                  <td>{categoria.id_categoria}</td>
                  <td style={{ fontWeight: 600 }}>{categoria.nombre}</td>
                  <td style={{ color: "var(--color-texto-muted)" }}>
                    {categoria.descripcion || "-"}
                  </td>
                  <td>
                    <span className={`pill ${categoria.activo ? "exito" : "error"}`}>
                      {categoria.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {puedeEditar && (
                    <td>
                      <div className="acciones">
                        <button
                          className="btn-secundario btn-sm"
                          onClick={() => editar(categoria)}
                        >
                          Editar
                        </button>
                        <button
                          className={`btn-sm ${categoria.activo ? "btn-peligro" : "btn-exito"}`}
                          onClick={() => toggleActivo(categoria)}
                        >
                          {categoria.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="btn-peligro btn-sm"
                          onClick={() => eliminar(categoria.id_categoria)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {categoriasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={puedeEditar ? 5 : 4} className="loading">
                    {busqueda
                      ? "No se encontraron categorías con ese criterio"
                      : "No hay categorías registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info de total */}
      <div style={{ marginTop: "var(--espaciado-md)", color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
        Total: {categoriasFiltradas.length} categoría(s)
        {busqueda && ` de ${categorias.length}`}
      </div>
    </div>
  );
};

export default Categorias;
