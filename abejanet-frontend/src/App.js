import { BrowserRouter as Router, Routes, Route } from \"react-router-dom\";
import LoginPage from \"./pages/LoginPage\";
import DashboardPage from \"./pages/DashboardPage\";
import ColmenasPage from \"./pages/ColmenasPage\";
import ColmenaDetallePage from \"./pages/ColmenaDetallePage\";
import Cuenta from \"./pages/cuenta\";
import Sensores from \"./pages/Sensores\"; 
import CreateColmenaPage from \"./pages/CreateColmenaPage\";
import EditColmenaPage from \"./pages/EditColmenaPage\"; 
import CrudUsu from \"./pages/Crud_usu\";
import ApiariosPage from \"./pages/ApiariosPage\";
import ReportesPage from \"./pages/ReportesPage\";
import ProtectedRoute from \"./pages/ProtectedRoute\"; 
import FloatingHelp from \"./components/FloatingHelp\";
import { ThemeProvider } from \"./ThemeContext\";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path=\"/\" element={<LoginPage />} />
          <Route path=\"/dashboard\" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path=\"/colmenas\" element={<ProtectedRoute><ColmenasPage /></ProtectedRoute>} />
          <Route path=\"/colmena/:id\" element={<ProtectedRoute><ColmenaDetallePage /></ProtectedRoute>} />
          <Route path=\"/crear-colmena\" element={<ProtectedRoute><CreateColmenaPage /></ProtectedRoute>} />
          <Route path=\"/editar-colmena/:id\" element={<ProtectedRoute><EditColmenaPage /></ProtectedRoute>} />
          <Route path=\"/cuenta\" element={<ProtectedRoute><Cuenta /></ProtectedRoute>} />
          <Route path=\"/sensores\" element={<ProtectedRoute><Sensores /></ProtectedRoute>} />
          <Route path=\"/usuarios\" element={<ProtectedRoute><CrudUsu /></ProtectedRoute>} />
          <Route path=\"/crud_usu\" element={<ProtectedRoute><CrudUsu /></ProtectedRoute>} />
          <Route path=\"/apiarios\" element={<ProtectedRoute><ApiariosPage /></ProtectedRoute>} />
          <Route path=\"/colmenas/:apiarioId\" element={<ProtectedRoute><ColmenasPage /></ProtectedRoute>} />
          <Route path=\"/colmenas/crear/:apiarioId\" element={<ProtectedRoute><CreateColmenaPage /></ProtectedRoute>} />
          <Route path=\"/colmenas/editar/:colmenaId\" element={<ProtectedRoute><EditColmenaPage /></ProtectedRoute>} />
          <Route path=\"/colmenas/detalle/:colmenaId\" element={<ProtectedRoute><ColmenaDetallePage /></ProtectedRoute>} />
          <Route path=\"/reportes\" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
        </Routes>
        <FloatingHelp />
      </Router>
    </ThemeProvider>
  );
}

export default App;
