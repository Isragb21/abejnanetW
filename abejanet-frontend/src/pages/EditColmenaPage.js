import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar";
import { useLang } from "../i18n";
import { getPageErrorMessage } from "../utils/pageErrors";
import "./CreateColmenaPage.css";
import "./Sensores.css";

export default function EditColmenaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  // catálogo de apiarios
  const [apiarios, setApiarios] = useState([]);
  const [loadingApiarios, setLoadingApiarios] = useState(true);

  // formulario
  const [form, setForm] = useState({
    apiario_id: "",
    nombre: "",
    descripcion_especifica: "",
  });

  // estados UI
  const [loading, setLoading] = useState(true);   // cargando colmena
  const [saving, setSaving] = useState(false);    // guardando cambios
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Carga inicial (apiarios + colmena)
  useEffect(() => {
    let alive = true;

    const fetchJsonSafe = async (url) => {
      const r = await fetch(url);
      const ct = r.headers.get("content-type") || "";
      const raw = await r.text();
      
      if (!ct.includes("application/json")) {
        throw new Error("La página recibió una respuesta inesperada.");
      }
      
      const data = JSON.parse(raw);
      if (!r.ok) {
        const error = new Error(data?.error || "No se pudieron cargar los datos.");
        error.status = r.status;
        throw error;
      }
      return data;
    };

    Promise.all([
      fetchJsonSafe(`${API_BASE_URL}/apiarios`),
      fetchJsonSafe(`${API_BASE_URL}/colmenas/${id}`),
    ])
      .then(([apiariosResp, colmena]) => {
        if (!alive) return;
        setApiarios(apiariosResp || []);
        setForm({
          apiario_id: colmena.apiario_id ?? "",
          nombre: colmena.nombre ?? "",
          descripcion_especifica: colmena.descripcion_especifica ?? "",
        });
      })
      .catch((err) => {
        if (!alive) return;
        setErrorMsg(getPageErrorMessage(err, t, "cre.errLoad"));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setLoadingApiarios(false);
      });

    return () => {
      alive = false;
    };
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const isValid = useMemo(() => {
    return (
      String(form.apiario_id).trim() !== "" &&
      String(form.nombre).trim().length > 0
    );
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValid) {
      setErrorMsg(t("cre.errRequiredEdit"));
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/colmenas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiario_id: form.apiario_id,
          nombre: form.nombre,
          descripcion_especifica: form.descripcion_especifica,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data = ct.includes("application/json")
        ? JSON.parse(raw)
        : { error: raw };

      if (!res.ok) {
        const error = new Error(data?.error || "No se pudo guardar.");
        error.status = res.status;
        throw error;
      }

      setSuccessMsg(t("cre.saved"));
      setTimeout(() => navigate("/colmenas"), 1000);
    } catch (err) {
      setErrorMsg(getPageErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sensores-layout">
        <Sidebar />
        <main className="sensores-main">
          <div className="create-colmena-root">
            <div className="create-colmena-shell">
              <header className="create-colmena-header">
                <div>
                  <h2>✏️ {t("cre.editTitle")}</h2>
                  <p className="create-colmena-sub">{t("cre.editLoading")}</p>
                </div>
                <Link to="/colmenas" className="crumb-link">← {t("common.back")}</Link>
              </header>
              <div className="create-colmena-layout">
                <div className="create-colmena-form-card">
                  <div className="alert"><p>{t("cre.editLoadingBox")}</p></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sensores-layout">
      <Sidebar />
      <main className="sensores-main">
        <div className="create-colmena-root">
          <div className="create-colmena-shell">
            <header className="create-colmena-header">
              <div>
                <h2>✏️ {t("cre.editTitle")} #{id}</h2>
                <p className="create-colmena-sub">
                  {t("cre.editSub")}
                </p>
              </div>
              <Link to="/colmenas" className="crumb-link">← {t("det.backColmenas")}</Link>
            </header>

            <div className="create-colmena-layout">
              <form onSubmit={handleSubmit} className="create-colmena-form-card">
                <label className="form-field">
                  <span>{t("det.chipApiario")} *</span>
                  <select
                    name="apiario_id"
                    value={form.apiario_id}
                    onChange={handleChange}
                    required
                    disabled={loadingApiarios}
                  >
                    <option value="">{t("cre.selectApiario")}</option>
                    {apiarios.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
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

                {errorMsg && <div className="alert error"><p>{errorMsg}</p></div>}
                {successMsg && <div className="alert success"><p>{successMsg}</p></div>}

                <div className="form-actions" style={{ gap: 10 }}>
                  <Link to="/colmenas" className="crumb-link" style={{ padding: "8px 12px" }}>{t("common.cancel")}</Link>
                  <button type="submit" disabled={saving || !isValid}>
                    {saving ? `${t("cre.saving")}...` : t("cre.save")}
                  </button>
                </div>
              </form>

              <aside className="create-colmena-aside">
                <h3>🔁 {t("cre.orgTitle")}</h3>
                <p>{t("cre.orgText")}</p>
                <div className="create-colmena-meta">
                  <p>{t("cre.orgMeta")}</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
