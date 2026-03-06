import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Centralizamos la conexión local
import "./LoginPage.css";
import logo from "../assets/abeja_logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("abejanet_email");
    if (savedEmail) setCorreo(savedEmail);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Ahora apunta a http://localhost:4000/api/login
      const res = await axios.post(`${API_BASE_URL}/login`, {
        correo_electronico: correo,
        contrasena,
      });

      const { token, usuario } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      if (remember) {
        localStorage.setItem("abejanet_email", correo);
      } else {
        localStorage.removeItem("abejanet_email");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Error de login:", err);
      // Tip: Si el backend local usa texto plano para admin123, 
      // asegúrate de que no falle por encriptación.
      setError("Credenciales incorrectas o el servidor local no responde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-full" aria-label="Inicio de sesión AbejaNet">
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-shell">
        <div className="login-card">
          <div className="login-hero">
            <img src={logo} alt="Logo AbejaNet" className="login-logo" />
            <h1 className="login-title">AbejaNet<span> Dashboard</span></h1>
            <p className="login-subtitle">Monitoreo inteligente de colmenas en local.</p>
            <ul className="login-bullets">
              <li><i className="fas fa-wave-square" /> Tendencias de peso y ambiente.</li>
              <li><i className="fas fa-bell" /> Alertas tempranas activas.</li>
            </ul>
            <div className="login-meta">
              <span className="pill-meta"><i className="fas fa-shield-alt" /> Base de Datos PostgreSQL Local</span>
            </div>
          </div>

          <div className="login-panel">
            <header className="panel-head">
              <h2>Inicia sesión</h2>
              <p>Credenciales locales de AbejaNet</p>
            </header>

            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="field">
                <label htmlFor="correo" className="label">Correo electrónico</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope icon" aria-hidden="true" />
                  <input
                    id="correo"
                    type="email"
                    className="input"
                    placeholder="admin@abejanet.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contrasena" className="label">Contraseña</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock icon" aria-hidden="true" />
                  <input
                    id="contrasena"
                    type={showPass ? "text" : "password"}
                    className="input"
                    placeholder="admin123"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </div>

              <div className="row-between">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Recordarme</span>
                </label>
              </div>

              {error && <div className="alert" role="alert">{error}</div>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? <span className="spinner" /> : <i className="fas fa-sign-in-alt" />}
                <span className="btn-text">{loading ? "Entrando..." : "Entrar al panel"}</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
