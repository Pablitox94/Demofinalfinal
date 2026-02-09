import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  PlusCircle,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Users,
  Database
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [educationLevel, setEducationLevel] = useState('secundario');

  useEffect(() => {
    const level = localStorage.getItem('educationLevel') || 'secundario';
    setEducationLevel(level);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
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
      color: 'bg-pink-500',
      testId: 'active-projects-count'
    },
    {
      label: 'Gráficos Creados',
      value: projects.length * 3,
      icon: BarChart3,
      color: 'bg-purple-500',
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
      value: projects.length * 50,
      icon: Database,
      color: 'bg-green-500',
      testId: 'data-count'
    }
  ];

  return (
    <div className="flex min-h-screen bg-pink-50">
      <Sidebar educationLevel={educationLevel} />
      
      <div className="flex-1 ml-64">
        <Navbar projectName="Mi Progreso en Estadística" educationLevel={educationLevel} />
        
        <div className="p-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-3xl p-8 mb-8 text-white shadow-lg" data-testid="welcome-section">
            <h1 className="text-4xl font-heading font-bold mb-3">
              ¡Bienvenido a EstadísticaMente!
            </h1>
            <p className="text-pink-100 text-lg mb-6">
              Comenzá un nuevo proyecto o continuá con tu análisis estadístico
            </p>
            <Link to="/projects">
              <button className="bg-white text-pink-600 px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors flex items-center gap-2" data-testid="new-project-button">
                <PlusCircle className="w-5 h-5" />
                Crear Nuevo Proyecto
              </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  data-testid={stat.testId}
                  className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 border border-pink-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-heading font-black text-pink-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-pink-900">
                Proyectos Recientes
              </h2>
              <Link to="/projects">
                <button className="text-pink-600 hover:text-pink-700 font-bold text-sm">
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
                <FolderOpen className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aún no tenés proyectos creados</p>
                <Link to="/projects">
                  <button className="bg-pink-600 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-700 transition-colors">
                    Crear Primer Proyecto
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    data-testid={`project-card-${project.id}`}
                  >
                    <div className="bg-pink-50 rounded-2xl p-6 hover:bg-pink-100 transition-colors border-2 border-pink-100 hover:border-pink-300">
                      <div className="flex items-start justify-between mb-3">
                        <FolderOpen className="w-8 h-8 text-pink-600" />
                        <span className="text-xs bg-pink-200 text-pink-800 px-3 py-1 rounded-full font-bold">
                          {project.analysisType}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-pink-900 mb-2 text-lg">
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Link to="/load-data">
              <div className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-pink-100 cursor-pointer" data-testid="quick-action-load-data">
                <Database className="w-10 h-10 text-pink-600 mb-3" />
                <h3 className="font-bold text-pink-900 mb-2">Cargar Datos</h3>
                <p className="text-sm text-gray-600">Ingresá datos manualmente o subí un archivo</p>
              </div>
            </Link>

            <Link to="/charts">
              <div className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-pink-100 cursor-pointer" data-testid="quick-action-charts">
                <BarChart3 className="w-10 h-10 text-pink-600 mb-3" />
                <h3 className="font-bold text-pink-900 mb-2">Crear Gráfico</h3>
                <p className="text-sm text-gray-600">Visualizá tus datos con gráficos interactivos</p>
              </div>
            </Link>

            <Link to="/profe-marce">
              <div className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-pink-100 cursor-pointer" data-testid="quick-action-profe-marce">
                <Users className="w-10 h-10 text-pink-600 mb-3" />
                <h3 className="font-bold text-pink-900 mb-2">Profe Marce</h3>
                <p className="text-sm text-gray-600">Preguntale a tu asistente de estadística</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
