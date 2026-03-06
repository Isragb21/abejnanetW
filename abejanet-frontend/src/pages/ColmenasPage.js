import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import "./ColmenasPage.css";
import logo from "../assets/abeja_logo.png";

/* SUBCOMPONENTES */
function StatChip({ label, value }) {
  return (
    <div className="stat-chip">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-colmena skeleton">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-desc" />
      <div className="sk-line sk-desc short" />
      <div className="sk-badge" />
    </div>
  );
}

/* PÁGINA */
export default function ColmenasPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [errorDelete, setErrorDelete] = useState("");

  // Controles
  const [q, setQ] = useState("");
  const [apiario, setApiario] = useState("todos");
  const [sort, setSort] = useState("nombre_asc");

  // Usuario chip
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const initials = (email || "U").slice(0, 2).toUpperCase();

  const navItems = [
    { to: "/dashboard", label: "Inicio", icon: "🏠" },
    { to: "/apiarios", label: "Apiarios", icon: "🏷️" },
    { to: "/colmenas", label: "Colmenas", icon: "🐝" },
    { to: "/sensores", label: "Sensores", icon: "🛠" },
    { to: "/cuenta", label: "Cuenta", icon: "👤" },
    { to: "/usuarios", label: "Usuarios", icon: "👤" },
  ];

  useEffect(() => {
    const cargarColmenas = async () => {
      try {
        setLoading(true);
        // ✅ Ahora usa la URL dinámica de localhost:4000
        const res = await axios.get(`${API_BASE_URL}/colmenas`);
        setColmenas(res.data || []);
      } catch (error) {
        console.error("Error al cargar colmenas:", error);
        setFail(true);
      } finally {
        setLoading(false);
      }
    };
    cargarColmenas();
  }, []);

  const apiarios = useMemo(() => {
    const set = new Set();
    colmenas.forEach((c) => c.apiario && set.add(c.apiario));
    return ["todos", ...Array.from(set)];
  }, [colmenas]);

  const filtered = useMemo(() => {
    let rows = [...colmenas];

    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter((c) => {
        const n = (c.nombre || "").toLowerCase();
        const d = (c.descripcion_especifica || "").toLowerCase();
        const a = (c.apiario || "").toLowerCase();
        return n.includes(needle) || d.includes(needle) || a.includes(needle);
      });
    }

    if (apiario !== "todos") {
      rows = rows.filter((c) => (c.apiario || "") === apiario);
    }

    const compareStr = (a, b) =>
      (a || "").toString().localeCompare((b || "").toString(), "es", { sensitivity: "base" });

    switch (sort) {
      case "nombre_asc": rows.sort((a, b) => compareStr(a.nombre, b.nombre)); break;
      case "nombre_desc": rows.sort((a, b) => compareStr(b.nombre, a.nombre)); break;
      case "apiario_asc": rows.sort((a, b) => compareStr(a.apiario, b.apiario)); break;
      case "apiario_desc": rows.sort((a, b) => compareStr(b.apiario, a.apiario)); break;
      default: break;
    }

    return rows;
  }, [colmenas, q, apiario, sort]);

  /* Eliminar colmena */
  const handleDelete = async (id, nombre) => {
    setErrorDelete("");
    const ok = window.confirm(`¿Eliminar la colmena "${nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    const prev = colmenas;
    setDeletingId(id);
    setColmenas((xs) => xs.filter((c) => c.id !== id));

    try {
      // ✅ Ahora usa la URL dinámica de localhost:4000
      const res = await axios.delete(`${API_BASE_URL}/colmenas/${id}`);
      if (res.status !== 200) throw new Error("No se pudo eliminar");
    } catch (e) {
      setColmenas(prev);
      setErrorDelete(e?.response?.data?.error || e.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="colmenas-layout">
      <aside className="colmenas-sidebar">
        <div className="colmenas-logo" onClick={() => navigate("/dashboard")} title="Volver al inicio">
          <img src={logo} alt="AbejaNet" className="colmenas-logo-img" />
          <span className="colmenas-logo-text">AbejaNet</span>
        </div>

        <nav className="colmenas-nav">
          {navItems.map((item) => (
            <button
              key={item.to}
              className={"colmenas-nav-item" + (location.pathname === item.to ? " colmenas-nav-item-active" : "")}
              onClick={() => navigate(item.to)}
            >
              <span className="colmenas-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="colmenas-sidebar-footer" title={email}>
          <div className="colmenas-user-initials">{initials}</div>
          <div className="colmenas-user-email">{email}</div>
        </div>
      </aside>

      <main className="colmenas-main">
        <div className="colmenas-container">
          <header className="colmenas-header">
            <div>
              <p className="colmenas-badge">Panel de control</p>
              <h1>Colmenas registradas</h1>
              <p className="colmenas-subtitle">Administra las colmenas de tus apiarios y ubicaciones.</p>
            </div>
            <div className="colmenas-header-stats">
              <StatChip label="Total" value={colmenas.length} />
              <StatChip label="Mostrando" value={filtered.length} />
              <StatChip label="Apiarios" value={apiarios.filter((a) => a !== "todos").length} />
            </div>
          </header>

          <section className="colmenas-card">
            <div className="colmenas-card-head-row">
              <div className="toolbar">
                <div className="input-wrap">
                  <input className="input" type="text" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
                  <span className="kbd">/</span>
                </div>
                <div className="selects">
                  <label className="select">
                    <span>Apiario</span>
                    <select value={apiario} onChange={(e) => setApiario(e.target.value)}>
                      {apiarios.map((a) => (<option key={a} value={a}>{a === "todos" ? "Todos" : a}</option>))}
                    </select>
                  </label>
                  <label className="select">
                    <span>Orden</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="nombre_asc">Nombre (A→Z)</option>
                      <option value="nombre_desc">Nombre (Z→A)</option>
                    </select>
                  </label>
                </div>
              </div>
              <Link to="/colmenas/crear" className="btn-primary">➕ Crear colmena</Link>
            </div>
          </section>

          <section className="colmenas-card colmenas-card-lista">
            {errorDelete && (
              <div className="empty-box error" style={{ marginBottom: 12 }}>
                <h3>⚠️ Error</h3><p>{errorDelete}</p>
              </div>
            )}

            {loading ? (
              <div className="grid-colmenas">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : fail ? (
              <div className="empty-box error">
                <h3>😕 Error de conexión</h3>
                <p>No se pudo conectar a la base de datos local en {API_BASE_URL}/colmenas</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-box"><h3>Sin resultados</h3><p>Intenta con otros filtros.</p></div>
            ) : (
              <div className="grid-colmenas">
                {filtered.map((colmena) => (
                  <div key={colmena.id} className="card-colmena">
                    <div className="card-head">
                      <h3 className="colmena-nombre">{colmena.nombre}</h3>
                      <span className="badge-apiario">📍 {colmena.apiario || "—"}</span>
                    </div>
                    <p className="colmena-desc">{colmena.descripcion_especifica || "Sin descripción"}</p>
                    <div className="card-foot">
                      <Link to={`/colmena/${colmena.id}`} className="pill">Ver detalle</Link>
                      <Link to={`/colmenas/editar/${colmena.id}`} className="pill edit">✏️ Editar</Link>
                      <button className="pill danger" onClick={() => handleDelete(colmena.id, colmena.nombre)} disabled={deletingId === colmena.id}>
                        {deletingId === colmena.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
