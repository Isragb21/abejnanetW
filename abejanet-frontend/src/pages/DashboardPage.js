import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import logo from "../assets/abeja_logo.png";
import "./DashboardPage.css";

function StatChip({ label, value }) {
  return (
    <div className="dash-stat-chip">
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para los datos reales del backend
  const [kpis, setKpis] = useState({
    colmenasTotales: 0,
    apiarios: 0,
    sensoresActivos: 0,
    alertasHoy: 0,
  });

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const nombre = usuario?.nombre || "Apicultor";

  const initials = useMemo(() => {
    const base = (email || "U").trim();
    return base.slice(0, 2).toUpperCase();
  }, [email]);

  // 📈 Cargar estadísticas reales desde el backend local
  useEffect(() => {
    // Nota: Asegúrate de tener un endpoint en el backend que dé este resumen
    // Si no lo tienes, puedes hacer fetch a /api/colmenas y /api/apiarios y contar el length
    Promise.all([
      fetch(`${API_BASE_URL}/colmenas`).then(res => res.json()),
      fetch(`${API_BASE_URL}/apiarios`).then(res => res.json()),
      fetch(`${API_BASE_URL}/sensores`).then(res => res.json()),
    ])
      .then(([colmenas, apiarios, sensores]) => {
        setKpis({
          colmenasTotales: colmenas.length || 0,
          apiarios: apiarios.length || 0,
          sensoresActivos: sensores.filter(s => s.estado === 'activo').length || 0,
          alertasHoy: 0, // Este podrías implementarlo después
        });
      })
      .catch(err => console.error("Error cargando estadísticas del dashboard:", err));
  }, []);

  const navItems = [
    { to: "/dashboard", label: "Inicio", icon: "🏠" },
    { to: "/apiarios", label: "Apiarios", icon: "🏷️" },
    { to: "/colmenas", label: "Colmenas", icon: "🐝" },
    { to: "/sensores", label: "Sensores", icon: "🛠" },
    { to: "/cuenta", label: "Cuenta", icon: "👤" },
    { to: "/usuarios", label: "Usuarios", icon: "👤" },
  ];

  return (
    <div className="dashboard-layout">
      {/* ==== SIDEBAR ==== */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo" onClick={() => navigate("/dashboard")}>
          <img src={logo} alt="AbejaNet" className="dashboard-logo-img" />
          <span className="dashboard-logo-text">AbejaNet</span>
        </div>

        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <button
              key={item.to}
              className={"dashboard-nav-item" + (location.pathname === item.to ? " dashboard-nav-item-active" : "")}
              onClick={() => navigate(item.to)}
            >
              <span className="dashboard-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer" title={email}>
          <div className="dashboard-user-initials">{initials}</div>
          <div className="dashboard-user-meta">
            <span className="dashboard-user-name">{nombre}</span>
            <span className="dashboard-user-email">{email}</span>
          </div>
        </div>
      </aside>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-badge">Panel general</p>
            <h1>Bienvenido, {nombre.split(" ")[0]} 👋</h1>
            <p className="dashboard-subtitle">
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
            <h2>Visión rápida de tu sistema 🐝</h2>
            <p>Revisa tus registros y genera reportes para analizar la producción.</p>
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
      </main>
    </div>
  );
}

export default DashboardPage;
