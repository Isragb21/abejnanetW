import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import API_BASE_URL from "../api";
import { useLang } from "../i18n";
import "./ApiariosPage.css";

export default function Apiarios() {
  const { t } = useLang();
  const [apiarios, setApiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Estado para controlar la ventana emergente (Modal)
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    direccion_o_coordenadas: "",
    descripcion_general: "",
  });

  /* ============================
         CARGAR APIARIOS
  ============================ */
  const cargarApiarios = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/apiarios`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApiarios(data);
      })
      .catch((err) => console.error("Error al cargar apiarios:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarApiarios();
  }, []);

  /* ============================
         FORMULARIO HANDLERS
  ============================ */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({
      nombre: "",
      direccion_o_coordenadas: "",
      descripcion_general: "",
    });
  };

  const handleOpenCreate = () => {
    handleCloseModal();
    setShowModal(true);
  };

  const handleEdit = (a) => {
    setEditing(a.id);
    setFormData({
      nombre: a.nombre || "",
      direccion_o_coordenadas: a.direccion_o_coordenadas || "",
      descripcion_general: a.descripcion_general || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_BASE_URL}/apiarios/${editing}`
      : `${API_BASE_URL}/apiarios`;

    const payload = { ...formData };
    if (!editing) {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      payload.creado_por_usuario_id = usuario.id || null;
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al guardar el apiario.");
        }
        return res.json();
      })
      .then(() => {
        cargarApiarios();
        handleCloseModal(); // Cerramos el modal al guardar
      })
      .catch((err) => alert(err.message));
  };

  const handleDelete = (id) => {
    if (!window.confirm(t("apiarios.confirmDelete"))) return;

    fetch(`${API_BASE_URL}/apiarios/${id}`, { method: "DELETE" })
      .then(() => cargarApiarios())
      .catch((err) => console.error("Error:", err));
  };

  return (
    <div className="apiarios-layout">
      
      {/* Nuestro menú lateral global */}
      <Sidebar />

      <main className="apiarios-main">
        <header className="apiarios-header">
          <div>
            <p className="apiarios-badge">{t("api.badge")}</p>
            <h1>{t("api.title")}</h1>
            <p className="apiarios-subtitle">{t("api.subtitle")}</p>
          </div>
          <div className="apiarios-header-resumen">
            <span className="apiarios-resumen-pill">
              {t("common.copyTotal")} <strong>{apiarios.length}</strong>
            </span>
          </div>
        </header>

        <section className="apiarios-card">
          {loading ? (
            <div className="cuenta-loading">{t("api.loading")}</div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-apiarios">
                <thead>
                  <tr>
                    <th>{t("api.thName")}</th>
                    <th>{t("api.thLocation")}</th>
                    <th>{t("api.thDesc")}</th>
                    <th>{t("api.thActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {apiarios.length > 0 ? (
                    apiarios.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: "600" }}>{a.nombre}</td>
                        <td>{a.direccion_o_coordenadas || "—"}</td>
                        <td style={{ color: "#aaa" }}>{a.descripcion_general || t("api.noDesc")}</td>
                        <td className="tabla-apiarios-actions">
                          <button className="editar" onClick={() => handleEdit(a)}>✏️</button>
                          <button className="eliminar" onClick={() => handleDelete(a.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="apiarios-empty">{t("api.empty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn-primario" onClick={handleOpenCreate}>
              ➕ {t("api.add")}
            </button>
          </div>
        </section>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editing ? t("api.editTitle") : t("api.createTitle")}</h2>

              <form className="form-apiario-modal" onSubmit={handleSubmit}>
                <label>{t("api.nameLabel")}</label>
                <input type="text" name="nombre" placeholder={t("api.namePh")} value={formData.nombre} onChange={handleChange} required />

                <label>{t("api.coordLabel")}</label>
                <input type="text" name="direccion_o_coordenadas" placeholder={t("api.coordPh")} value={formData.direccion_o_coordenadas} onChange={handleChange} />

                <label>{t("api.descLabel")}</label>
                <textarea name="descripcion_general" placeholder={t("api.descPh")} value={formData.descripcion_general} onChange={handleChange} />

                <div className="modal-actions">
                  <button type="button" className="btn-secundario" onClick={handleCloseModal}>{t("common.cancel")}</button>
                  <button type="submit" className="btn-primario">{editing ? t("api.save") : t("api.create")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
