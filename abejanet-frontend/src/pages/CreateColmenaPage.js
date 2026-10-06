import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar";
import { useLang } from "../i18n";
import { getPageErrorMessage } from "../utils/pageErrors";
import "./CreateColmenaPage.css";
import "./Sensores.css";

export default function CreateColmenaPage() {
  const { t } = useLang();
  const [apiarios, setApiarios] = useState([]);
  const [form, setForm] = useState({
    apiario_id: "",
    nombre: "",
    descripcion_especifica: "",
  });
  const [loading, setLoading] = useState(false);
  const [apiariosLoaded, setApiariosLoaded] = useState(false);
  const [loadingApiariosError, setLoadingApiariosError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const cargarApiarios = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/apiarios`);
        if (!response.ok) {
          const error = new Error("No se pudieron cargar los apiarios.");
          error.status = response.status;
          throw error;
        }
        const data = await response.json();
        setApiarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar apiarios:", error);
        setLoadingApiariosError(getPageErrorMessage(error, t));
      } finally {
        setApiariosLoaded(true);
      }
    };

    cargarApiarios();
  }, [t]);

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.apiario_id || !form.nombre.trim()) {
      setErrorMsg(t("cre.errRequired"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/colmenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.error || "No se pudo crear la colmena.");
        error.status = res.status;
        throw error;
      }

      setSuccessMsg(t("cre.ok"));
      setTimeout(() => navigate("/colmenas"), 1200);
    } catch (err) {
      setErrorMsg(getPageErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sensores-layout">
      <Sidebar />
      <main className="sensores-main">
        <div className="create-colmena-root">
          <div className="create-colmena-shell">
            <header className="create-colmena-header">
              <div>
                <h2>➕ {t("cre.createTitle")}</h2>
                <p className="create-colmena-sub">
                  {t("cre.sub")}
                </p>
              </div>
              <Link to="/colmenas" className="crumb-link">
                ← {t("cre.back")}
              </Link>
            </header>

            <div className="create-colmena-layout">
              <form onSubmit={handleSubmit} className="create-colmena-form-card">
                {loadingApiariosError && (
                  <div className="alert error" role="alert">
                    <p>{loadingApiariosError}</p>
                  </div>
                )}
                {apiariosLoaded && !loadingApiariosError && apiarios.length === 0 && (
                  <div className="alert error" role="status">
                    <p>{t("cre.noApiarios")}</p>
                  </div>
                )}
                <label className="form-field">
                  <span>{t("cre.apiario")} *</span>
                  <select
                    name="apiario_id"
                    value={form.apiario_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t("cre.selectApiario")}</option>
                    {apiarios.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>{t("cre.name")} *</span>
                  <input
                    type="text"
                    name="nombre"
                    placeholder={t("cre.namePh")}
                    value={form.nombre}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>{t("cre.desc")}</span>
                  <textarea
                    name="descripcion_especifica"
                    rows="4"
                    placeholder={t("cre.descPh")}
                    value={form.descripcion_especifica}
                    onChange={handleChange}
                  />
                </label>

                {errorMsg && (
                  <div className="alert error">
                    <p>{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="alert success">
                    <p>{successMsg}</p>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" disabled={loading || Boolean(loadingApiariosError) || apiarios.length === 0}>
                    {loading ? `${t("common.creating")}...` : t("cre.create")}
                  </button>
                </div>
              </form>

              <aside className="create-colmena-aside">
                <h3>🐝 {t("cre.tips")}</h3>
                <ul>
                  <li>{t("cre.tip1")}</li>
                  <li>{t("cre.tip2")}</li>
                  <li>{t("cre.tip3")}</li>
                </ul>
                <div className="create-colmena-meta">
                  <p>
                    {t("cre.meta")}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
