import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/gastos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { puedeSubirImagenes } from "../helpers/imagenHelper";

type Gasto = {
  id_gasto: number;
  concepto: string;
  monto: number;
  fecha: string;
  id_usuario: number;
  observacion?: string;
  usuario?: string;
};

const Gastos = ({ volver }: { volver: () => void }) => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState<number>(1);
  const [observacion, setObservacion] = useState("");

  const puedeRegistrar = esAdmin() || esOperador();

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargar = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const resp = await api.get("/gastos", { headers });
      setGastos(resp.data.gastos || []);
    } catch {
      setMensaje("❌ No se pudo cargar gastos. Revisa token/backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registrar = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje("⛔ Supervisor: solo puede visualizar.");
      return;
    }

    if (!concepto.trim()) {
      setMensaje("⚠️ Ingresa el concepto.");
      return;
    }

    if (!monto || monto <= 0) {
      setMensaje("⚠️ El monto debe ser mayor a 0.");
      return;
    }

    try {
      await api.post(
        "/gastos",
        { concepto, monto, observacion },
        { headers }
      );

      setConcepto("");
      setMonto(1);
      setObservacion("");

      setMensaje("✅ Gasto registrado");
      await cargar();
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;
      setMensaje(msg ? `❌ ${msg}` : "❌ Error al registrar gasto.");
    }
  };

  const total = useMemo(() => {
    return gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  }, [gastos]);

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Gastos</h1>
          <div className="badge">
            <span>💸</span>
            <span>Registro y control de egresos</span>
            <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">Registrar gasto</p>

        <div className="form-grid">
          <input
            className="input full"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Concepto (ej. Pago de internet)"
            disabled={!puedeRegistrar}
          />

          <input
            className="input"
            type="number"
            min={0.01}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
            placeholder="Monto"
            disabled={!puedeRegistrar}
          />

          <input
            className="input"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Observación (opcional)"
            disabled={!puedeRegistrar}
          />

          <div className="fila" style={{ justifyContent: "flex-end", marginBottom: 0 }}>
            <button className="btn-primario" onClick={registrar} disabled={!puedeRegistrar}>
              Registrar
            </button>
          </div>
        </div>

        {!puedeRegistrar && (
          <div className="mensaje">⛔ Supervisor: solo puede visualizar.</div>
        )}
      </div>

      {/* RESUMEN */}
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <div className="pill">Total gastos: <b>${total.toFixed(2)}</b></div>
        <button className="btn-secundario" onClick={cargar}>Recargar</button>
      </div>

      {/* TABLA */}
      {cargando ? (
        <div className="loading">Cargando gastos...</div>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id_gasto}>
                <td>{new Date(g.fecha).toLocaleString()}</td>
                <td>{g.concepto}</td>
                <td>${Number(g.monto).toFixed(2)}</td>
                <td>{g.usuario || "-"}</td>
                <td style={{ color: "#cbd5e1" }}>{g.observacion || "-"}</td>
              </tr>
            ))}

            {gastos.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay gastos registrados.
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

export default Gastos;
