import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api"; // 👈 Centralizamos la conexión local
import { useLang } from "../i18n";
import { useTheme } from "../ThemeContext";
import "./LoginPage.css";
import "../controls.css";
import logo from "../assets/abeja_logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const REQUEST_TIMEOUT_MS = 60000;

function LoginPage() {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

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

  const getApiErrorMessage = (err, fallbackKey) => {
    if (err?.code === "ECONNABORTED") {
      return t("login.errTimeout");
    }

    if (!err?.response) {
      return t("login.errServer");
    }

    const status = err.response.status;
    const backendMessage = err.response?.data?.error || err.response?.data?.mensaje;

    if (status === 400) return backendMessage || t("login.err400");
    if (status === 401) return backendMessage || t("login.err401");
    if (status === 403) return backendMessage || t("login.err403");
    if (status === 404) return backendMessage || t("login.err404");
    if (status >= 500) return t("login.err500");

    return backendMessage || t(fallbackKey);
  };

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
      }, {
        timeout: REQUEST_TIMEOUT_MS,
      });

      // Si la contraseña es correcta, el servidor nos dirá si requiere 2FA
      if (res.data.requireSetup2FA || res.data.require2FA) {
        setQrCode(res.data.qrCode || null);
        setTempSecret(res.data.tempSecret || null);
        setStep(2); // Pasamos a la pantalla del código
      }

    } catch (err) {
      console.error("Error de login:", err);
      const mensajeError = getApiErrorMessage(err, "login.errDefault");
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
      }, {
        timeout: REQUEST_TIMEOUT_MS,
      });

      const { token, usuario } = res.data;

      // 🛑 CANDADO 1: ¿El usuario está inactivo?
      if ('esta_activo' in usuario && (usuario.esta_activo === false || String(usuario.esta_activo) === "false")) {
        setError(t("login.errDisabled"));
        setStep(1); // Lo regresamos al principio
        return; 
      }

      // 🛑 CANDADO 2: ¿El usuario no es administrador?
      if ('rol_id' in usuario && usuario.rol_id !== 1) {
        setError(t("login.errNotAdmin"));
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
      const mensajeError = getApiErrorMessage(err, "login.err2fa");
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-full" aria-label={t("login.dirLabel")}>
      <div className="login-overlay" aria-hidden="true" />
      <div className="login-tools">
        <button
          className="tool-button"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          title="Language / Idioma"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          {t("lang.toggle")}
        </button>

        <button
          className="tool-button"
          onClick={toggleTheme}
          title={theme === "dark" ? t("theme.light") : t("theme.dark")}
        >
          {theme === "dark" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
          {theme === "dark" ? t("theme.light") : t("theme.dark")}
        </button>
      </div>

      <section className="login-shell">
        <div className="login-card">
          <div className="login-hero">
            <img src={logo} alt="Logo AbejaNet" className="login-logo" />
            <h1 className="login-title">AbejaNet<span> {t("login.brandSuffix")}</span></h1>
            <p className="login-subtitle">{t("login.subtitle")}</p>
            <ul className="login-bullets">
              <li><i className="fas fa-wave-square" /> {t("login.bullet1")}</li>
              <li><i className="fas fa-bell" /> {t("login.bullet2")}</li>
              <li><i className="fas fa-lock" /> {t("login.bullet3")}</li>
            </ul>
          </div>

          <div className="login-panel">
            <header className="panel-head">
              <h2>{step === 1 ? t("login.head1") : t("login.head2")}</h2>
            </header>

            {/* ======================= FORMULARIO PASO 1 (LOGIN) ======================= */}
            {step === 1 && (
              <form onSubmit={handleLoginSubmit} className="form" noValidate>
                <div className="field">
                  <label htmlFor="correo" className="label">{t("login.email")}</label>
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
                  <label htmlFor="contrasena" className="label">{t("login.password")}</label>
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
                    <span>{t("login.remember")}</span>
                  </label>
                </div>

                {error && <div className="alert" role="alert">{error}</div>}

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : <i className="fas fa-sign-in-alt" />}
                  <span className="btn-text">{loading ? t("login.validating") : t("login.submit")}</span>
                </button>
              </form>
            )}

            {/* ======================= FORMULARIO PASO 2 (2FA) ======================= */}
            {step === 2 && (
              <form onSubmit={handleVerify2FA} className="form" noValidate>
                
                {/* Si mandamos un QR, significa que es la primera vez configurándolo */}
                {qrCode && (
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <p className="qr-note">
                      {t("login.qrStep1")}
                    </p>
                    <img src={qrCode} alt="Código QR 2FA" style={{ borderRadius: "10px", border: "2px solid #ffe600", width: "150px" }} />
                    <p className="qr-note qr-note-strong">
                      {t("login.qrStep2")}
                    </p>
                  </div>
                )}

                {!qrCode && (
                  <p className="qr-hint">
                    {t("login.qrHint")}
                  </p>
                )}

                <div className="field">
                  <label htmlFor="token2FA" className="label">{t("login.codeLabel")}</label>
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
                      onChange={(e) => setToken2FA(e.target.value.replaceAll(/\D/g, ""))} // Solo permite números
                      required
                    />
                  </div>
                </div>

                {error && <div className="alert" role="alert">{error}</div>}

                <button type="submit" className="btn" disabled={loading} style={{ marginBottom: "10px" }}>
                  {loading ? <span className="spinner" /> : <i className="fas fa-check-circle" />}
                  <span className="btn-text">{loading ? t("login.verifying") : t("login.enter")}</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => { setStep(1); setError(""); setToken2FA(""); }}
                >
                  <i className="fas fa-arrow-left" />
                  <span className="btn-text">{t("login.goBack")}</span>
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