import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api"; 
import Sidebar from "./Sidebar"; // 👈 Nuestro menú mágico
import { useLang } from "../i18n";
import "./Sensores.css";

export default function Sensores() {
  const { t } = useLang();

  const tEstado = (estado) => {
    const key = `sen.estado.${estado}`;
    const label = t(key);
    return label.startsWith("sen.estado.") ? estado.replace("_", " ") : label;
  };

  const [sensores, setSensores] = useState([]);
  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);

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

  // 1. Cargar sensores (Solo lo hace una vez o al guardar)
  const cargarSensores = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/sensores`)
      .then((res) => res.json())
      .then((data) => {
        setSensores(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error al cargar sensores:", err))
      .finally(() => setLoading(false));
  };

  const cargarColmenas = () => {
    fetch(`${API_BASE_URL}/colmenas`)
      .then((res) => res.json())
      .then((data) => setColmenas(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar colmenas:", err));
  };

  useEffect(() => {
    cargarColmenas();
    cargarSensores();
  }, []); 

  // 2. Lógica de Filtrado Local (Instantáneo)
  const sensoresFiltrados = sensores.filter((sensor) => {
    const cumpleColmena = filtroColmena ? String(sensor.colmena_id) === String(filtroColmena) : true;
    const cumpleMac = filtroMac ? (sensor.mac_address || "").toLowerCase().includes(filtroMac.toLowerCase()) : true;
    return cumpleColmena && cumpleMac;
  });

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({
      colmena_id: "",
      tipo_sensor: "",
      estado: "",
      fecha_instalacion: "",
      mac_address: "",
    });
  };

  const handleOpenCreate = () => {
    handleCloseModal(); 
    setShowModal(true);
  };

  const handleEdit = (sensor) => {
    setEditing(sensor.id);
    setFormData({
      colmena_id: sensor.colmena_id || "",
      tipo_sensor: sensor.tipo_sensor || "",
      estado: sensor.estado || "",
      fecha_instalacion: sensor.fecha_instalacion ? sensor.fecha_instalacion.split("T")[0] : "",
      mac_address: sensor.mac_address || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API_BASE_URL}/sensores/${editing}` : `${API_BASE_URL}/sensores`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(t("sen.errorOp"));
        return res.json();
      })
      .then(() => {
        cargarSensores();
        handleCloseModal(); 
      })
      .catch((err) => alert(err.message));
  };

  const handleDelete = (id) => {
    if (window.confirm(t("sen.confirmDelete"))) {
      fetch(`${API_BASE_URL}/sensores/${id}`, { method: "DELETE" })
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
      
      {/* 👇 AQUÍ LLAMAMOS A NUESTRO MENÚ */}
      <Sidebar />

      <main className="sensores-main">
        <header className="sensores-header">
          <div>
            <p className="sensores-badge">{t("col.badge")}</p>
            <h1>{t("sen.title")}</h1>
            <p className="sensores-subtitle">{t("sen.subtitle")}</p>
          </div>
          <div className="sensores-header-resumen">
            <span className="sensores-resumen-pill">{t("common.copyTotal")} <strong>{sensoresFiltrados.length}</strong></span>
          </div>
        </header>

        {/* Zona de Filtros */}
        <section className="sensores-card" style={{ paddingBottom: '16px' }}>
          <div className="form-sensor-filtros" style={{ marginBottom: 0 }}>
            <select name="filtro_colmena" value={filtroColmena} onChange={(e) => setFiltroColmena(e.target.value)}>
              <option value="">{t("sen.filterHive")}</option>
              {colmenas.map((col) => (
                <option key={col.id} value={col.id}>{col.nombre}</option>
              ))}
            </select>
            <input type="text" placeholder={t("sen.searchMac")} value={filtroMac} onChange={(e) => setFiltroMac(e.target.value)} />
            <button type="button" className="btn-secundario" onClick={limpiarFiltros}>{t("common.clean")}</button>
          </div>
        </section>

        {/* Tabla de Sensores */}
        <section className="sensores-card">
          {loading ? (
            <div className="cuenta-loading">{t("sen.loading")}</div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-sensores">
                <thead>
                  <tr>
                    <th>{t("sen.thHive")}</th>
                    <th>{t("sen.thType")}</th>
                    <th>{t("sen.thMac")}</th>
                    <th>{t("sen.thState")}</th>
                    <th>{t("sen.thInstall")}</th>
                    <th>{t("sen.thActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sensoresFiltrados.length > 0 ? (
                    sensoresFiltrados.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: "600" }}>{s.nombre_colmena || t("sen.unassigned")}</td>
                        <td>{s.tipo_sensor}</td>
                        <td>{s.mac_address || "N/A"}</td>
                        <td><span className={`estado-pill estado-${s.estado}`}>{tEstado(s.estado)}</span></td>
                        <td>{s.fecha_instalacion ? new Date(s.fecha_instalacion).toLocaleDateString() : "-"}</td>
                        <td className="tabla-sensores-actions">
                          <button className="editar" onClick={() => handleEdit(s)}>✏️</button>
                          <button className="eliminar" onClick={() => handleDelete(s.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="sensores-empty">{t("sen.empty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn-primario" onClick={handleOpenCreate}>
              {t("sen.add")}
            </button>
          </div>
        </section>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editing ? t("sen.editTitle") : t("sen.createTitle")}</h2>
              
              <form className="form-sensor-modal" onSubmit={handleSubmit}>
                <label>{t("sen.colmenaLabel")}</label>
                <select name="colmena_id" value={formData.colmena_id} onChange={handleChange} required>
                  <option value="">{t("sen.selectColmena")}</option>
                  {colmenas.map((col) => (
                    <option key={col.id} value={col.id}>{col.nombre}</option>
                  ))}
                </select>

                <label>{t("sen.typeLabel")}</label>
                <input type="text" name="tipo_sensor" placeholder={t("sen.typePh")} value={formData.tipo_sensor} onChange={handleChange} required />

                <label>{t("sen.stateLabel")}</label>
                <select name="estado" value={formData.estado} onChange={handleChange} required>
                  <option value="">{t("sen.selectState")}</option>
                  {estadosDisponibles.map((est) => (
                    <option key={est} value={est}>{(est.charAt(0).toUpperCase() + est.slice(1).replace("_", " "))}</option>
                  ))}
                </select>

                <label>{t("sen.macLabel")}</label>
                <input type="text" name="mac_address" placeholder={t("sen.macPh")} value={formData.mac_address} onChange={handleChange} />

                <label>{t("sen.installLabel")}</label>
                <input type="date" name="fecha_instalacion" value={formData.fecha_instalacion} onChange={handleChange} />

                <div className="modal-actions">
                  <button type="button" className="btn-secundario" onClick={handleCloseModal}>{t("common.cancel")}</button>
                  <button type="submit" className="btn-primario">{editing ? t("sen.save") : t("sen.create")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
