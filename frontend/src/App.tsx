import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuth, useAuthProvider } from "./hooks/useAuth";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuarioDashboardPage from "./pages/UsuarioDashboardPage";
import ListaMiembrosPage from "./pages/miembros/ListaMiembrosPage";
import FormularioMiembroPage from "./pages/miembros/FormularioMiembroPage";
import DetalleMiembroPage from "./pages/miembros/DetalleMiembroPage";
import HorariosPage from "./pages/horarios/HorariosPage";
import HorarioDetallePage from "./pages/horarios/HorarioDetallePage";
import PasarAsistenciaPage from "./pages/horarios/PasarAsistenciaPage";
import AsistenciaSeleccionPage from "./pages/horarios/AsistenciaSeleccionPage";
import ReportePage from "./pages/reportes/ReportePage";
import EntradaPage from "./pages/entrada/EntradaPage";

function AppProviders({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function RoleDashboard() {
  const { user } = useAuth();
  return user?.rol === "ADMIN" ? <DashboardPage /> : <UsuarioDashboardPage />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.rol !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<RoleDashboard />} />
            <Route path="/miembros" element={<RequireAdmin><ListaMiembrosPage /></RequireAdmin>} />
            <Route path="/miembros/nuevo" element={<RequireAdmin><FormularioMiembroPage /></RequireAdmin>} />
            <Route path="/miembros/:id" element={<RequireAdmin><DetalleMiembroPage /></RequireAdmin>} />
            <Route path="/miembros/:id/editar" element={<RequireAdmin><FormularioMiembroPage /></RequireAdmin>} />
            <Route path="/horarios" element={<RequireAdmin><HorariosPage /></RequireAdmin>} />
            <Route path="/horarios/:id" element={<RequireAdmin><HorarioDetallePage /></RequireAdmin>} />
            <Route path="/horarios/:id/asistencia" element={<RequireAdmin><PasarAsistenciaPage /></RequireAdmin>} />
            <Route path="/asistencia" element={<RequireAdmin><AsistenciaSeleccionPage /></RequireAdmin>} />
            <Route path="/entrada" element={<EntradaPage />} />
            <Route path="/reportes" element={<RequireAdmin><ReportePage /></RequireAdmin>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
