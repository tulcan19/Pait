import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";

type Periodo = "dia" | "semana" | "mes" | "anio";

type Serie = {
  fecha: string;
  ventas: number;
  compras: number;
  gastos: number;
};

type Resumen = {
  total_ventas: string;
  total_compras: string;
  total_gastos: string;
};

type EstadisticasResponse = {
  resumen: Resumen;
  series: Serie[];
  periodo: Periodo;
  desde: string;
};

function maximoCampo(series: Serie[], campo: keyof Serie) {
  return Math.max(...series.map((s) => Number(s[campo]) || 0), 1);
}

function BarraMini({
  valor,
  max,
  etiqueta,
  color,
}: {
  valor: number;
  max: number;
  etiqueta: string;
  color: string;
}) {
  const ancho = Math.max((valor / max) * 100, 2);
  return (
    <div className="fila" style={{ gap: 8, alignItems: "center" }}>
      <div style={{ width: 80, color: "#cbd5e1", fontSize: 13 }}>{etiqueta}</div>
      <div
        style={{
          flex: 1,
          height: 12,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${ancho}%`,
            height: "100%",
            background: color,
          }}
        />
      </div>
      <div style={{ width: 90, textAlign: "right", color: "#e2e8f0", fontSize: 12 }}>
        ${valor.toFixed(2)}
      </div>
    </div>
  );
}

const Estadisticas = ({ volver }: { volver: () => void }) => {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [datos, setDatos] = useState<EstadisticasResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargar = async (p: Periodo = periodo) => {
    setCargando(true);
    setError("");
    try {
      const resp = await api.get("/dashboard", { headers, params: { periodo: p } });
      setDatos(resp.data);
    } catch {
      setError("No se pudieron cargar las estadísticas. Revisa el token o el backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  const maxVentas = datos?.series ? maximoCampo(datos.series, "ventas") : 1;
  const maxCompras = datos?.series ? maximoCampo(datos.series, "compras") : 1;
  const maxGastos = datos?.series ? maximoCampo(datos.series, "gastos") : 1;

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0 }}>Estadísticas</h1>
          <div className="badge">
            <span>📊</span>
            <span>Tiempo real (según periodo)</span>
            <span className="pill">Día / Semana / Mes / Año</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      <div className="fila" style={{ gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <select
          className="select"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as Periodo)}
        >
          <option value="dia">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Mes en curso</option>
          <option value="anio">Año en curso</option>
        </select>
        <button className="btn-secundario" onClick={() => cargar(periodo)} disabled={cargando}>
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
        {datos?.desde && (
          <span style={{ color: "#cbd5e1", fontSize: 13 }}>
            Desde: {new Date(datos.desde).toLocaleDateString()}
          </span>
        )}
      </div>

      {error && <div className="mensaje">{error}</div>}
      {cargando && <div className="loading">Cargando estadísticas...</div>}

      {!cargando && datos && (
        <>
          <div
            className="grid-metricas"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 14 }}
          >
            <div className="card">
              <p className="card-titulo">Total Ventas</p>
              <p className="card-valor">$ {Number(datos.resumen.total_ventas).toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="card-titulo">Total Compras</p>
              <p className="card-valor">$ {Number(datos.resumen.total_compras).toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="card-titulo">Total Gastos</p>
              <p className="card-valor">$ {Number(datos.resumen.total_gastos).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid-dos">
            <div className="card">
              <p className="card-titulo">Ventas por día</p>
              <div className="fila-col" style={{ gap: 8 }}>
                {datos.series.map((s) => (
                  <BarraMini
                    key={`v-${s.fecha}`}
                    valor={Number(s.ventas)}
                    max={maxVentas}
                    etiqueta={s.fecha.slice(5)}
                    color="#22c55e"
                  />
                ))}
              </div>
            </div>

            <div className="card">
              <p className="card-titulo">Compras por día</p>
              <div className="fila-col" style={{ gap: 8 }}>
                {datos.series.map((s) => (
                  <BarraMini
                    key={`c-${s.fecha}`}
                    valor={Number(s.compras)}
                    max={maxCompras}
                    etiqueta={s.fecha.slice(5)}
                    color="#60a5fa"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <p className="card-titulo">Gastos por día</p>
            <div className="fila-col" style={{ gap: 8 }}>
              {datos.series.map((s) => (
                <BarraMini
                  key={`g-${s.fecha}`}
                  valor={Number(s.gastos)}
                  max={maxGastos}
                  etiqueta={s.fecha.slice(5)}
                  color="#f97316"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Estadisticas;
