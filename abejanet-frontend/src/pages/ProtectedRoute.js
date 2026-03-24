import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Buscamos si existe el token de inicio de sesión en el navegador
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  // Si no hay token o no hay datos de usuario, lo pateamos al Login "/"
  if (!token || !usuario) {
    return <Navigate to="/" replace />;
  }

  // Opcional: Si quieres ser ultra estricto y verificar que siga siendo Admin y Activo
  if (usuario.esta_activo === false || Number(usuario.rol_id) !== 1) {
    // Si de casualidad se coló alguien que no debe, lo borramos y lo pateamos
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return <Navigate to="/" replace />;
  }

  // Si tiene el token y es admin activo, le abrimos la puerta (renderizamos la pantalla)
  return children;
}