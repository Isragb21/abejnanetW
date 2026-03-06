import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import "./CreateColmenaPage.css"; 

export default function EditColmenaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
        throw new Error(
          `Error: El servidor en ${url} no respondió con JSON. Verifica que el backend local esté corriendo.`
        );
      }
      
      const data = JSON.parse(raw);
      if (!r.ok) throw new Error(data?.error || "Error en la respuesta del servidor");
      return data;
    };

    // ✅ Ahora usa la URL dinámica de localhost:4000
    Promise.all([
      fetchJsonSafe(`${API_BASE_URL}/apiarios`).catch(() => []),
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
        setErrorMsg(err.message || "Error al cargar datos");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setLoadingApiarios(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

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
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      setSaving(true);
      // ✅ Ahora usa la URL dinámica de localhost:4000
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
        throw new Error(data?.error || "No se pudo guardar");
      }

      setSuccessMsg("✅ Cambios guardados correctamente");
      setTimeout(() => navigate("/colmenas"), 1000);
    } catch (err) {
      setErrorMsg(err.message || "Error del servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-colmena-root">
        <div className="create-colmena-shell">
          <header className="create-colmena-header">
            <div>
              <h2>✏️ Editar colmena</h2>
              <p className="create-colmena-sub">Cargando información local…</p>
            </div>
            <Link to="/colmenas" className="crumb-link">← Volver</Link>
          </header>
          <div className="create-colmena-layout">
            <div className="create-colmena-form-card">
              <div className="alert"><p>Cargando datos desde la base de datos local…</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-colmena-root">
      <div className="create-colmena-shell">
        <header className="create-colmena-header">
          <div>
            <h2>✏️ Editar colmena #{id}</h2>
            <p className="create-colmena-sub">
              Actualiza el nombre, apiario o notas. Los datos históricos se conservan en PostgreSQL local.
            </p>
          </div>
          <Link to="/colmenas" className="crumb-link">← Volver a colmenas</Link>
        </header>

        <div className="create-colmena-layout">
          <form onSubmit={handleSubmit} className="create-colmena-form-card">
            <label className="form-field">
              <span>Apiario *</span>
              <select
                name="apiario_id"
                value={form.apiario_id}
                onChange={handleChange}
                required
                disabled={loadingApiarios}
              >
                <option value="">Selecciona un apiario…</option>
                {apiarios.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Nombre de la colmena *</span>
              <input
                type="text"
                name="nombre"
                placeholder="Ej. Colmena Norte 1"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Descripción (opcional)</span>
              <textarea
                name="descripcion_especifica"
                rows="4"
                placeholder="Detalles o notas de esta colmena..."
                value={form.descripcion_especifica}
                onChange={handleChange}
              />
            </label>

            {errorMsg && <div className="alert error"><p>{errorMsg}</p></div>}
            {successMsg && <div className="alert success"><p>{successMsg}</p></div>}

            <div className="form-actions" style={{ gap: 10 }}>
              <Link to="/colmenas" className="crumb-link" style={{ padding: "8px 12px" }}>Cancelar</Link>
              <button type="submit" disabled={saving || !isValid}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>

          <aside className="create-colmena-aside">
            <h3>🔁 Organización</h3>
            <p>Puedes mover esta colmena de apiario sin perder sus lecturas de sensores.</p>
            <div className="create-colmena-meta">
              <p>Los cambios se verán reflejados inmediatamente en el dashboard local.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
