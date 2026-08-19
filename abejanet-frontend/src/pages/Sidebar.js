import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { useTheme } from "../ThemeContext";
import "./Sidebar.css";
import "../controls.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  // Lista de nuestros enlaces
  const menuItems = [
    { path: "/dashboard", icon: "🏠", label: t("menu.home") },
    { path: "/apiarios", icon: "🏷️", label: t("menu.apiarios") },
    { path: "/colmenas", icon: "🍯", label: t("menu.colmenas") },
    { path: "/sensores", icon: "📡", label: t("menu.sensores") },
    { path: "/reportes", icon: "📊", label: t("menu.reportes") },
    { path: "/usuarios", icon: "👥", label: t("menu.usuarios") },
    { path: "/cuenta", icon: "👤", label: t("menu.cuenta") },
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
        <div className="sidebar-tools">
          <button
            className="tool-button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            title="Language / Idioma"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            {t("lang.toggle")}
          </button>

          <button
            className="tool-button"
            onClick={toggleTheme}
            title={theme === "dark" ? t("theme.light") : t("theme.dark")}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
            {theme === "dark" ? t("theme.light") : t("theme.dark")}
          </button>
        </div>

        <button className="sidebar-btn sidebar-logout" onClick={handleLogout}>
          <span className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span className="btn-label">{t("menu.logout")}</span>
        </button>
      </div>
    </aside>
  );
}