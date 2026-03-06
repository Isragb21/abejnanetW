import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import "./CreateColmenaPage.css";

export default function CreateColmenaPage() {
  const [apiarios, setApiarios] = useState([]);
  const [form, setForm] = useState({
    apiario_id: "",
    nombre: "",
    descripcion_especifica: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  // Cargar apiarios al iniciar
  useEffect(() => {
    // ✅ Ahora usa la URL dinámica de localhost:4000
    fetch(`${API_BASE_URL}/apiarios`)
      .then((r) => r.json())
      .then((data) => setApiarios(data || []))
      .catch(() => setApiarios([]));
  }, []);

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
      setErrorMsg("Por favor llena todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      // ✅ Ahora usa la URL dinámica de localhost:4000
      const res = await fetch(`${API_BASE_URL}/colmenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear colmena");
      }

      setSuccessMsg("✅ Colmena creada correctamente");
      setTimeout(() => navigate("/colmenas"), 1200);
    } catch (err) {
      setErrorMsg(err.message || "Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-colmena-root">
      <div className="create-colmena-shell">
        <header className="create-colmena-header">
          <div>
            <h2>➕ Crear nueva colmena</h2>
            <p className="create-colmena-sub">
              Registra una colmena dentro de uno de tus apiarios para comenzar a monitorearla.
            </p>
          </div>
          <Link to="/colmenas" className="crumb-link">
            ← Volver a colmenas
          </Link>
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
              >
                <option value="">Selecciona un apiario…</option>
                {apiarios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
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
              <button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear colmena"}
              </button>
            </div>
          </form>

          <aside className="create-colmena-aside">
            <h3>🐝 Buenas prácticas</h3>
            <ul>
              <li>Usa nombres descriptivos (ej. "Lado Este - 01").</li>
              <li>Anota cambios de reina o tratamientos en la descripción.</li>
              <li>Verifica que el apiario sea el correcto para reportes precisos.</li>
            </ul>
            <div className="create-colmena-meta">
              <p>
                Los sensores vinculados a esta colmena enviarán datos en tiempo real al panel.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
