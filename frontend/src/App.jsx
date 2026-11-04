import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmpresaProvider } from './context/EmpresaContext';
import { InventarioProvider } from './context/InventarioContext';
import { FinanzasProvider } from './context/FinanzasContext';
import { CRMProvider } from './context/CRMContext';
import { usePermission } from './hooks/usePermission';
import CRM from './pages/CRM';
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
import TreasuryView from './components/treasury/TreasuryView';
import ProfitLossReportPage from './pages/finanzas/ProfitLossReportPage';

// Empresa subpages
import DatosUbi from './pages/empresa/DatosUbi';
import SeriesCo from './pages/empresa/SeriesCo';
import Sucursales from './pages/empresa/Sucursales';
import RolesPer from './pages/empresa/RolesPer';
import Usuarios from './pages/empresa/Usuarios';
import MetodosPago from './pages/empresa/MetodosPago';
import Auditoria from './pages/empresa/Auditoria';
import { EmpresaLayout } from './pages/Empresa';

// Protects routes from unauthenticated access
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const AdminMasterRoute = ({ children }) => {
  const { can } = usePermission();
  return can('empresa', 'VER') ? children : <Navigate to="/principal" replace />;
};

const ModuleProtectedRoute = ({ children, moduleKey }) => {
  const { can } = usePermission();
  return can(moduleKey, 'VER') ? children : <Navigate to="/principal" replace />;
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
        <Route path="empresa" element={<AdminMasterRoute><EmpresaLayout /></AdminMasterRoute>}>
          <Route index element={<Navigate to="/empresa/datos-ubi" replace />} />
          <Route path="datos-ubi" element={<DatosUbi />} />
          <Route path="series-co" element={<SeriesCo />} />
          <Route path="sucursales" element={<Sucursales />} />
          <Route path="roles-per" element={<RolesPer />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="metodos-pago" element={<MetodosPago />} />
          <Route path="auditoria" element={<Auditoria />} />
        </Route>

        <Route path="graficos" element={<ModuleProtectedRoute moduleKey="graficos"><Graficos /></ModuleProtectedRoute>} />
        <Route path="ventas" element={<ModuleProtectedRoute moduleKey="ventas"><Ventas /></ModuleProtectedRoute>} />
        <Route path="tbf" element={<ModuleProtectedRoute moduleKey="tbf"><TBF /></ModuleProtectedRoute>} />
        <Route path="inventario" element={<ModuleProtectedRoute moduleKey="inventario"><Inventario /></ModuleProtectedRoute>} />
        <Route path="kardex" element={<ModuleProtectedRoute moduleKey="inventario"><Kardex /></ModuleProtectedRoute>} />
        <Route path="lotes" element={<ModuleProtectedRoute moduleKey="lotes"><Lotes /></ModuleProtectedRoute>} />
        <Route path="promociones" element={<ModuleProtectedRoute moduleKey="promociones"><Promociones /></ModuleProtectedRoute>} />
        <Route path="caja" element={<ModuleProtectedRoute moduleKey="caja"><Caja /></ModuleProtectedRoute>} />
        
        <Route path="tesoreria" element={<ModuleProtectedRoute moduleKey="rendiciones_cxc_cxp"><TreasuryView /></ModuleProtectedRoute>} />
        <Route path="rendiciones" element={<Navigate to="/tesoreria" replace />} />
        <Route path="finanzas/estado-resultados" element={<ModuleProtectedRoute moduleKey="estado_resultados"><ProfitLossReportPage /></ModuleProtectedRoute>} />
        <Route path="crm" element={<ModuleProtectedRoute moduleKey="crm"><CRM /></ModuleProtectedRoute>} />
        <Route path="calendario" element={<ModuleProtectedRoute moduleKey="calendario"><Calendario /></ModuleProtectedRoute>} />
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
          <FinanzasProvider>
          <CRMProvider>
          <ThemeProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ThemeProvider>
          </CRMProvider>
          </FinanzasProvider>
        </InventarioProvider>
      </EmpresaProvider>
    </AuthProvider>
  );
}

export default App;
