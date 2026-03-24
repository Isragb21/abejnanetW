import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar";
import "./Crud_usu.css"; 
import "./Sensores.css"; 

export default function Crud_usu() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [filtroCorreo, setFiltroCorreo] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo_electronico: "",
    contrasena: "",
    rol_id: "",
    esta_activo: "true"
  });

  // Ejecuta la petición GET para obtener la lista de usuarios y actualizar el estado
  const cargarUsuarios = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/usuarios`)
      .then((res) => res.json())
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar usuarios:", err))
      .finally(() => setLoading(false));
  };

  // Ejecuta la petición GET para obtener los roles disponibles para el select del formulario
  const cargarRoles = () => {
    fetch(`${API_BASE_URL}/roles`)
      .then((res) => res.json())
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar roles:", err));
  };

  useEffect(() => {
    cargarRoles();
    cargarUsuarios();
  }, []);

  // Filtra el array de usuarios en memoria basándose en el input de búsqueda
  const usuariosFiltrados = usuarios.filter((usu) => {
    return filtroCorreo 
      ? usu.correo_electronico.toLowerCase().includes(filtroCorreo.toLowerCase()) 
      : true;
  });

  // Actualiza dinámicamente el estado del formulario según el input modificado
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Restablece los valores por defecto al cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      correo_electronico: "",
      contrasena: "",
      rol_id: "",
      esta_activo: "true"
    });
  };

  const handleOpenCreate = () => {
    handleCloseModal();
    setShowModal(true);
  };

  // Determina el método HTTP (POST o PUT) y envía el payload a la base de datos
  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_BASE_URL}/usuarios/${editing}`
      : `${API_BASE_URL}/usuarios`;

    const payload = {
        ...formData,
        esta_activo: formData.esta_activo === "true"
    };

    if(editing && !payload.contrasena) {
        delete payload.contrasena;
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${res.status}: Operación fallida`);
        }
        return res.json();
      })
      .then(() => {
        cargarUsuarios();
        handleCloseModal();
      })
      .catch((err) => alert(err.message));
  };

  // Carga los datos de la fila seleccionada en el estado del formulario para su edición
  const handleEdit = (usuario) => {
    setEditing(usuario.id);
    setFormData({
      nombre: usuario.nombre || "",
      apellido_paterno: usuario.apellido_paterno || "",
      apellido_materno: usuario.apellido_materno || "",
      correo_electronico: usuario.correo_electronico || "",
      contrasena: "", 
      rol_id: usuario.rol_id || "",
      esta_activo: usuario.esta_activo ? "true" : "false"
    });
    setShowModal(true);
  };

  // Ejecuta la petición DELETE para remover el registro de la tabla
  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario? No podrá volver a iniciar sesión.")) {
      fetch(`${API_BASE_URL}/usuarios/${id}`, { method: "DELETE" })
        .then(() => cargarUsuarios())
        .catch((err) => console.error("Error al eliminar usuario:", err));
    }
  };

  // Ejecuta la petición PUT a la ruta específica para establecer el valor del secreto_2fa como NULL
  const handleReset2FA = (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas reiniciar el acceso 2FA de ${nombre}? En su próximo inicio de sesión se le pedirá configurar un nuevo dispositivo.`)) {
      fetch(`${API_BASE_URL}/usuarios/${id}/reset-2fa`, { method: "PUT" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Ocurrió un error al intentar reiniciar la autenticación de 2 pasos.");
          const data = await res.json();
          alert(data.message);
        })
        .catch((err) => alert(err.message));
    }
  };

  const limpiarFiltros = () => {
    setFiltroCorreo("");
  };

  return (
    <div className="sensores-layout">
      
      <Sidebar />

      <main className="sensores-main">
        <header className="sensores-header">
          <div>
            <p className="sensores-badge">Administración</p>
            <h1>Gestión de Usuarios</h1>
            <p className="sensores-subtitle">Administra el acceso y los roles de las personas en el sistema.</p>
          </div>
          <div className="sensores-header-resumen">
            <span className="sensores-resumen-pill">Total: <strong>{usuariosFiltrados.length}</strong></span>
          </div>
        </header>

        <section className="sensores-card" style={{ paddingBottom: '16px' }}>
          <div className="form-usuario-filtros" style={{ marginBottom: 0 }}>
            <input 
              type="text" 
              placeholder="Buscar por correo electrónico..." 
              value={filtroCorreo} 
              onChange={(e) => setFiltroCorreo(e.target.value)} 
            />
            <button type="button" className="btn-secundario" onClick={limpiarFiltros}>Limpiar</button>
          </div>
        </section>

        <section className="sensores-card">
          {loading ? (
            <div className="cuenta-loading">Cargando usuarios...</div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-usuarios">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((usu) => (
                      <tr key={usu.id}>
                        <td style={{ fontWeight: '600' }}>{usu.nombre} {usu.apellido_paterno}</td>
                        <td style={{ color: '#ccc' }}>{usu.correo_electronico}</td>
                        <td>
                          <span className={`rol-pill rol-${usu.rol_id}`}>
                            {roles.find(r => r.id === usu.rol_id)?.nombre || usu.rol_id}
                          </span>
                        </td>
                        <td>
                          <span className={`estado-pill ${usu.esta_activo ? "estado-activo" : "estado-inactivo"}`}>
                            {usu.esta_activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="tabla-usuarios-actions">
                          <button className="editar" onClick={() => handleEdit(usu)} title="Editar Usuario">✏️</button>
                          <button className="eliminar" onClick={() => handleDelete(usu.id)} title="Eliminar Usuario">🗑️</button>
                          <button 
                            className="btn-secundario" 
                            style={{ padding: '4px 8px', marginLeft: '5px', fontSize: '0.9rem' }} 
                            onClick={() => handleReset2FA(usu.id, usu.nombre)}
                            title="Reiniciar QR de Autenticación"
                          >
                            🔄 2FA
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="usuarios-empty">No hay usuarios registrados con ese correo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn-primario" onClick={handleOpenCreate}>
              ➕ Nuevo Usuario
            </button>
          </div>
        </section>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editing ? "Editar Usuario" : "Crear Nuevo Usuario"}</h2>
              
              <form className="form-usuario-modal" onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Nombre:</label>
                    <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Apellidos:</label>
                    <input type="text" name="apellido_paterno" placeholder="Paterno" value={formData.apellido_paterno} onChange={handleChange} />
                  </div>
                </div>

                <label>Correo Electrónico:</label>
                <input type="email" name="correo_electronico" placeholder="usuario@abejanet.com" value={formData.correo_electronico} onChange={handleChange} required />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Rol en el sistema:</label>
                    <select name="rol_id" value={formData.rol_id} onChange={handleChange} required >
                      <option value="">-- Seleccionar --</option>
                      {roles.map((rol) => (
                        <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Estado de la cuenta:</label>
                    <select name="esta_activo" value={formData.esta_activo} onChange={handleChange} required >
                       <option value="true">Activo (Permitir acceso)</option>
                       <option value="false">Inactivo (Bloquear acceso)</option>
                    </select>
                  </div>
                </div>

                <label>{editing ? "Cambiar Contraseña (Dejar vacío si no cambia)" : "Contraseña Temporal"}</label>
                <input type="password" name="contrasena" placeholder="******" value={formData.contrasena} onChange={handleChange} required={!editing} />

                <div className="modal-actions">
                  <button type="button" className="btn-secundario" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn-primario">{editing ? "Guardar Cambios" : "Crear Usuario"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
