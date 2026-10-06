import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../api"; 
import Sidebar from "./Sidebar"; // 👈 Nuestro menú global
import { useLang } from "../i18n";
import PageNotice from "../components/PageNotice";
import { getPageErrorMessage } from "../utils/pageErrors";
import "./Sensores.css"; // 👈 Para heredar el fondo oscuro
import "./DashboardPage.css";

function StatChip({ label, value }) {
  return (
    <div className="dash-stat-chip">
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLang();

  const [kpis, setKpis] = useState({
    colmenasTotales: null,
    apiarios: null,
    sensoresActivos: null,
    alertasHoy: null,
  });
  const [pageError, setPageError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const nombre = usuario?.nombre || t("dash.fallbackName");

  useEffect(() => {
    setPageError("");
    const loadJson = (url) => fetch(url).then((res) => {
      if (!res.ok) {
        const error = new Error("No se pudieron cargar los datos del panel.");
        error.status = res.status;
        throw error;
      }
      return res.json();
    });

    Promise.all([
      loadJson(`${API_BASE_URL}/colmenas`),
      loadJson(`${API_BASE_URL}/apiarios`),
      loadJson(`${API_BASE_URL}/sensores`),
    ])
      .then(([colmenas, apiarios, sensores]) => {
        setKpis({
          colmenasTotales: Array.isArray(colmenas) ? colmenas.length : 0,
          apiarios: Array.isArray(apiarios) ? apiarios.length : 0,
          sensoresActivos: Array.isArray(sensores) ? sensores.filter(s => s.estado === 'activo').length : 0,
          alertasHoy: 0, // Listo para implementarse en el futuro
        });
      })
      .catch((err) => {
        console.error("Error cargando estadísticas del panel:", err);
        setPageError(getPageErrorMessage(err, t));
      });
  }, [reloadCount, t]);

  return (
    <div className="sensores-layout">
      
      {/* ==== SIDEBAR GLOBAL ==== */}
      <Sidebar />

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="sensores-main">
        {pageError && (
          <PageNotice onRetry={() => setReloadCount((count) => count + 1)} retryLabel={t("common.retry")}>
            {pageError}
          </PageNotice>
        )}
        
        <header className="dashboard-header">
          <div>
            <p className="sensores-badge">{t("dash.badge")}</p>
            <h1>{t("dash.welcome", { name: nombre.split(" ")[0] })} 👋</h1>
            <p className="sensores-subtitle">
              {t("dash.subtitle")}
            </p>
          </div>

          <div className="dashboard-header-stats">
            <StatChip label={t("dash.statColmenas")} value={kpis.colmenasTotales} />
            <StatChip label={t("dash.statApiarios")} value={kpis.apiarios} />
            <StatChip label={t("dash.statSensores")} value={kpis.sensoresActivos} />
            <StatChip label={t("dash.statAlertas")} value={kpis.alertasHoy} />
          </div>
        </header>

        {/* Tarjeta hero con CTA */}
        <section className="dashboard-card dashboard-hero">
          <div>
            <h2 style={{ margin: "0 0 6px 0" }}>{t("dash.heroTitle")}</h2>
            <p style={{ margin: "0 0 12px 0", color: "#cccccc" }}>
              {t("dash.heroText")}
            </p>
            <div className="dashboard-hero-actions">
              <Link to="/colmenas" className="btn-primario">{t("dash.btnColmenas")}</Link>
              <Link to="/sensores" className="btn-secundario">{t("dash.btnSensores")}</Link>
            </div>
          </div>
        </section>

        {/* Grid de tarjetas de información */}
        <section className="dashboard-grid">
          <article className="dashboard-card">
            <h3>{t("dash.card1Title")}</h3>
            <p>{t("dash.card1Text", { colmenas: kpis.colmenasTotales, apiarios: kpis.apiarios })}</p>
            <ul className="dashboard-list">
              <li>{t("dash.card1Li1")}</li>
              <li>{t("dash.card1Li2")}</li>
              <li>{t("dash.card1Li3")}</li>
            </ul>
          </article>

          <article className="dashboard-card">
            <h3>{t("dash.card2Title")}</h3>
            <p>{t("dash.card2Text", { sensores: kpis.sensoresActivos })}</p>
            <p className="dashboard-note">{t("dash.card2Note")}</p>
          </article>

          <article className="dashboard-card">
            <h3>{t("dash.card3Title")}</h3>
            <p>{t("dash.card3Text")}</p>
          </article>

          <article className="dashboard-card dashboard-tips">
            <h3>{t("dash.card4Title")}</h3>
            <ul className="dashboard-list">
              <li>{t("dash.card4Li1")}</li>
              <li>{t("dash.card4Li2")}</li>
            </ul>
          </article>
        </section>

        {/* ==== FOOTER ==== */}
        <footer style={{
          marginTop: 'auto', // Empuja el footer hacia abajo
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          color: '#888',
          fontSize: '0.85rem'
        }}>
          <span>&copy; {new Date().getFullYear()} AbejaNet. {t("dash.footerRights")}</span>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span>📧 {t("dash.footerSupport")} <a href="mailto:soporte@abejanet.com" style={{ color: '#ffe600', textDecoration: 'none' }}>soporte@abejanet.com</a></span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              v3.5.0
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
}
