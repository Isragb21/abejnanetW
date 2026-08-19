import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import API_BASE_URL from "../api"; 
import Sidebar from "./Sidebar"; // 👈 Importamos nuestro menú mágico
import { useLang } from "../i18n";
import "./Sensores.css"; // 👈 Para heredar el layout oscuro
import "./ColmenasPage.css"; // Solo para estilos específicos de las tarjetas

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
  const { t } = useLang();

  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [errorDelete, setErrorDelete] = useState("");

  // Controles
  const [q, setQ] = useState("");
  const [apiario, setApiario] = useState("todos");
  const [sort, setSort] = useState("nombre_asc");

  useEffect(() => {
    const cargarColmenas = async () => {
      try {
        setLoading(true);
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
    colmenas.forEach((c) => c.nombre_apiario && set.add(c.nombre_apiario));
    return ["todos", ...Array.from(set)];
  }, [colmenas]);

  const filtered = useMemo(() => {
    let rows = [...colmenas];

    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter((c) => {
        const n = (c.nombre || "").toLowerCase();
        const d = (c.descripcion_especifica || "").toLowerCase();
        const a = (c.nombre_apiario || "").toLowerCase();
        return n.includes(needle) || d.includes(needle) || a.includes(needle);
      });
    }

    if (apiario !== "todos") {
      rows = rows.filter((c) => (c.nombre_apiario || "") === apiario);
    }

    const compareStr = (a, b) =>
      (a || "").toString().localeCompare((b || "").toString(), "es", { sensitivity: "base" });

    switch (sort) {
      case "nombre_asc": rows.sort((a, b) => compareStr(a.nombre, b.nombre)); break;
      case "nombre_desc": rows.sort((a, b) => compareStr(b.nombre, a.nombre)); break;
      case "apiario_asc": rows.sort((a, b) => compareStr(a.nombre_apiario, b.nombre_apiario)); break;
      case "apiario_desc": rows.sort((a, b) => compareStr(b.nombre_apiario, a.nombre_apiario)); break;
      default: break;
    }

    return rows;
  }, [colmenas, q, apiario, sort]);

  /* Eliminar colmena */
  const handleDelete = async (id, nombre) => {
    setErrorDelete("");
    const ok = window.confirm(t("col.confirmDelete", { name: nombre }));
    if (!ok) return;

    const prev = colmenas;
    setDeletingId(id);
    setColmenas((xs) => xs.filter((c) => c.id !== id));

    try {
      const res = await axios.delete(`${API_BASE_URL}/colmenas/${id}`);
      if (res.status !== 200) throw new Error(t("col.deleteFail"));
    } catch (e) {
      setColmenas(prev);
      setErrorDelete(e?.response?.data?.error || e.message || t("col.deleteFail"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="sensores-layout">
      
      {/* 👈 Nuestro menú global insertado aquí */}
      <Sidebar />

      <main className="sensores-main">
        <div className="colmenas-container">
          <header className="sensores-header">
            <div>
              <p className="sensores-badge">{t("col.badge")}</p>
              <h1>{t("col.title")}</h1>
              <p className="sensores-subtitle">{t("col.subtitle")}</p>
            </div>
            <div className="colmenas-header-stats">
              <StatChip label={t("col.statTotal")} value={colmenas.length} />
              <StatChip label={t("col.statShowing")} value={filtered.length} />
              <StatChip label={t("col.statApiarios")} value={apiarios.filter((a) => a !== "todos").length} />
            </div>
          </header>

          <section className="sensores-card">
            <div className="colmenas-card-head-row">
              <div className="toolbar">
                <div className="input-wrap">
                  <input className="input" type="text" placeholder={t("col.search")} value={q} onChange={(e) => setQ(e.target.value)} />
                  <span className="kbd">/</span>
                </div>
                <div className="selects">
                  <label className="select">
                    <span>{t("col.apiario")}</span>
                    <select value={apiario} onChange={(e) => setApiario(e.target.value)}>
                      {apiarios.map((a) => (<option key={a} value={a}>{a === "todos" ? t("col.all") : a}</option>))}
                    </select>
                  </label>
                  <label className="select">
                    <span>{t("col.order")}</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="nombre_asc">{t("col.nameAsc")}</option>
                      <option value="nombre_desc">{t("col.nameDesc")}</option>
                    </select>
                  </label>
                </div>
              </div>
              <Link to="/colmenas/crear" className="btn-primario">{t("col.create")}</Link>
            </div>
          </section>

          <section className="colmenas-card-lista">
            {errorDelete && (
              <div className="empty-box error" style={{ marginBottom: 12 }}>
                <h3>{t("col.error")}</h3><p>{errorDelete}</p>
              </div>
            )}

            {loading ? (
              <div className="grid-colmenas">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : fail ? (
              <div className="empty-box error">
                <h3>{t("col.connErrorTitle")}</h3>
                <p>{t("col.connErrorText", { url: `${API_BASE_URL}/colmenas` })}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-box"><h3>{t("col.emptyTitle")}</h3><p>{t("col.emptyText")}</p></div>
            ) : (
              <div className="grid-colmenas">
                {filtered.map((colmena) => (
                  <div key={colmena.id} className="card-colmena">
                    <div className="card-head">
                      <h3 className="colmena-nombre">{colmena.nombre}</h3>
                      <span className="badge-apiario">📍 {colmena.nombre_apiario || "—"}</span>
                    </div>
                    <p className="colmena-desc">{colmena.descripcion_especifica || t("col.noDescription")}</p>
                    <div className="card-foot">
                      <Link to={`/colmena/${colmena.id}`} className="pill">{t("col.viewDetail")}</Link>
                      <Link to={`/colmenas/editar/${colmena.id}`} className="pill edit">{t("col.edit")}</Link>
                      <button className="pill danger" onClick={() => handleDelete(colmena.id, colmena.nombre)} disabled={deletingId === colmena.id}>
                        {deletingId === colmena.id ? "..." : t("col.delete")}
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
