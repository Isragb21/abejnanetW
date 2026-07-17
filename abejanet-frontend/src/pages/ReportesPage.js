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
      const doc = new jsPDF("l", "mm", "a4");
      const pageW = 297;
      const pageH = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;

      const drawChart = (doc, data, dataKey, title, color, x0, y0, w, h) => {
        const values = data.filter(d => d[dataKey] != null).map(d => parseFloat(d[dataKey]));
        if (values.length < 2) return;
        const min = Math.min(...values) * 0.95;
        const max = Math.max(...values) * 1.05;
        const range = max - min || 1;
        const padL = 18;
        const padR = 5;
        const padT = 10;
        const padB = 12;
        const gW = w - padL - padR;
        const gH = h - padT - padB;
        const gX = x0 + padL;
        const gY = y0 + padT;

        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text(title, x0, y0 - 2);

        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        for (let i = 0; i <= 4; i++) {
          const ly = gY + gH - (i / 4) * gH;
          doc.line(gX, ly, gX + gW, ly);
          doc.setFontSize(6);
          doc.setTextColor(140);
          doc.text((min + (range * i) / 4).toFixed(1), x0, ly + 1.5);
        }

        const validData = data.filter(d => d[dataKey] != null);
        const step = gW / (validData.length - 1);
        const pts = validData.map((d, i) => ({
          x: gX + i * step,
          y: gY + gH - ((parseFloat(d[dataKey]) - min) / range) * gH,
        }));

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        doc.setFillColor(r, g, b);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.6);

        doc.beginPath();
        doc.moveTo(pts[0].x, gY + gH);
        pts.forEach(p => doc.lineTo(p.x, p.y));
        doc.lineTo(pts[pts.length - 1].x, gY + gH);
        doc.setFillColor(r, g, b);
        doc.fill();

        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.5);
        doc.beginPath();
        doc.moveTo(pts[0].x, pts[0].y);
        pts.forEach(p => doc.lineTo(p.x, p.y));
        doc.stroke();

        if (values.length <= 30) {
          doc.setFillColor(r, g, b);
          pts.forEach(p => doc.circle(p.x, p.y, 1, "F"));
        }

        doc.setDrawColor(60);
        doc.setLineWidth(0.3);
        doc.line(gX, gY, gX, gY + gH);
        doc.line(gX, gY + gH, gX + gW, gY + gH);
      };

      const drawRainChart = (doc, data, x0, y0, w, h) => {
        const padL = 18;
        const padR = 5;
        const padT = 10;
        const padB = 12;
        const gW = w - padL - padR;
        const gH = h - padT - padB;
        const gX = x0 + padL;
        const gY = y0 + padT;

        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text("Lluvia", x0, y0 - 2);

        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        doc.line(gX, gY + gH, gX + gW, gY + gH);
        doc.line(gX, gY, gX + gW, gY);

        doc.setFontSize(6);
        doc.setTextColor(140);
        doc.text("Si", x0, gY + 4);
        doc.text("No", x0, gY + gH + 2);

        const step = gW / (data.length - 1 || 1);
        doc.setDrawColor(171, 71, 188);
        doc.setLineWidth(0.6);
        doc.beginPath();
        let prevY = gY;
        data.forEach((d, i) => {
          const px = gX + i * step;
          const py = d.lluvia ? gY + 2 : gY + gH - 2;
          if (i === 0) doc.moveTo(px, py);
          else {
            doc.lineTo(px, prevY);
            doc.lineTo(px, py);
          }
          prevY = py;
        });
        doc.stroke();

        doc.setDrawColor(60);
        doc.setLineWidth(0.3);
        doc.line(gX, gY, gX, gY + gH);
        doc.line(gX, gY + gH, gX + gW, gY + gH);
      };

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");

      doc.setFontSize(22);
      doc.setTextColor(0);
      doc.text("Reporte AbejaNet", margin, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Colmena: ${nombreColmena}`, margin, 28);
      doc.text(`Periodo: ${rangoActivo > 0 ? `Ultimos ${rangoActivo} dias` : `${fechaDesde || "Inicio"} al ${fechaHasta || "Hoy"}`}`, margin, 33);
      doc.setDrawColor(180);
      doc.line(margin, 38, pageW - margin, 38);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Resumen de Metricas", margin, 48);

      const statsData = [
        ["Total Lecturas", `${stats.total}`],
        ["Peso Promedio", `${stats.pesoProm?.toFixed(2)} kg`],
        ["Temp. Promedio", `${stats.tempProm?.toFixed(1)} C`],
        ["Humedad Prom.", `${stats.humProm?.toFixed(1)} %`],
        ["Peso Max.", `${stats.pesoMax?.toFixed(2)} kg`],
        ["Peso Min.", `${stats.pesoMin?.toFixed(2)} kg`]
      ];

      let y = 55;
      const cellW = contentW / 3;
      statsData.forEach(([label, value], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bx = margin + col * cellW;
        const by = y + row * 14;
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(bx, by, cellW - 4, 11, 2, 2, "F");
        doc.setTextColor(80);
        doc.setFontSize(9);
        doc.text(label, bx + 4, by + 5);
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(value, bx + 4, by + 9.5);
      });

      if (lecturasFiltradas.length > 1) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, "F");
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Analisis Grafico", margin, 20);

        const cw = (contentW - 10) / 2;
        const ch = 78;

        drawChart(doc, lecturasFiltradas, "peso", "Peso (kg)", "#8bc34a", margin, 32, cw, ch);
        drawChart(doc, lecturasFiltradas, "temperatura", "Temperatura (C)", "#ff5722", margin + cw + 10, 32, cw, ch);
        drawChart(doc, lecturasFiltradas, "humedad", "Humedad (%)", "#03a9f4", margin, 32 + ch + 12, cw, ch);
        drawRainChart(doc, lecturasFiltradas, margin + cw + 10, 32 + ch + 12, cw, ch);
      }

      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Detalle de Lecturas", margin, 20);

      const colWidths = [80, 40, 40, 40, 40, 40];
      const headers = ["Fecha", "Temp", "Humedad", "Peso", "Sonido", "Lluvia"];
      const totalW = colWidths.reduce((a, b) => a + b, 0);

      let tableY = 30;
      doc.setFillColor(40, 40, 40);
      doc.rect(margin, tableY - 5, totalW, 8, "F");
      doc.setTextColor(255);
      doc.setFontSize(9);
      let headerX = margin;
      headers.forEach((h, i) => {
        doc.text(h, headerX + 3, tableY);
        headerX += colWidths[i];
      });

      doc.setTextColor(0);
      tableY += 10;
      lecturasFiltradas.slice().reverse().forEach((l, idx) => {
        if (tableY > pageH - 15) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageW, pageH, "F");
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Detalle de Lecturas (cont.)", margin, 20);
          tableY = 30;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, tableY - 4, totalW, 7, "F");
        }
        const row = [
          new Date(l.fecha_registro).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
          l.temperatura != null ? `${l.temperatura} C` : "-",
          l.humedad != null ? `${l.humedad} %` : "-",
          l.peso != null ? `${l.peso} kg` : "-",
          l.sonido != null ? `${l.sonido} dB` : "-",
          l.lluvia ? "Si" : "No"
        ];
        doc.setFontSize(8);
        let cellX = margin;
        row.forEach((cell, i) => {
          doc.text(cell, cellX + 3, tableY);
          cellX += colWidths[i];
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
