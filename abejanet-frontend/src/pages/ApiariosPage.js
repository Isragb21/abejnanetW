import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar"; 
import API_BASE_URL from "../api"; 
import "./ApiariosPage.css"; // Solo necesitamos este CSS ahora

export default function Apiarios() {
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
    if (!window.confirm("¿Seguro que deseas eliminar este apiario? Las colmenas asociadas podrían verse afectadas.")) return;

    fetch(`${API_BASE_URL}/apiarios/${id}`, { method: "DELETE" })
      .then(() => cargarApiarios())
      .catch((err) => console.error("Error al eliminar apiario:", err));
  };

  return (
    <div className="apiarios-layout">
      
      {/* Nuestro menú lateral global */}
      <Sidebar />

      <main className="apiarios-main">
        <header className="apiarios-header">
          <div>
            <p className="apiarios-badge">Panel de control</p>
            <h1>Gestión de Apiarios</h1>
            <p className="apiarios-subtitle">Administra los apiarios, su ubicación y descripción general.</p>
          </div>
          <div className="apiarios-header-resumen">
            <span className="apiarios-resumen-pill">
              Total: <strong>{apiarios.length}</strong>
            </span>
          </div>
        </header>

        {/* Tabla principal de Apiarios */}
        <section className="apiarios-card">
          {loading ? (
            <div className="cuenta-loading">Cargando apiarios...</div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-apiarios">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {apiarios.length > 0 ? (
                    apiarios.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: "600" }}>{a.nombre}</td>
                        <td>{a.direccion_o_coordenadas || "N/A"}</td>
                        <td style={{ color: "#aaa" }}>{a.descripcion_general || "Sin descripción"}</td>
                        <td className="tabla-apiarios-actions">
                          <button className="editar" onClick={() => handleEdit(a)}>✏️</button>
                          <button className="eliminar" onClick={() => handleDelete(a.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="apiarios-empty">No hay apiarios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Botón de Agregar (Abajo de la tabla) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn-primario" onClick={handleOpenCreate}>
              ➕ Agregar Apiario
            </button>
          </div>
        </section>

        {/* ==========================================
            EL MODAL (Ventana Emergente)
            ========================================== */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editing ? "Editar Apiario" : "Nuevo Apiario"}</h2>
              
              <form className="form-apiario-modal" onSubmit={handleSubmit}>
                <label>Nombre del Apiario:</label>
                <input type="text" name="nombre" placeholder="Ej. Apiario Principal" value={formData.nombre} onChange={handleChange} required />

                <label>Dirección o Coordenadas:</label>
                <input type="text" name="direccion_o_coordenadas" placeholder="Ej. 19.4326° N, 99.1332° W" value={formData.direccion_o_coordenadas} onChange={handleChange} />

                <label>Descripción General:</label>
                <textarea name="descripcion_general" placeholder="Detalles sobre el entorno, clima, accesos, etc." value={formData.descripcion_general} onChange={handleChange} />

                <div className="modal-actions">
                  <button type="button" className="btn-secundario" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn-primario">{editing ? "Guardar Cambios" : "Crear Apiario"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
