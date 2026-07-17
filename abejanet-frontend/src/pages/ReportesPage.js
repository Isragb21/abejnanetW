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

function StatCard({ label, value, unit, color, icon }) {
  return (
    <div className="reporte-stat-card" style={{ "--card-accent": color || "#ffe600" }}>
      <div className="reporte-stat-icon">{icon || ""}</div>
      <div className="reporte-stat-body">
        <span className="reporte-stat-label">{label}</span>
        <span className="reporte-stat-value">
          {value !== null && value !== undefined ? `${value}${unit || ""}` : "—"}
        </span>
      </div>
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
      const doc = new jsPDF("p", "mm", "a4"); // Cambio a Portrait para mejor legibilidad

      // --- PÁGINA 1: RESUMEN Y GRÁFICAS ---
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
      
      doc.setFontSize(22);
      doc.setTextColor(0);
      doc.text("Reporte AbejaNet", 15, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Colmena: ${nombreColmena}`, 15, 28);
      doc.text(`Periodo: ${rangoActivo > 0 ? `Ultimos ${rangoActivo} dias` : `${fechaDesde || "Inicio"} al ${fechaHasta || "Hoy"}`}`, 15, 33);
      doc.line(15, 38, 195, 38);

      // Resumen Table-like
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Resumen de Metricas", 15, 50);
      
      const statsData = [
        ["Total Lecturas", `${stats.total}`],
        ["Peso Promedio", `${stats.pesoProm?.toFixed(2)} kg`],
        ["Temp. Promedio", `${stats.tempProm?.toFixed(1)} C`],
        ["Humedad Prom.", `${stats.humProm?.toFixed(1)} %`],
        ["Peso Max.", `${stats.pesoMax?.toFixed(2)} kg`],
        ["Peso Min.", `${stats.pesoMin?.toFixed(2)} kg`]
      ];

      let y = 60;
      statsData.forEach(([label, value]) => {
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 5, 180, 8, "F");
        doc.setTextColor(60);
        doc.setFontSize(10);
        doc.text(label, 20, y);
        doc.setTextColor(0);
        doc.text(value, 160, y);
        y += 10;
      });

      // Gráficas
      const gridElement = document.querySelector(".reportes-grid");
      if (gridElement) {
        const canvas = await html2canvas(gridElement, { scale: 1.5, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        doc.text("Analisis Grafico", 15, y + 5);
        doc.addImage(imgData, "PNG", 15, y + 10, 180, 70); 
      }

      // --- PÁGINA 2+: DETALLE DE LECTURAS ---
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Detalle de Lecturas", 15, 20);

      const colWidths = [45, 25, 25, 25, 25, 20];
      const headers = ["Fecha", "Temp", "Hum", "Peso", "Sonido", "Lluvia"];
      
      let tableY = 30;
      // Header Tabla
      doc.setFillColor(50, 50, 50);
      doc.rect(15, tableY - 5, 170, 7, "F");
      doc.setTextColor(255);
      headers.forEach((h, i) => {
        let x = 15 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x + 2, tableY);
      });

      doc.setTextColor(0);
      tableY += 8;
      lecturasFiltradas.slice().reverse().slice(0, 35).forEach((l, idx) => {
        if (tableY > 270) {
          doc.addPage();
          tableY = 20;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(15, tableY - 4, 170, 6, "F");
        }
        
        const row = [
          new Date(l.fecha_registro).toLocaleString("es-MX", {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}),
          l.temperatura != null ? `${l.temperatura}C` : "-",
          l.humedad != null ? `${l.humedad}%` : "-",
          l.peso != null ? `${l.peso}kg` : "-",
          l.sonido != null ? `${l.sonido}dB` : "-",
          l.lluvia ? "Si" : "No"
        ];
        
        row.forEach((cell, i) => {
          let x = 15 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, x + 2, tableY);
        });
        tableY += 7;
      });

      doc.save(`Reporte_${nombreColmena.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error al generar PDF");
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
                <StatCard label="Lecturas totales" value={stats.total} color="#ffe600" icon="📊" />
                <StatCard label="Peso promedio" value={stats.pesoProm?.toFixed(2)} unit=" kg" color="#8bc34a" icon="⚖️" />
                <StatCard label="Temp. promedio" value={stats.tempProm?.toFixed(1)} unit="°C" color="#ff5722" icon="🌡️" />
                <StatCard label="Humedad promedio" value={stats.humProm?.toFixed(1)} unit="%" color="#03a9f4" icon="💧" />
                <StatCard label="Peso máx" value={stats.pesoMax?.toFixed(2)} unit=" kg" color="#66bb6a" icon="▲" />
                <StatCard label="Peso mín" value={stats.pesoMin?.toFixed(2)} unit=" kg" color="#ef5350" icon="▼" />
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
