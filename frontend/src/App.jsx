import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmpresaProvider } from './context/EmpresaContext';
import { InventarioProvider } from './context/InventarioContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Principal from './pages/Principal';
import Perfil from './pages/Perfil';
import Inventario from './pages/Inventario';
import Lotes from './pages/Lotes';
import Ventas from './pages/Ventas';
import TBF from './pages/TBF';
import Graficos from './pages/Graficos';
import Placeholder from './pages/Placeholder';

// Empresa subpages
import DatosUbi from './pages/empresa/DatosUbi';
import SeriesCo from './pages/empresa/SeriesCo';
import Sucursales from './pages/empresa/Sucursales';
import RolesPer from './pages/empresa/RolesPer';
import Usuarios from './pages/empresa/Usuarios';
import MetodosPago from './pages/empresa/MetodosPago';

// Protects routes from unauthenticated access
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected: wrapped inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/principal" replace />} />
        <Route path="principal" element={<Principal />} />
        <Route path="perfil" element={<Perfil />} />
        
        {/* Empresa modular routes */}
        <Route path="empresa" element={<Navigate to="/empresa/datos-ubi" replace />} />
        <Route path="empresa/datos-ubi" element={<DatosUbi />} />
        <Route path="empresa/series-co" element={<SeriesCo />} />
        <Route path="empresa/sucursales" element={<Sucursales />} />
        <Route path="empresa/roles-per" element={<RolesPer />} />
        <Route path="empresa/usuarios" element={<Usuarios />} />
        <Route path="empresa/metodos-pago" element={<MetodosPago />} />

        <Route path="graficos" element={<Graficos />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="tbf" element={<TBF />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="lotes" element={<Lotes />} />
        <Route path="calendario" element={<Placeholder title="Calendario" />} />
        <Route path="usuarios" element={<Placeholder title="Usuarios" />} />
        <Route path="herramientas" element={<Placeholder title="Herramientas" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <EmpresaProvider>
        <InventarioProvider>
          <ThemeProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ThemeProvider>
        </InventarioProvider>
      </EmpresaProvider>
    </AuthProvider>
  );
}

export default App;
