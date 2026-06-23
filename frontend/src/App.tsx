import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ListaMiembrosPage from "./pages/miembros/ListaMiembrosPage";
import FormularioMiembroPage from "./pages/miembros/FormularioMiembroPage";
import DetalleMiembroPage from "./pages/miembros/DetalleMiembroPage";
import HorariosPage from "./pages/horarios/HorariosPage";
import HorarioDetallePage from "./pages/horarios/HorarioDetallePage";
import PasarAsistenciaPage from "./pages/horarios/PasarAsistenciaPage";
import AsistenciaSeleccionPage from "./pages/horarios/AsistenciaSeleccionPage";
import ReportePage from "./pages/reportes/ReportePage";

function AppProviders({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/miembros" element={<ListaMiembrosPage />} />
            <Route path="/miembros/nuevo" element={<FormularioMiembroPage />} />
            <Route path="/miembros/:id" element={<DetalleMiembroPage />} />
            <Route path="/miembros/:id/editar" element={<FormularioMiembroPage />} />
            <Route path="/horarios" element={<HorariosPage />} />
            <Route path="/horarios/:id" element={<HorarioDetallePage />} />
            <Route path="/horarios/:id/asistencia" element={<PasarAsistenciaPage />} />
            <Route path="/asistencia" element={<AsistenciaSeleccionPage />} />
            <Route path="/reportes" element={<ReportePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
