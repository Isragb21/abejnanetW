import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Importamos la URL centralizada
import "./Sensores.css";

export default function Sensores() {
  const navigate = useNavigate();
  const [sensores, setSensores] = useState([]);
  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Filtros
  const [filtroColmena, setFiltroColmena] = useState("");
  const [filtroMac, setFiltroMac] = useState("");

  const estadosDisponibles = ["activo", "inactivo", "mantenimiento", "no_asignado"];

  const [formData, setFormData] = useState({
    colmena_id: "",
    tipo_sensor: "",
    estado: "",
    fecha_instalacion: "",
    mac_address: "",
  });

  // Cargar sensores
  const cargarSensores = () => {
    const params = new URLSearchParams();
    if (filtroColmena) params.append("colmena", filtroColmena);
    if (filtroMac) params.append("mac", filtroMac);
    const queryString = params.toString();

    setLoading(true);
    // ✅ Ahora usa la URL dinámica de localhost:4000
    return fetch(`${API_BASE_URL}/sensores?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        setSensores(data);
      })
      .catch((err) => {
        console.error("Error al cargar sensores:", err);
      })
      .finally(() => setLoading(false));
  };

  // Cargar colmenas
  const cargarColmenas = () => {
    // ✅ Ahora usa la URL dinámica de localhost:4000
    return fetch(`${API_BASE_URL}/colmenas`)
      .then((res) => res.json())
      .then((data) => setColmenas(data))
      .catch((err) => {
        console.error("Error al cargar colmenas:", err);
      });
  };

  useEffect(() => {
    cargarColmenas();
  }, []);

  useEffect(() => {
    cargarSensores();
  }, [filtroColmena, filtroMac]);

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      colmena_id: "",
      tipo_sensor: "",
      estado: "",
      fecha_instalacion: "",
      mac_address: "",
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_BASE_URL}/sensores/${editing}`
      : `${API_BASE_URL}/sensores`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error ${res.status}: Operación fallida`
          );
        }
        return res.json();
      })
      .then(() => {
        cargarSensores();
        resetForm();
        alert(editing ? "Sensor actualizado" : "Sensor agregado");
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const handleEdit = (sensor) => {
    setEditing(sensor.id);
    setFormData({
      colmena_id: sensor.colmena_id || "",
      tipo_sensor: sensor.tipo_sensor || "",
      estado: sensor.estado || "",
      fecha_instalacion: sensor.fecha_instalacion
        ? sensor.fecha_instalacion.split("T")[0]
        : "",
      mac_address: sensor.mac_address || "",
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este sensor?")) {
      fetch(`${API_BASE_URL}/sensores/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => cargarSensores())
        .catch((err) => console.error("Error al eliminar sensor:", err));
    }
  };

  const limpiarFiltros = () => {
    setFiltroColmena("");
    setFiltroMac("");
  };

  return (
    <div className="sensores-layout">
      <aside className="sensores-sidebar">
        <div className="sensores-logo" onClick={() => navigate("/dashboard")}>
          <span className="sensores-logo-icon">🐝</span>
          <span className="sensores-logo-text">AbejaNet</span>
        </div>
        <nav className="sensores-nav">
          <button className="sensores-nav-item" onClick={() => navigate("/dashboard")}>🏠 Inicio</button>
          <button className="sensores-nav-item" onClick={() => navigate("/apiarios")}>🏷️ Apiarios</button>
          <button className="sensores-nav-item" onClick={() => navigate("/colmenas")}>🍯 Colmenas</button>
          <button className="sensores-nav-item sensores-nav-item-active" onClick={() => navigate("/sensores")}>📡 Sensores</button>
          <button className="sensores-nav-item" onClick={() => navigate("/usuarios")}>👥 Usuarios</button>
          <button className="sensores-nav-item" onClick={() => navigate("/cuenta")}>👤 Cuenta</button>
        </nav>
      </aside>

      <main className="sensores-main">
        <header className="sensores-header">
          <div>
            <p className="sensores-badge">Panel de control</p>
            <h1>Gestión de Sensores</h1>
            <p className="sensores-subtitle">Administra los dispositivos instalados en tus colmenas locales.</p>
          </div>
          <div className="sensores-header-resumen">
            <span className="sensores-resumen-pill">Total: <strong>{sensores.length}</strong></span>
          </div>
        </header>

        <section className="sensores-card">
          <div className="form-sensor-filtros">
            <select name="filtro_colmena" value={filtroColmena} onChange={(e) => setFiltroColmena(e.target.value)}>
              <option value="">-- Filtrar por Colmena --</option>
              {colmenas.map((col) => (
                <option key={col.id} value={col.id}>{col.nombre}</option>
              ))}
            </select>
            <input type="text" placeholder="MAC Address..." value={filtroMac} onChange={(e) => setFiltroMac(e.target.value)} />
            <button type="button" className="btn-secundario" onClick={limpiarFiltros}>Limpiar</button>
          </div>

          <form className="form-sensor" onSubmit={handleSubmit}>
            <select name="colmena_id" value={formData.colmena_id} onChange={handleChange} required>
              <option value="">-- Seleccionar Colmena --</option>
              {colmenas.map((col) => (
                <option key={col.id} value={col.id}>{col.nombre}</option>
              ))}
            </select>
            <input type="text" name="tipo_sensor" placeholder="Tipo (Peso, Temp, etc)" value={formData.tipo_sensor} onChange={handleChange} required />
            <select name="estado" value={formData.estado} onChange={handleChange} required>
              <option value="">-- Estado --</option>
              {estadosDisponibles.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
            <input type="text" name="mac_address" placeholder="MAC Address" value={formData.mac_address} onChange={handleChange} />
            <input type="date" name="fecha_instalacion" value={formData.fecha_instalacion} onChange={handleChange} />
            <div className="form-sensor-actions">
              <button type="submit" className="btn-primario">{editing ? "Actualizar" : "Agregar"}</button>
              {editing && <button type="button" className="btn-secundario" onClick={resetForm}>Cancelar</button>}
            </div>
          </form>
        </section>

        <section className="sensores-card">
          {loading ? (
            <div className="cuenta-loading">Cargando sensores...</div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-sensores">
                <thead>
                  <tr>
                    <th>Colmena</th>
                    <th>Tipo</th>
                    <th>MAC</th>
                    <th>Estado</th>
                    <th>Instalación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sensores.map((s) => (
                    <tr key={s.id}>
                      <td>{s.nombre_colmena || s.colmena_id}</td>
                      <td>{s.tipo_sensor}</td>
                      <td>{s.mac_address || "N/A"}</td>
                      <td><span className={`estado-pill estado-${s.estado}`}>{s.estado}</span></td>
                      <td>{s.fecha_instalacion ? new Date(s.fecha_instalacion).toLocaleDateString() : "-"}</td>
                      <td className="tabla-sensores-actions">
                        <button className="editar" onClick={() => handleEdit(s)}>✏️</button>
                        <button className="eliminar" onClick={() => handleDelete(s.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
