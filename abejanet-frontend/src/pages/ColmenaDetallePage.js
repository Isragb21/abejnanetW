import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar";
import { useLang } from "../i18n";
import { useTheme } from "../ThemeContext";

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

function KpiCard({ peso, delta, temp, hum, lluvia, date, t }) {
  const cls = delta > 0 ? "delta positivo" : delta < 0 ? "delta negativo" : "delta neutro";
  const sign = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";

  return (
    <div className="kpi-group">
      <div className="kpi-card">
        <div className="kpi-icon"><FaWeight /></div>
        <div className="kpi-body">
          <span className="kpi-label">{t("det.pesoActual")}</span>
          <span className="kpi-value">{typeof peso === "number" ? `${peso.toFixed(2)} kg` : "—"}</span>
          <span className={cls}>{typeof delta === "number" ? `${sign} ${Math.abs(delta).toFixed(2)} kg` : "—"}</span>
          {date && <span className="kpi-date">{date}</span>}
        </div>
      </div>
      <div className="mini-kpi-row">
        <MiniKpi icon={<FaThermometerHalf />} label={t("det.temperature")} value={temp} unit="°C" />
        <MiniKpi icon={<FaTint />} label={t("det.humidity")} value={hum} unit="%" />
        <div className="mini-kpi">
          <div className="mini-icon"><FaCloudRain /></div>
          <div className="mini-data">
            <span className="mini-label">{t("det.rain")}</span>
            <span className="mini-value">{lluvia === 1 ? t("common.yesRain") : lluvia === 0 ? t("common.noRain") : "—"}</span>
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

function EmptyBox({ title, children }) {
  const { t } = useLang();
  return (
    <div className="empty-box">
      <h4>{title || t("common.noData")}</h4>
      <p>{children}</p>
    </div>
  );
}

/* ====== Página principal ====== */
export default function ColmenaDetallePage() {
  const { id } = useParams();
  const { t, locale } = useLang();
  const { theme } = useTheme();

  const tooltipStyle = theme === "light"
    ? { backgroundColor: "#ece8de", border: "1px solid #ccc", color: "#333" }
    : { backgroundColor: "#1e1e1e", border: "1px solid #444", color: "#eee" };

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
    new Date(ms).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const ultimaFechaFmt = useMemo(() => (ultimaFecha ? formatFecha(ultimaFecha) : null), [ultimaFecha]);

  return (
    <div className="sensores-layout">

      <Sidebar />

      <main className="sensores-main">
        <div className="detalle-colmena-page">
          <div className="page-head" style={{ marginBottom: "20px" }}>
            <div className="crumbs">
              <Link to="/colmenas" style={{ color: "#ffe600", textDecoration: "none", fontWeight: "600" }}>
                {t("det.backColmenas")}
              </Link>
              {colmena?.nombre && (
                <h1 className="crumb-current" style={{ margin: "10px 0 0 0", fontSize: "2rem" }}>
                  {colmena.nombre}
                </h1>
              )}
            </div>
            {colmena?.apiario && (
              <span className="sensores-resumen-pill" style={{ display: "inline-block", marginTop: "10px" }}>
                {t("det.apiarioLabel", { name: colmena.apiario })}
              </span>
            )}
          </div>

          <div className="info-grid">
            <InfoChip icon={<FaBalanceScale />} title={t("det.chipColmena")} value={colmena?.nombre} />
            <InfoChip icon={<FaMapMarkerAlt />} title={t("det.chipApiario")} value={colmena?.apiario} />
          </div>

          <section className="reading-slab">
            <KpiCard peso={pesoActual} delta={variacion} temp={tempActual} hum={humActual} lluvia={lluviaActual} date={ultimaFechaFmt} t={t} />

            <div className="charts-grid">
              <Panel title={t("det.temperature")} icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="temperatura" name={t("det.chartTemp")} dot={false} stroke="#ff5722" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>{t("det.noLectures")}</EmptyBox>}
              </Panel>

              <Panel title={t("det.humidity")} icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="humedad" name={t("det.chartHum")} dot={false} stroke="#03a9f4" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>{t("det.noLectures")}</EmptyBox>}
              </Panel>

              <Panel title={t("det.pesoActual")} icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto", "auto"]} stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip labelFormatter={formatFecha} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: "#aaa" }} />
                      <Line type="monotone" dataKey="peso" name={t("det.chartWeight")} dot={false} stroke="#8bc34a" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyBox>{t("det.noLectures")}</EmptyBox>}
              </Panel>
            </div>
          </section>

          {loading && <div className="cuenta-loading">{t("det.loading")}</div>}
          {fail && (
            <div className="empty-box error" style={{ color: "#ff6b6b" }}>
              <h4>{t("det.errorTitle")}</h4>
              <p>{t("det.errorText", { url: `GET ${API_BASE_URL}/colmenas/${id}/detalle` })}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
