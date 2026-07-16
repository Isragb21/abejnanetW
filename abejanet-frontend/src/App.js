import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ColmenasPage from "./pages/ColmenasPage";
import ColmenaDetallePage from "./pages/ColmenaDetallePage";
import Cuenta from "./pages/cuenta";
import Sensores from "./pages/Sensores"; 
import CreateColmenaPage from "./pages/CreateColmenaPage";
import EditColmenaPage from "./pages/EditColmenaPage"; 
import CrudUsu from "./pages/Crud_usu";
import ApiariosPage from "./pages/ApiariosPage";
import ReportesPage from "./pages/ReportesPage";

// 🛡️ Importamos a nuestro guardia de seguridad
import ProtectedRoute from "./pages/ProtectedRoute"; 

function App() {
  return (
    <Router>
      <Routes>

        {/* 🚪 RUTA PÚBLICA: La puerta de entrada (Cualquiera puede ver el Login) */}
        <Route path="/" element={<LoginPage />} />

        {/* 🔒 RUTAS PROTEGIDAS: Si no tienen sesión o no son admin, los patea de regreso al Login */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/colmenas" element={
          <ProtectedRoute>
            <ColmenasPage />
          </ProtectedRoute>
        } />
        
        <Route path="/colmena/:id" element={
          <ProtectedRoute>
            <ColmenaDetallePage />
          </ProtectedRoute>
        } />
        
        <Route path="/cuenta" element={
          <ProtectedRoute>
            <Cuenta />
          </ProtectedRoute>
        } /> 
        
        <Route path="/sensores" element={
          <ProtectedRoute>
            <Sensores />
          </ProtectedRoute>
        } />
        
        <Route path="/colmenas/crear" element={
          <ProtectedRoute>
            <CreateColmenaPage />
          </ProtectedRoute>
        } />
        
        <Route path="/colmenas/editar/:id" element={
          <ProtectedRoute>
            <EditColmenaPage />
          </ProtectedRoute>
        } />
        
        <Route path="/usuarios" element={
          <ProtectedRoute>
            <CrudUsu />
          </ProtectedRoute>
        } />
        
        <Route path="/apiarios" element={
          <ProtectedRoute>
            <ApiariosPage />
          </ProtectedRoute>
        } />
        
        <Route path="/reportes" element={
          <ProtectedRoute>
            <ReportesPage />
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;