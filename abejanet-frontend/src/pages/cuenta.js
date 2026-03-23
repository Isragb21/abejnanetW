import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
import Sidebar from "./Sidebar"; 
import "./Sensores.css"; 
import "./Cuenta.css"; 

export default function Cuenta() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario") || "{}");
    
    // 🐛 CORRECCIÓN: El login guarda "correo", pero el backend usa "correo_electronico".
    // Buscamos ambos para asegurar que nunca falle.
    const correoBuscado = userData.correo || userData.correo_electronico;
    
    if (correoBuscado) {
      fetch(`${API_BASE_URL}/usuarios/${correoBuscado}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se encontró el usuario en la BD");
          return res.json();
        })
        .then((data) => {
          // Si el backend devuelve un error en JSON (ej. ID no encontrado)
          if (data.error) throw new Error(data.error);
          
          setUsuario(data);
          setFormData(data);
        })
        .catch((err) => {
          console.warn("Usando datos locales:", err.message);
          // Si falla la conexión, usamos el caché pero evitamos que diga "Inactivo" por error
          setUsuario({ ...userData, correo_electronico: correoBuscado, esta_activo: true });
          setFormData({ ...userData, correo_electronico: correoBuscado });
        });
    } else {
      setUsuario({ nombre: "Invitado", correo_electronico: "—", esta_activo: true });
      setFormData({ nombre: "Invitado", correo_electronico: "—" });
    }
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const guardarCambios = () => {
    if (!usuario?.id) {
      alert("No se puede actualizar: falta el ID del usuario.");
      return;
    }

    fetch(`${API_BASE_URL}/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al actualizar");
        return res.json();
      })
      .then((data) => {
        setUsuario(data);
        setEditando(false);
        // Actualizamos el storage para que el nombre cambie en toda la app (asegurando el correo)
        localStorage.setItem("usuario", JSON.stringify({
          ...data,
          correo: data.correo_electronico
        }));
        alert("Perfil actualizado correctamente");
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Error al guardar cambios en el servidor local");
      });
  };

  if (!usuario) {
    return (
      <div className="sensores-layout">
        <Sidebar />
        <main className="sensores-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="cuenta-loading">Cargando datos de la base de datos...</div>
        </main>
      </div>
    );
  }

  const fechaCreacion = usuario.fecha_creacion
    ? new Date(usuario.fecha_creacion).toLocaleDateString()
    : "—";

  return (
    <div className="sensores-layout">
      
      <Sidebar />

      <main className="sensores-main" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        
        <div className="cuenta-card">
          <div className="cuenta-avatar">
            {usuario.nombre?.charAt(0).toUpperCase() || "U"}
          </div>

          {editando ? (
            <div className="cuenta-form">
              <input
                name="nombre"
                placeholder="Nombre"
                value={formData.nombre || ""}
                onChange={handleChange}
              />
              <input
                name="apellido_paterno"
                placeholder="Apellido paterno"
                value={formData.apellido_paterno || ""}
                onChange={handleChange}
              />
              <input
                name="apellido_materno"
                placeholder="Apellido materno"
                value={formData.apellido_materno || ""}
                onChange={handleChange}
              />
              <input
                name="correo_electronico"
                placeholder="Correo electrónico"
                value={formData.correo_electronico || ""}
                onChange={handleChange}
                disabled
              />

              <div className="cuenta-botones">
                <button onClick={guardarCambios} className="btn-guardar">
                  Guardar Cambios
                </button>
                <button
                  onClick={() => {
                    setEditando(false);
                    setFormData(usuario);
                  }}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="cuenta-nombre">
                {usuario.nombre} {usuario.apellido_paterno} {usuario.apellido_materno}
              </h2>
              <p className="cuenta-correo">{usuario.correo_electronico}</p>

              <div className="cuenta-info">
                <div>
                  <strong>Rol en el sistema</strong>
                  <span>
                    {usuario.rol_id === 1 ? "Administrador" : "Usuario"}
                  </span>
                </div>
                <div>
                  <strong>Estado de cuenta</strong>
                  <span>
                    {/* Hacemos la validación estricta para que NO ponga Inactivo si solo falta cargar */}
                    {usuario.esta_activo !== false ? (
                      <span className="estado-activo">Activo</span>
                    ) : (
                      <span className="estado-inactivo">Inactivo</span>
                    )}
                  </span>
                </div>
                <div>
                  <strong>Registrado el</strong>
                  <span>{fechaCreacion}</span>
                </div>
              </div>

              <button onClick={() => setEditando(true)} className="cuenta-btn">
                Editar perfil
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
