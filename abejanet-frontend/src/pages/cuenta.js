import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import "./Cuenta.css";

export default function Cuenta() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario"));
    
    if (userData?.correo_electronico) {
      // ✅ Ahora busca al usuario en el backend local por su correo
      fetch(`${API_BASE_URL}/usuarios/${userData.correo_electronico}`)
        .then((res) => res.json())
        .then((data) => {
          setUsuario(data);
          setFormData(data);
        })
        .catch(() => {
          // Si falla la API local, usamos lo que haya en localStorage como respaldo
          setUsuario(userData);
          setFormData(userData);
        });
    } else {
      setUsuario({ nombre: "Invitado", correo_electronico: "—" });
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

    // ✅ Petición PUT al servidor local
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
        // Actualizamos el storage para que el nombre cambie en toda la app
        localStorage.setItem("usuario", JSON.stringify(data));
        alert("Perfil actualizado correctamente");
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Error al guardar cambios en el servidor local");
      });
  };

  if (!usuario)
    return <div className="cuenta-loading">Cargando datos...</div>;

  const fechaCreacion = usuario.fecha_creacion
    ? new Date(usuario.fecha_creacion).toLocaleDateString()
    : "—";

  return (
    <div className="cuenta-root">
      <div className="cuenta-card">
        <div
          className="cuenta-back-icon"
          onClick={() => navigate("/dashboard")}
          title="Volver al inicio"
        >
          ←
        </div>

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
              disabled // Normalmente el correo no se edita para evitar conflictos de ID
            />

            <div className="cuenta-botones">
              <button onClick={guardarCambios} className="btn-guardar">
                Guardar
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
              {usuario.nombre} {usuario.apellido_paterno}{" "}
              {usuario.apellido_materno}
            </h2>
            <p className="cuenta-correo">{usuario.correo_electronico}</p>

            <div className="cuenta-info">
              <div>
                <strong>Rol</strong>
                <span>
                  {usuario.rol_id === 1 ? "Administrador" : "Usuario"}
                </span>
              </div>
              <div>
                <strong>Estado</strong>
                <span>
                  {usuario.esta_activo ? (
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

            <button
              onClick={() => setEditando(true)}
              className="cuenta-btn"
            >
              Editar perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
