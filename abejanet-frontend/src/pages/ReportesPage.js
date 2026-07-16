import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar";
import "./Sensores.css";
import "./ReportesPage.css";

const RANGOS = [
  { label: "Última semana", days: 7 },
  { label: "Último mes", days: 30 },
  { label: "Últimos 2 meses", days: 60 },
  { label: "Últimos 6 meses", days: 180 },
  { label: "Último año", days: 365 },
  { label: "Personalizado", days: 0 },
];

function formatFecha(ms) {
  return new Date(ms).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatFechaCorta(ms) {
  return new Date(ms).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short",
  });
}

function StatCard({ label, value, unit }) {
  return (
    <div className="reporte-stat-card">
      <span className="reporte-stat-label">{label}</span>
      <span className="reporte-stat-value">
        {value !== null && value !== undefined ? `${value}${unit || ""}` : "—"}
      </span>
    </div>
  );
}

export default function ReportesPage() {
  const [colmenas, setColmenas] = useState([]);
  const [lecturasRaw, setLecturas] = useState([]);
  const [selectedColmena, setSelectedColmena] = useState("");
  const [rangoActivo, setRangoActivo] = useState(30);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/colmenas`).then(r => r.json()).then(setColmenas);
  }, []);

  useEffect(() => {
    if (selectedColmena) {
      setLoading(true);
      fetch(`${API_BASE_URL}/lecturas?colmena_id=${selectedColmena}`)
        .then(r => r.json())
        .then(data => {
          const ordenadas = Array.isArray(data) ? data.sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro)) : [];
          setLecturas(ordenadas);
          setLoading(false);
        })
        .catch(() => { setLecturas([]); setLoading(false); });
    }
  }, [selectedColmena]);

  const lecturasFiltradas = useMemo(() => {
    if (!rangoActivo && !fechaDesde && !fechaHasta) return lecturasRaw;
    let desde;
    if (rangoActivo > 0) {
      const now = new Date();
      desde = new Date(now.getTime() - rangoActivo * 86400000);
    } else if (fechaDesde) {
      desde = new Date(fechaDesde);
    }
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : new Date();

    return lecturasRaw.filter(l => {
      const f = new Date(l.fecha_registro);
      if (desde && f < desde) return false;
      if (f > hasta) return false;
      return true;
    });
  }, [lecturasRaw, rangoActivo, fechaDesde, fechaHasta]);

  const stats = useMemo(() => {
    if (!lecturasFiltradas.length) return null;
    const pesos = lecturasFiltradas.filter(l => l.peso != null).map(l => parseFloat(l.peso));
    const temps = lecturasFiltradas.filter(l => l.temperatura != null).map(l => parseFloat(l.temperatura));
    const hums = lecturasFiltradas.filter(l => l.humedad != null).map(l => parseFloat(l.humedad));

    const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const max = arr => arr.length ? Math.max(...arr) : null;
    const min = arr => arr.length ? Math.min(...arr) : null;

    return {
      total: lecturasFiltradas.length,
      pesoProm: avg(pesos), pesoMax: max(pesos), pesoMin: min(pesos),
      tempProm: avg(temps), tempMax: max(temps), tempMin: min(temps),
      humProm: avg(hums),
    };
  }, [lecturasFiltradas]);

  const nombreColmena = colmenas.find(c => String(c.id) === String(selectedColmena))?.nombre || "Sin seleccionar";
  const fechaGeneracion = new Date().toLocaleString("es-MX");

  const handleDescargarPDF = async () => {
    if (!reportRef.current) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#121212",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save(`Reporte_AbejaNet_${nombreColmena.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Intenta de nuevo.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="sensores-layout">
      <Sidebar />
      <main className="sensores-main">
        <header className="sensores-header">
          <div>
            <p className="sensores-badge">Reportes</p>
            <h1>Análisis de Lecturas</h1>
            <p className="sensores-subtitle">Visualiza el histórico y descarga reportes en PDF de tus sensores.</p>
          </div>
        </header>

        {/* CONTROLES */}
        <section className="sensores-card">
          <div className="reportes-filtros">
            <div className="reportes-filtros-row">
              <label className="reporte-select">
                <span>Colmena</span>
                <select value={selectedColmena} onChange={(e) => setSelectedColmena(e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {colmenas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </label>

              <label className="reporte-select">
                <span>Rango de tiempo</span>
                <select value={rangoActivo} onChange={(e) => {
                  const val = Number(e.target.value);
                  setRangoActivo(val);
                  if (val > 0) { setFechaDesde(""); setFechaHasta(""); }
                }}>
                  {RANGOS.map(r => <option key={r.days} value={r.days}>{r.label}</option>)}
                </select>
              </label>
            </div>

            {rangoActivo === 0 && (
              <div className="reportes-filtros-row">
                <label className="reporte-select">
                  <span>Desde</span>
                  <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </label>
                <label className="reporte-select">
                  <span>Hasta</span>
                  <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </label>
              </div>
            )}

            <div className="reportes-actions">
              <button
                className="btn-primario"
                disabled={!selectedColmena || generatingPdf}
                onClick={handleDescargarPDF}
              >
                {generatingPdf ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </section>

        {/* CONTENIDO DESCARGABLE */}
        <div ref={reportRef} className="reportes-printable">
          {/* HEADER DEL REPORTE */}
          <div className="reportes-pdf-header">
            <h2>AbejaNet — Reporte de Lecturas</h2>
            <p>Colmena: <strong>{nombreColmena}</strong></p>
            <p>Período: {rangoActivo > 0 ? `Últimos ${rangoActivo} días` : `${fechaDesde || "Inicio"} al ${fechaHasta || "Hoy"}`}</p>
            <p>Generado: {fechaGeneracion}</p>
          </div>

          {loading ? (
            <div className="cuenta-loading">Cargando datos...</div>
          ) : stats ? (
            <>
              {/* KPIs */}
              <div className="reportes-stats-row">
                <StatCard label="Lecturas totales" value={stats.total} />
                <StatCard label="Peso promedio" value={stats.pesoProm?.toFixed(2)} unit=" kg" />
                <StatCard label="Temp. promedio" value={stats.tempProm?.toFixed(1)} unit="°C" />
                <StatCard label="Humedad promedio" value={stats.humProm?.toFixed(1)} unit="%" />
                <StatCard label="Peso máx" value={stats.pesoMax?.toFixed(2)} unit=" kg" />
                <StatCard label="Peso mín" value={stats.pesoMin?.toFixed(2)} unit=" kg" />
              </div>

              {/* GRÁFICAS */}
              <div className="reportes-grid">
                <section className="sensores-card">
                  <h3>Peso (kg)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={lecturasFiltradas}>
                      <defs>
                        <linearGradient id="gradPeso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8bc34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8bc34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="fecha_registro" tickFormatter={formatFechaCorta} stroke="#aaa" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Area type="monotone" dataKey="peso" stroke="#8bc34a" fill="url(#gradPeso)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </section>

                <section className="sensores-card">
                  <h3>Temperatura (°C)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={lecturasFiltradas}>
                      <defs>
                        <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="fecha_registro" tickFormatter={formatFechaCorta} stroke="#aaa" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Area type="monotone" dataKey="temperatura" stroke="#ff5722" fill="url(#gradTemp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </section>

                <section className="sensores-card">
                  <h3>Humedad (%)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={lecturasFiltradas}>
                      <defs>
                        <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#03a9f4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#03a9f4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="fecha_registro" tickFormatter={formatFechaCorta} stroke="#aaa" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Area type="monotone" dataKey="humedad" stroke="#03a9f4" fill="url(#gradHum)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </section>

                <section className="sensores-card">
                  <h3>Lluvia</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturasFiltradas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="fecha_registro" tickFormatter={formatFechaCorta} stroke="#aaa" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#aaa" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => v === 1 ? "Sí" : "No"} />
                      <Tooltip labelFormatter={formatFecha} contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} />
                      <Line type="stepAfter" dataKey="lluvia" stroke="#ab47bc" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </section>
              </div>

              {/* TABLA DE LECTURAS */}
              <section className="sensores-card" style={{ marginTop: 20 }}>
                <h3>Detalle de lecturas ({lecturasFiltradas.length} registros)</h3>
                <div className="tabla-wrapper">
                  <table className="tabla-sensores">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Temperatura</th>
                        <th>Humedad</th>
                        <th>Peso</th>
                        <th>Sonido</th>
                        <th>Lluvia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturasFiltradas.slice().reverse().map((l, i) => (
                        <tr key={l.id || i}>
                          <td>{new Date(l.fecha_registro).toLocaleString("es-MX")}</td>
                          <td>{l.temperatura != null ? `${l.temperatura}°C` : "—"}</td>
                          <td>{l.humedad != null ? `${l.humedad}%` : "—"}</td>
                          <td>{l.peso != null ? `${l.peso} kg` : "—"}</td>
                          <td>{l.sonido != null ? `${l.sonido} dB` : "—"}</td>
                          <td>{l.lluvia === true || l.lluvia === 1 ? "🌧️ Sí" : "☀️ No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-box">
              {selectedColmena ? "No hay lecturas registradas para esta colmena en el período seleccionado." : "Selecciona una colmena y un rango de tiempo para generar el reporte."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
