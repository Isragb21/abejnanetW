import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lista de nuestros enlaces
  const menuItems = [
    { path: "/dashboard", icon: "🏠", label: "Inicio" },
    { path: "/apiarios", icon: "🏷️", label: "Apiarios" },
    { path: "/colmenas", icon: "🍯", label: "Colmenas" },
    { path: "/sensores", icon: "📡", label: "Sensores" },
    { path: "/usuarios", icon: "👥", label: "Usuarios" },
    { path: "/cuenta", icon: "👤", label: "Mi Cuenta" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("abejanet_email");
    navigate("/");
  };

  return (
    <aside className="sidebar-global">
      <div className="sidebar-top">
        <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
          <span className="sidebar-icon">🐝</span>
          <span className="sidebar-text">AbejaNet</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            
            return (
              <button
                key={item.path}
                className={`sidebar-btn ${isActive ? "sidebar-btn-active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="btn-icon">{item.icon}</span>
                <span className="btn-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-btn sidebar-logout" onClick={handleLogout}>
          <span className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Reemplazamos el emoji feo por un ícono SVG estilizado */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}