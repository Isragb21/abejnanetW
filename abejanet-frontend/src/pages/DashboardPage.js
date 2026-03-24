import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../api"; 
import Sidebar from "./Sidebar"; // 👈 Nuestro menú global
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
  // Estado para los datos reales del backend
  const [kpis, setKpis] = useState({
    colmenasTotales: 0,
    apiarios: 0,
    sensoresActivos: 0,
    alertasHoy: 0,
  });

  // Extraemos solo el nombre para dar la bienvenida
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const nombre = usuario?.nombre || "Apicultor";

  // 📈 Cargar estadísticas reales desde el backend local
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/colmenas`).then(res => res.json()),
      fetch(`${API_BASE_URL}/apiarios`).then(res => res.json()),
      fetch(`${API_BASE_URL}/sensores`).then(res => res.json()),
    ])
      .then(([colmenas, apiarios, sensores]) => {
        setKpis({
          colmenasTotales: Array.isArray(colmenas) ? colmenas.length : 0,
          apiarios: Array.isArray(apiarios) ? apiarios.length : 0,
          sensoresActivos: Array.isArray(sensores) ? sensores.filter(s => s.estado === 'activo').length : 0,
          alertasHoy: 0, // Listo para implementarse en el futuro
        });
      })
      .catch(err => console.error("Error cargando estadísticas del dashboard:", err));
  }, []);

  return (
    <div className="sensores-layout">
      
      {/* ==== SIDEBAR GLOBAL ==== */}
      <Sidebar />

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="sensores-main">
        
        <header className="dashboard-header">
          <div>
            <p className="sensores-badge">Panel general</p>
            <h1>Bienvenido, {nombre.split(" ")[0]} 👋</h1>
            <p className="sensores-subtitle">
              Monitorea el estado de tus apiarios, colmenas y sensores en tiempo real.
            </p>
          </div>

          <div className="dashboard-header-stats">
            <StatChip label="Colmenas" value={kpis.colmenasTotales} />
            <StatChip label="Apiarios" value={kpis.apiarios} />
            <StatChip label="Sensores activos" value={kpis.sensoresActivos} />
            <StatChip label="Alertas hoy" value={kpis.alertasHoy} />
          </div>
        </header>

        {/* Tarjeta hero con CTA */}
        <section className="dashboard-card dashboard-hero">
          <div>
            <h2 style={{ margin: "0 0 6px 0" }}>Visión rápida de tu sistema 🐝</h2>
            <p style={{ margin: "0 0 12px 0", color: "#cccccc" }}>
              Revisa tus registros y genera reportes para analizar la producción.
            </p>
            <div className="dashboard-hero-actions">
              <Link to="/colmenas" className="btn-primario">Ver colmenas</Link>
              <Link to="/sensores" className="btn-secundario">Gestionar sensores</Link>
            </div>
          </div>
        </section>

        {/* Grid de tarjetas de información */}
        <section className="dashboard-grid">
          <article className="dashboard-card">
            <h3>Resumen de tus colmenas</h3>
            <p>Tienes <strong>{kpis.colmenasTotales}</strong> colmenas en <strong>{kpis.apiarios}</strong> apiarios.</p>
            <ul className="dashboard-list">
              <li>Registrar nuevas colmenas.</li>
              <li>Actualizar ubicaciones.</li>
              <li>Consultar histórico.</li>
            </ul>
          </article>

          <article className="dashboard-card">
            <h3>Estado de sensores</h3>
            <p><strong>{kpis.sensoresActivos}</strong> dispositivos enviando datos de peso y temperatura.</p>
            <p className="dashboard-note">Gestiona la instalación desde el módulo de Sensores.</p>
          </article>

          <article className="dashboard-card">
            <h3>Reportes y análisis</h3>
            <p>Descarga reportes en PDF/CSV y visualiza gráficas de rendimiento por temporada.</p>
          </article>

          <article className="dashboard-card dashboard-tips">
            <h3>Buenas prácticas</h3>
            <ul className="dashboard-list">
              <li>Revisa físicamente tus colmenas semanalmente.</li>
              <li>Registra cambios de reina y tratamientos.</li>
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
          <span>&copy; {new Date().getFullYear()} AbejaNet. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span>📧 Soporte: <a href="mailto:soporte@abejanet.com" style={{ color: '#ffe600', textDecoration: 'none' }}>soporte@abejanet.com</a></span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              v3.5.0
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
}
