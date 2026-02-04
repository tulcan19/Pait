import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/productos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { convertirImagenABase64, puedeSubirImagenes } from "../helpers/imagenHelper";

type Categoria = {
  id_categoria: number;
  nombre: string;
};

type Producto = {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  id_categoria: number;
  categoria?: string;
  activo: boolean;
  imagen?: string | null;
};

type FormProducto = {
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  id_categoria: number;
  imagen?: string | null;
};

const Productos = ({ volver }: { volver: () => void }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | "todas">("todas");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState<FormProducto>({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: 0,
    id_categoria: 1,
    imagen: null,
  });

  const puedeEditar = esAdmin() || esOperador(); // supervisor solo ve
  const puedeSubirImg = puedeSubirImagenes(esAdmin(), esSupervisor());

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargarTodo = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProd, respCat] = await Promise.all([
        api.get("/productos", { headers }),
        api.get("/categorias", { headers }),
      ]);

      setProductos(respProd.data.productos || []);
      setCategorias(respCat.data.categorias || []);
      // set default categoria en el formulario
      if ((respCat.data.categorias || []).length > 0) {
        setForm((prev) => ({ ...prev, id_categoria: respCat.data.categorias[0].id_categoria }));
      }
    } catch (e: any) {
      setMensaje("❌ No se pudo cargar productos/categorías. Revisa el token o el backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideTexto =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria =
        filtroCategoria === "todas" ? true : p.id_categoria === filtroCategoria;

      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const abrirCrear = () => {
    setEditando(false);
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: 0,
      id_categoria: categorias[0]?.id_categoria || 1,
      imagen: null,
    });
    setMensaje("");
    setModalAbierto(true);
  };

  const abrirEditar = (p: Producto) => {
    setEditando(true);
    setForm({
      id_producto: p.id_producto,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      id_categoria: p.id_categoria,
      imagen: p.imagen || null,
    });
    setMensaje("");
    setModalAbierto(true);
  };

  const guardar = async () => {
    setMensaje("");
    try {
      if (!puedeEditar) {
        setMensaje("⛔ Supervisor no puede crear/editar.");
        return;
      }

      if (!form.nombre || !form.precio) {
        setMensaje("⚠️ Nombre y precio son obligatorios.");
        return;
      }

      if (editando && form.id_producto) {
        // EDITAR (PUT)
        await api.put(
          `/productos/${form.id_producto}`,
          {
            nombre: form.nombre,
            descripcion: form.descripcion,
            precio: Number(form.precio),
            stock: Number(form.stock),
            id_categoria: Number(form.id_categoria),
            imagen: form.imagen || null,
          },
          { headers }
        );
        setMensaje("✅ Producto actualizado");
      } else {
        // CREAR (POST)
        await api.post(
          "/productos",
          {
            nombre: form.nombre,
            descripcion: form.descripcion,
            precio: Number(form.precio),
            stock: Number(form.stock),
            id_categoria: Number(form.id_categoria),
            imagen: form.imagen || null,
          },
          { headers }
        );
        setMensaje("✅ Producto creado");
      }

      setModalAbierto(false);
      await cargarTodo();
    } catch (e: any) {
      console.error("Error al guardar producto:", e);
      
      if (e?.response?.status === 403) {
        setMensaje("⛔ No tienes permisos para esta acción.");
      } else if (e?.response?.data?.mensaje) {
        setMensaje(`❌ ${e.response.data.mensaje}`);
      } else if (e?.response?.status) {
        setMensaje(`❌ Error ${e.response.status}: ${e.response.statusText}`);
      } else if (e?.message) {
        setMensaje(`❌ ${e.message}`);
      } else {
        setMensaje("❌ Error al guardar. Verifica que el backend esté corriendo en http://localhost:3000");
      }
    }
  };

const desactivar = async (p: Producto) => {
  setMensaje("");
  try {
    if (!puedeEditar) {
      setMensaje("⛔ Supervisor no puede desactivar.");
      return;
    }

    await api.delete(`/productos/${p.id_producto}`, { headers });
    

    setMensaje("✅ Producto desactivado");
    await cargarTodo();
  } catch (e: any) {
    if (e?.response?.status === 403) {
      setMensaje("⛔ No tienes permisos para esta acción.");
    } else {
      setMensaje("❌ Error al desactivar. Revisa el backend.");
    }
  }
};


const activar = async (p: Producto) => {
  setMensaje("");
  try {
    if (!puedeEditar) {
      setMensaje("⛔ Supervisor no puede activar.");
      return;
    }

    await api.patch(`/productos/${p.id_producto}/activar`, {}, { headers });

    setMensaje("✅ Producto activado");
    await cargarTodo();
  } catch (e: any) {
    if (e?.response?.status === 403) {
      setMensaje("⛔ No tienes permisos para esta acción.");
    } else {
      setMensaje("❌ Error al activar. Revisa el backend.");
    }
  }
};


  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Productos</h1>
          <div className="badge">
            {/* <span>📦</span> */}
            <span>Gestión de inventario</span>
            <span className="pill">
              {esSupervisor() ? "Solo lectura" : "Edición habilitada"}
            </span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      <div className="fila">
        <input
          className="input"
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="select"
          value={filtroCategoria}
          onChange={(e) =>
            setFiltroCategoria(e.target.value === "todas" ? "todas" : Number(e.target.value))
          }
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>

        {puedeEditar && (
          <button className="btn-primario" onClick={abrirCrear}>
            + Nuevo producto
          </button>
        )}

        <button className="btn-secundario" onClick={cargarTodo}>
          Recargar
        </button>
      </div>

      {cargando ? (
        <div className="loading">Cargando productos...</div>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ width: 240 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.id_producto}>
                <td>
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
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
                <td>
                  <b>{p.nombre}</b>
                  <div style={{ color: "#cbd5e1", fontSize: 13 }}>{p.descripcion}</div>
                </td>
                <td>{p.categoria || p.id_categoria}</td>
                <td>$ {Number(p.precio).toFixed(2)}</td>
                <td>{p.stock}</td>
                <td>
                  <span className="pill">{p.activo ? "Activo" : "Inactivo"}</span>
                </td>
                <td>
                  <div className="acciones">
                    <button className="btn-secundario" onClick={() => abrirEditar(p)} disabled={!puedeEditar}>
                      Editar
                    </button>

                    {p.activo ? (
                      <button className="btn-secundario" onClick={() => desactivar(p)} disabled={!puedeEditar}>
                        Desactivar
                      </button>
                    ) : (
                      <button className="btn-secundario" onClick={() => activar(p)} disabled={!puedeEditar}>
                        Activar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {mensaje && <div className="mensaje">{mensaje}</div>}

      {/* MODAL */}
      {modalAbierto && (
        <div className="modal-fondo" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar producto" : "Nuevo producto"}</h3>

            <div className="form-grid">
              <input
                className="input full"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              <input
                className="input full"
                placeholder="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />

              <input
                className="input"
                placeholder="Precio"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />

              <input
                className="input"
                placeholder="Stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />

              <select
                className="select full"
                value={form.id_categoria}
                onChange={(e) => setForm({ ...form, id_categoria: Number(e.target.value) })}
              >
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <input
                className="input full"
                placeholder="URL de imagen (opcional)"
                value={form.imagen || ""}
                onChange={(e) => setForm({ ...form, imagen: e.target.value || null })}
              />

              {form.imagen && (
                <div className="full" style={{ marginTop: 8 }}>
                  <img
                    src={form.imagen}
                    alt="Vista previa"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 4,
                      border: "1px solid #334155",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="full" style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const resultado = await convertirImagenABase64(file);
                        if (resultado) {
                          setForm({ ...form, imagen: resultado as string });
                        }
                      } catch (error) {
                        setMensaje(`❌ ${(error as Error).message}`);
                      }
                    }
                  }}
                  style={{ color: "#cbd5e1" }}
                  disabled={!puedeSubirImg}
                />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {puedeSubirImg
                    ? "JPG, PNG o WebP (máximo 5MB)"
                    : "⚠️ Solo Admin y Supervisor pueden subir imágenes"}
                </div>
              </div>
            </div>

            <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button className="btn-primario" onClick={guardar}>
                Guardar
              </button>
            </div>

            <div className="mensaje" style={{ marginTop: 10, color: "#cbd5e1" }}>
              {esSupervisor()
                ? "Supervisor: solo lectura."
                : "Admin/Operador: pueden crear, editar y activar/desactivar."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
