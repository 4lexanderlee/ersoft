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
import Promociones from './pages/Promociones';
import Caja from './pages/Caja';
import Calendario from './pages/Calendario';
import Kardex from './pages/Kardex';

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

// Protects company configuration routes (only Master and Administrador)
const AdminMasterRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Master' && user.role !== 'Administrador') {
    return <Navigate to="/principal" replace />;
  }
  return children;
};

const DEFAULT_ROLES_PERMISOS = {
  Administrador: {
    ventas: { ver: true, crear: true, editar: true, eliminar: true },
    inventario: { ver: true, crear: true, editar: true, eliminar: true },
    lotes: { ver: true, crear: true, editar: true, eliminar: true },
    tbf: { ver: true, crear: true, editar: true, eliminar: true },
    graficos: { ver: true, crear: true, editar: true, eliminar: true },
    empresa: { ver: true, crear: true, editar: true, eliminar: true },
    promociones: { ver: true, crear: true, editar: true, eliminar: true },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_sucursal: { ver: true, crear: true, editar: true, eliminar: true },
  },
  Vendedor: {
    ventas: { ver: true, crear: true, editar: false, eliminar: false },
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    lotes: { ver: false, crear: false, editar: false, eliminar: false },
    tbf: { ver: true, crear: true, editar: false, eliminar: false },
    graficos: { ver: false, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: true, crear: false, editar: false, eliminar: false },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: true, editar: true, eliminar: false },
  },
  Cajero: {
    ventas: { ver: true, crear: true, editar: false, eliminar: false },
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    lotes: { ver: false, crear: false, editar: false, eliminar: false },
    tbf: { ver: true, crear: true, editar: true, eliminar: false },
    graficos: { ver: true, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: true, crear: false, editar: false, eliminar: false },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: false, editar: false, eliminar: false },
  },
  Almacenero: {
    ventas: { ver: false, crear: false, editar: false, eliminar: false },
    inventario: { ver: true, crear: true, editar: true, eliminar: false },
    lotes: { ver: true, crear: true, editar: true, eliminar: true },
    tbf: { ver: false, crear: false, editar: false, eliminar: false },
    graficos: { ver: false, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: false, crear: false, editar: false, eliminar: false },
    caja: { ver: false, crear: false, editar: false, eliminar: false },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: false, editar: false, eliminar: false },
  },
};

// Protects standard module routes based on role permissions
const ModuleProtectedRoute = ({ children, moduleKey }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Master') return children;
  
  try {
    const saved = localStorage.getItem('ersoft_roles_permisos');
    const rolesPermisos = saved ? JSON.parse(saved) : DEFAULT_ROLES_PERMISOS;
    const rolePerm = rolesPermisos[user.role];
    if (rolePerm) {
      if (moduleKey === 'caja' && rolePerm.ventas?.ver) {
        return children;
      }
      if (rolePerm[moduleKey] && rolePerm[moduleKey].ver) {
        return children;
      }
    }
  } catch (e) {
    console.error('Error verifying module route protection:', e);
  }
  return <Navigate to="/principal" replace />;
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
        
        {/* Empresa modular routes (Strictly protected by AdminMasterRoute) */}
        <Route path="empresa" element={<Navigate to="/empresa/datos-ubi" replace />} />
        <Route path="empresa/datos-ubi" element={<AdminMasterRoute><DatosUbi /></AdminMasterRoute>} />
        <Route path="empresa/series-co" element={<AdminMasterRoute><SeriesCo /></AdminMasterRoute>} />
        <Route path="empresa/sucursales" element={<AdminMasterRoute><Sucursales /></AdminMasterRoute>} />
        <Route path="empresa/roles-per" element={<AdminMasterRoute><RolesPer /></AdminMasterRoute>} />
        <Route path="empresa/usuarios" element={<AdminMasterRoute><Usuarios /></AdminMasterRoute>} />
        <Route path="empresa/metodos-pago" element={<AdminMasterRoute><MetodosPago /></AdminMasterRoute>} />

        <Route path="graficos" element={<ModuleProtectedRoute moduleKey="graficos"><Graficos /></ModuleProtectedRoute>} />
        <Route path="ventas" element={<ModuleProtectedRoute moduleKey="ventas"><Ventas /></ModuleProtectedRoute>} />
        <Route path="tbf" element={<ModuleProtectedRoute moduleKey="tbf"><TBF /></ModuleProtectedRoute>} />
        <Route path="inventario" element={<ModuleProtectedRoute moduleKey="inventario"><Inventario /></ModuleProtectedRoute>} />
        <Route path="kardex" element={<ModuleProtectedRoute moduleKey="inventario"><Kardex /></ModuleProtectedRoute>} />
        <Route path="lotes" element={<ModuleProtectedRoute moduleKey="lotes"><Lotes /></ModuleProtectedRoute>} />
        <Route path="promociones" element={<ModuleProtectedRoute moduleKey="promociones"><Promociones /></ModuleProtectedRoute>} />
        <Route path="caja" element={<ModuleProtectedRoute moduleKey="caja"><Caja /></ModuleProtectedRoute>} />
        
        <Route path="calendario" element={<ModuleProtectedRoute moduleKey="calendario_global"><Calendario /></ModuleProtectedRoute>} />
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
