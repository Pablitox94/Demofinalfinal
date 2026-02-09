import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OfflineIndicator from './components/OfflineIndicator';
import InstallPWA from './components/InstallPWA';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import LoadData from './pages/LoadData';
import Charts from './pages/Charts';
import ProfeMarce from './pages/ProfeMarce';

// Primaria pages
import DashboardPrimaria from './pages/DashboardPrimaria';
import Logros from './pages/Logros';
import Misiones from './pages/Misiones';
import CargaDatosPrimaria from './pages/CargaDatosPrimaria';
import GraficosPrimaria from './pages/GraficosPrimaria';
import AnalisisPrimaria from './pages/AnalisisPrimaria';
import Conclusiones from './pages/Conclusiones';
import Descargar from './pages/Descargar';
import Juegos from './pages/Juegos';
import ProfeMarcePrimaria from './pages/ProfeMarcePrimaria';

// Secundario pages
import DashboardSecundario from './pages/DashboardSecundario';
import ProyectosSecundario from './pages/ProyectosSecundario';
import CargaDatosSecundario from './pages/CargaDatosSecundario';
import GraficosSecundario from './pages/GraficosSecundario';
import AnalisisSecundario from './pages/AnalisisSecundario';
import ReportesSecundario from './pages/ReportesSecundario';
import ProfeMarceSecundario from './pages/ProfeMarceSecundario';
import DescargarSecundario from './pages/DescargarSecundario';
import ActividadesSecundario from './pages/ActividadesSecundario';

// Superior pages
import DashboardSuperior from './pages/DashboardSuperior';
import ProyectosSuperior from './pages/ProyectosSuperior';
import CargaDatosSuperior from './pages/CargaDatosSuperior';
import GraficosSuperior from './pages/GraficosSuperior';
import AnalisisSuperior from './pages/AnalisisSuperior';
import ReportesSuperior from './pages/ReportesSuperior';
import ProfeMarceSuperior from './pages/ProfeMarceSuperior';
import DescargarSuperior from './pages/DescargarSuperior';
import ActividadesSuperior from './pages/ActividadesSuperior';

import './App.css';

const ProtectedRoute = ({ children }) => {
  // Función mantenida para uso futuro
  // Por ahora, todas las rutas son accesibles sin autenticación
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <OfflineIndicator />
          <InstallPWA />
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* NIVEL PRIMARIO */}
            <Route
              path="/dashboard-primaria"
              element={
                <ProtectedRoute>
                  <DashboardPrimaria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logros"
              element={
                <ProtectedRoute>
                  <Logros />
                </ProtectedRoute>
              }
            />
            <Route
              path="/misiones"
              element={
                <ProtectedRoute>
                  <Misiones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carga-datos-primaria"
              element={
                <ProtectedRoute>
                  <CargaDatosPrimaria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graficos-primaria"
              element={
                <ProtectedRoute>
                  <GraficosPrimaria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analisis-primaria"
              element={
                <ProtectedRoute>
                  <AnalisisPrimaria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conclusiones"
              element={
                <ProtectedRoute>
                  <Conclusiones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/descargar"
              element={
                <ProtectedRoute>
                  <Descargar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/juegos"
              element={
                <ProtectedRoute>
                  <Juegos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profe-marce-primaria"
              element={
                <ProtectedRoute>
                  <ProfeMarcePrimaria />
                </ProtectedRoute>
              }
            />
            
            {/* NIVEL SECUNDARIO - Rutas Nuevas */}
            <Route
              path="/dashboard-secundario"
              element={
                <ProtectedRoute>
                  <DashboardSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos-secundario"
              element={
                <ProtectedRoute>
                  <ProyectosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carga-datos-secundario"
              element={
                <ProtectedRoute>
                  <CargaDatosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graficos-secundario"
              element={
                <ProtectedRoute>
                  <GraficosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analisis-secundario"
              element={
                <ProtectedRoute>
                  <AnalisisSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes-secundario"
              element={
                <ProtectedRoute>
                  <ReportesSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profe-marce-secundario"
              element={
                <ProtectedRoute>
                  <ProfeMarceSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/actividades-secundario"
              element={
                <ProtectedRoute>
                  <ActividadesSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/descargar-secundario"
              element={
                <ProtectedRoute>
                  <DescargarSecundario />
                </ProtectedRoute>
              }
            />

            {/* NIVEL SECUNDARIO - Rutas Legacy (redirect) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProyectosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/load-data"
              element={
                <ProtectedRoute>
                  <CargaDatosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/charts"
              element={
                <ProtectedRoute>
                  <GraficosSecundario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profe-marce"
              element={
                <ProtectedRoute>
                  <ProfeMarceSecundario />
                </ProtectedRoute>
              }
            />

            {/* NIVEL SUPERIOR - Rutas */}
            <Route
              path="/dashboard-superior"
              element={
                <ProtectedRoute>
                  <DashboardSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos-superior"
              element={
                <ProtectedRoute>
                  <ProyectosSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carga-datos-superior"
              element={
                <ProtectedRoute>
                  <CargaDatosSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graficos-superior"
              element={
                <ProtectedRoute>
                  <GraficosSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analisis-superior"
              element={
                <ProtectedRoute>
                  <AnalisisSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes-superior"
              element={
                <ProtectedRoute>
                  <ReportesSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profe-marce-superior"
              element={
                <ProtectedRoute>
                  <ProfeMarceSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/actividades-superior"
              element={
                <ProtectedRoute>
                  <ActividadesSuperior />
                </ProtectedRoute>
              }
            />
            <Route
              path="/descargar-superior"
              element={
                <ProtectedRoute>
                  <DescargarSuperior />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;