import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import API_BASE_URL from "../api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  FaWeight,
  FaMapMarkerAlt,
  FaChartLine,
  FaBalanceScale,
  FaThermometerHalf,
  FaTint,
  FaCloudRain,
} from "react-icons/fa";

import "./ColmenaDetallePage.css";
import "./Sensores.css"; // Fundamental para el layout oscuro

/* ====== Subcomponentes UI ====== */
function InfoChip({ icon, title, value }) {
  return (
    <div className="info-chip">
      <div className="chip-icon">{icon}</div>
      <div className="chip-text">
        <span className="chip-title">{title}</span>
        <span className="chip-value">{value ?? "—"}</span>
      </div>
    </div>
  );
}

function MiniKpi({ icon, label, value, unit }) {
  return (
    <div className="mini-kpi">
      <div className="mini-icon">{icon}</div>
      <div className="mini-data">
        <span className="mini-label">{label}</span>
        <span className="mini-value">
          {typeof value === "number" ? `${value.toFixed(1)}${unit}` : "—"}
        </span>
      </div>
    </div>
  );
}

function KpiCard({ peso, delta, temp, hum, lluvia, date }) {
  const cls = delta > 0 ? "delta positivo" : delta < 0 ? "delta negativo" : "delta neutro";
  const sign = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";

  return (
    <div className="kpi-group">
      <div className="kpi-card">
        <div className="kpi-icon"><FaWeight /></div>
        <div className="kpi-body">
          <span className="kpi-label">Peso actual</span>
          <span className="kpi-value">{typeof peso === "number" ? `${peso.toFixed(2)} kg` : "—"}</span>
          <span className={cls}>{typeof delta === "number" ? `${sign} ${Math.abs(delta).toFixed(2)} kg` : "—"}</span>
          {date && <span className="kpi-date">{date}</span>}
        </div>
      </div>
      <div className="mini-kpi-row">
        <MiniKpi icon={<FaThermometerHalf />} label="Temperatura" value={temp} unit="°C" />
        <MiniKpi icon={<FaTint />} label="Humedad" value={hum} unit="%" />
        <div className="mini-kpi">
          <div className="mini-icon"><FaCloudRain /></div>
          <div className="mini-data">
            <span className="mini-label">Lluvia</span>
            <span className="mini-value">{lluvia === 1 ? "🌧️ Sí" : lluvia === 0 ? "☀️ No" : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-icon">{icon}</span>
        <h3 className="panel-title">{title}</h3>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function EmptyBox({ title = "Sin datos", children }) {
  return (
    <div className="empty-box">
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

/* ====== Página principal ====== */
export default function ColmenaDetallePage() {
  const { id } = useParams();

  const [colmena, setColmena] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [pesoActual, setPesoActual] = useState(null);
  const [tempActual, setTempActual] = useState(null);
  const [humActual, setHumActual] = useState(null);
  const [lluviaActual, setLluviaActual] = useState(null);
  const [variacion, setVariacion] = useState(null);
  const [ultimaFecha, setUltimaFecha] = useState(null);
  const [fail, setFail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setFail(false);

    axios
      .get(`${API_BASE_URL}/colmenas/${id}/detalle`)
      .then((res) => {
        setColmena(res.data.colmena);

        const lecturasProcesadas = (res.data.lecturas || []).map((l) => ({
          fecha: new Date(l.fecha_registro).getTime(),
          temperatura: l.temperatura != null ? parseFloat(l.temperatura) : null,
          humedad: l.humedad != null ? parseFloat(l.humedad) : null,
          peso: l.peso != null ? parseFloat(l.peso) : null,
          lluvia: l.lluvia ?? null,
        }));

        setLecturas(lecturasProcesadas);

        const ultima = lecturasProcesadas[0] || null;
        const penultima = lecturasProcesadas[1] || null;

        setPesoActual(ultima?.peso ?? null);
        setTempActual(ultima?.temperatura ?? null);
        setHumActual(ultima?.humedad ?? null);
        setLluviaActual(ultima?.lluvia ?? null);
        setUltimaFecha(ultima?.fecha ?? null);

        if (typeof ultima?.peso === "number" && typeof penultima?.peso === "number") {
          setVariacion(ultima.peso - penultima.peso);
        } else {
          setVariacion(null);
        }
      })
      .catch((err) => {
        console.error("Error cargando detalles de colmena:", err);
        setFail(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatFecha = (ms) =>
    new Date(ms).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const ultimaFechaFmt = useMemo(() => (ultimaFecha ? formatFecha(ultimaFecha) : null), [ultimaFecha]);

  return (
    <div className="sensores-layout">

      <main className="sensores-main">
        <div className="detalle-colmena-page">
          <div className="page-head" style={{ marginBottom: "20px" }}>
            <div className="crumbs">
              <Link to="/colmenas" style={{ color: "#ffe600", textDecoration: "none", fontWeight: "600" }}>
                ← Volver a Colmenas
              </Link>
              {colmena?.nombre && (
                <h1 style={{ margin: "10px 0 0 0", color: "#fff", fontSize: "2rem" }}>
                  {colmena.nombre}
                </h1>
              )}
            </div>
            {colmena?.apiario && (
              <span className="sensores-resumen-pill" style={{ display: "inline-block", marginTop: "10px" }}>
                📍 Apiario: {colmena.apiario}
              </span>
            )}
          </div>

          <div className="info-grid">
            <InfoChip icon={<FaBalanceScale />} title="Colmena" value={colmena?.nombre} />
            <InfoChip icon={<FaMapMarkerAlt />} title="Apiario" value={colmena?.apiario} />
          </div>

          <section className="reading-slab">
            <KpiCard peso={pesoActual} delta={variacion} temp={tempActual} hum={humActual} lluvia={lluviaActual} date={ultimaFechaFmt} />

            <div className="charts-grid">
              <Panel title="Temperatura" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="temperatura" name="Temperatura (°C)" dot={false} stroke="#ff5722" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>Sin lecturas disponibles.</EmptyBox>}
              </Panel>

              <Panel title="Humedad" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="humedad" name="Humedad (%)" dot={false} stroke="#03a9f4" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>Sin lecturas disponibles.</EmptyBox>}
              </Panel>

              <Panel title="Peso" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="peso" name="Peso (kg)" dot={false} stroke="#8bc34a" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>Sin lecturas disponibles.</EmptyBox>}
              </Panel>
            </div>
          </section>

          {loading && <div className="cuenta-loading">Cargando datos de la colmena…</div>}
          {fail && (
            <div className="empty-box error" style={{ color: "#ff6b6b" }}>
              <h4>Ocurrió un problema</h4>
              <p>Verifica la API local: <code>GET {API_BASE_URL}/colmenas/{id}/detalle</code></p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
