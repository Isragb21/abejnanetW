import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Centralizamos la conexión local
import "./LoginPage.css";
import logo from "../assets/abeja_logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function LoginPage() {
  // Estados normales del login
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // 🛡️ Nuevos Estados para el 2FA
  const [step, setStep] = useState(1); // 1 = Login normal, 2 = Pantalla de 6 dígitos
  const [token2FA, setToken2FA] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [tempSecret, setTempSecret] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("abejanet_email");
    if (savedEmail) setCorreo(savedEmail);
  }, []);

  // ===============================================
  // PASO 1: VERIFICAR CONTRASEÑA
  // ===============================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        correo_electronico: correo,
        contrasena,
      });

      // Si la contraseña es correcta, el servidor nos dirá si requiere 2FA
      if (res.data.requireSetup2FA || res.data.require2FA) {
        setQrCode(res.data.qrCode || null);
        setTempSecret(res.data.tempSecret || null);
        setStep(2); // Pasamos a la pantalla del código
      }

    } catch (err) {
      console.error("Error de login:", err);
      const mensajeError = err.response?.data?.error || "Credenciales incorrectas o el servidor no responde.";
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // PASO 2: VERIFICAR CÓDIGO DE 6 DÍGITOS
  // ===============================================
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/verify-2fa`, {
        correo_electronico: correo,
        token_2fa: token2FA,
        tempSecret: tempSecret // Solo se envía la primera vez
      });

      const { token, usuario } = res.data;

      // 🛑 CANDADO 1: ¿El usuario está inactivo?
      if ('esta_activo' in usuario && (usuario.esta_activo === false || String(usuario.esta_activo) === "false")) {
        setError("Tu cuenta ha sido desactivada. Contacta al administrador.");
        setStep(1); // Lo regresamos al principio
        return; 
      }

      // 🛑 CANDADO 2: ¿El usuario no es administrador?
      if ('rol_id' in usuario && usuario.rol_id != 1) {
        setError("Acceso denegado. Solo los administradores pueden entrar al panel.");
        setStep(1);
        return; 
      }

      // ✅ SI PASA LOS CANDADOS Y EL 2FA: Lo dejamos entrar
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      if (remember) {
        localStorage.setItem("abejanet_email", correo);
      } else {
        localStorage.removeItem("abejanet_email");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Error 2FA:", err);
      const mensajeError = err.response?.data?.error || "Código incorrecto o expirado.";
      setError(mensajeError);
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
              <li><i className="fas fa-lock" /> Autenticación de 2 Factores.</li>
            </ul>
            <div className="login-meta">
              <span className="pill-meta"><i className="fas fa-shield-alt" /> Base de Datos PostgreSQL Local</span>
            </div>
          </div>

          <div className="login-panel">
            <header className="panel-head">
              <h2>{step === 1 ? "Inicia sesión" : "Verificación en 2 Pasos"}</h2>
              <p>{step === 1 ? "Credenciales locales de AbejaNet" : "Protege tu cuenta con Google Authenticator"}</p>
            </header>

            {/* ======================= FORMULARIO PASO 1 (LOGIN) ======================= */}
            {step === 1 && (
              <form onSubmit={handleLoginSubmit} className="form" noValidate>
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
                      placeholder="******"
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
                  <span className="btn-text">{loading ? "Validando..." : "Siguiente"}</span>
                </button>
              </form>
            )}

            {/* ======================= FORMULARIO PASO 2 (2FA) ======================= */}
            {step === 2 && (
              <form onSubmit={handleVerify2FA} className="form" noValidate>
                
                {/* Si mandamos un QR, significa que es la primera vez configurándolo */}
                {qrCode && (
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <p style={{ fontSize: "0.9rem", color: "#ddd", marginBottom: "10px" }}>
                      1. Escanea este código con tu aplicación autenticadora (ej. Google Authenticator).
                    </p>
                    <img src={qrCode} alt="Código QR 2FA" style={{ borderRadius: "10px", border: "2px solid #ffe600", width: "150px" }} />
                    <p style={{ fontSize: "0.85rem", color: "#ffe600", marginTop: "10px" }}>
                      2. Ingresa el código de 6 dígitos abajo.
                    </p>
                  </div>
                )}

                {!qrCode && (
                  <p style={{ fontSize: "0.95rem", color: "#ddd", marginBottom: "20px", textAlign: "center" }}>
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                  </p>
                )}

                <div className="field">
                  <label htmlFor="token2FA" className="label">Código de Seguridad</label>
                  <div className="input-wrapper">
                    <i className="fas fa-key icon" aria-hidden="true" />
                    <input
                      id="token2FA"
                      type="text"
                      maxLength="6"
                      className="input"
                      style={{ letterSpacing: "5px", fontSize: "1.2rem", textAlign: "center", fontWeight: "bold" }}
                      placeholder="123456"
                      value={token2FA}
                      onChange={(e) => setToken2FA(e.target.value.replace(/\D/g, ''))} // Solo permite números
                      required
                    />
                  </div>
                </div>

                {error && <div className="alert" role="alert">{error}</div>}

                <button type="submit" className="btn" disabled={loading} style={{ marginBottom: "10px" }}>
                  {loading ? <span className="spinner" /> : <i className="fas fa-check-circle" />}
                  <span className="btn-text">{loading ? "Verificando..." : "Entrar al panel"}</span>
                </button>

                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: "transparent", border: "1px solid #444", color: "#ddd" }}
                  onClick={() => { setStep(1); setError(""); setToken2FA(""); }}
                >
                  <i className="fas fa-arrow-left" />
                  <span className="btn-text">Volver</span>
                </button>
              </form>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
