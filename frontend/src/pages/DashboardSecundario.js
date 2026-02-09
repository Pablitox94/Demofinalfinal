import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Database,
  Calculator,
  BookOpen,
  MessageCircle,
  Gamepad2
} from 'lucide-react';
import SidebarSecundario from '../components/SidebarSecundario';
import Navbar from '../components/Navbar';
import localStorageService from '../services/localStorageService';

const DashboardSecundario = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('educationLevel', 'secundario');
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const secundarioProjects = await localStorageService.getProjects('secundario');
      setProjects(secundarioProjects);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Proyectos Activos',
      value: projects.length,
      icon: FolderOpen,
      color: 'bg-purple-500',
      testId: 'active-projects-count'
    },
    {
      label: 'Gráficos Creados',
      value: projects.length * 4,
      icon: BarChart3,
      color: 'bg-indigo-500',
      testId: 'charts-count'
    },
    {
      label: 'Análisis Completados',
      value: projects.length * 2,
      icon: TrendingUp,
      color: 'bg-blue-500',
      testId: 'analysis-count'
    },
    {
      label: 'Datos Analizados',
      value: projects.length * 100,
      icon: Database,
      color: 'bg-violet-500',
      testId: 'data-count'
    }
  ];

  const quickActions = [
    {
      icon: FolderOpen,
      title: 'Nuevo Proyecto',
      description: 'Creá un proyecto de análisis estadístico',
      path: '/proyectos-secundario',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      icon: Database,
      title: 'Cargar Datos',
      description: 'Ingresá datos manual, por voz o archivo',
      path: '/carga-datos-secundario',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: BarChart3,
      title: 'Crear Gráficos',
      description: 'Dashboard interactivo con múltiples gráficos',
      path: '/graficos-secundario',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: Calculator,
      title: 'Análisis Estadístico',
      description: 'Tablas de frecuencia y medidas estadísticas',
      path: '/analisis-secundario',
      color: 'from-indigo-500 to-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Reportes IA',
      description: 'Informes automáticos con inteligencia artificial',
      path: '/reportes-secundario',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Gamepad2,
      title: 'Actividades Interactivas',
      description: 'Ejercicios prácticos y simulaciones',
      path: '/actividades-secundario',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: MessageCircle,
      title: 'Profe Marce',
      description: 'Tu asistente de estadística con IA',
      path: '/profe-marce-secundario',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mi Progreso en Estadística" educationLevel="secundario" />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-xl" data-testid="welcome-section">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-3">
                  ¡Bienvenido al Nivel Secundario!
                </h1>
                <p className="text-purple-100 text-lg mb-6">
                  Analizá datos, creá gráficos profesionales y aprendé estadística de forma práctica
                </p>
                <Link to="/proyectos-secundario">
                  <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg" data-testid="new-project-button">
                    <PlusCircle className="w-5 h-5" />
                    Crear Nuevo Proyecto
                  </button>
                </Link>
              </div>
              <div className="text-9xl opacity-20">📊</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  data-testid={stat.testId}
                  className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 border border-purple-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-heading font-black text-purple-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <h2 className="text-2xl font-heading font-bold text-purple-900 mb-6">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path}>
                  <div className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-purple-100 group cursor-pointer h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-purple-900 text-lg mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-purple-900">
                Proyectos Recientes
              </h2>
              <Link to="/proyectos-secundario">
                <button className="text-purple-600 hover:text-purple-700 font-bold text-sm">
                  Ver Todos →
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Cargando proyectos...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12" data-testid="no-projects-message">
                <FolderOpen className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aún no tenés proyectos de secundario</p>
                <Link to="/proyectos-secundario">
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors">
                    Crear Primer Proyecto
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    to={`/proyectos-secundario`}
                    data-testid={`project-card-${project.id}`}
                    onClick={() => localStorage.setItem('currentProjectId', project.id)}
                  >
                    <div className="bg-purple-50 rounded-2xl p-6 hover:bg-purple-100 transition-colors border-2 border-purple-100 hover:border-purple-300">
                      <div className="flex items-start justify-between mb-3">
                        <FolderOpen className="w-8 h-8 text-purple-600" />
                        <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold">
                          {project.analysisType}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-purple-900 mb-2 text-lg">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(project.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSecundario;
