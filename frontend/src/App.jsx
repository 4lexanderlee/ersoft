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
import Empresa from './pages/Empresa';
import Inventario from './pages/Inventario';
import Lotes from './pages/Lotes';
import Ventas from './pages/Ventas';
import TBF from './pages/TBF';
import Placeholder from './pages/Placeholder';

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
        <Route path="empresa" element={<Empresa />} />
        <Route path="graficos" element={<Placeholder title="Gráficos" />} />
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
