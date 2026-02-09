import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FolderKanban,
  Upload,
  Database,
  Table2,
  BarChart3,
  TrendingUp,
  FileText,
  MessageCircle,
  Download,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ educationLevel }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: FolderKanban, label: 'Proyectos', path: '/projects' },
    { icon: Upload, label: 'Cargar Datos', path: '/load-data' },
    { icon: Database, label: 'Ver Datos', path: '/view-data' },
    { icon: Table2, label: 'Tablas de Frecuencia', path: '/frequency-tables' },
    { icon: BarChart3, label: 'Gráficos', path: '/charts' },
    { icon: TrendingUp, label: 'Análisis', path: '/analysis' },
    { icon: FileText, label: 'Reportes', path: '/reports' },
    { icon: MessageCircle, label: 'Profe Marce', path: '/profe-marce' },
    { icon: Download, label: 'Exportar', path: '/export' },
    { icon: HelpCircle, label: 'Ayuda', path: '/help' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 gradient-sidebar shadow-2xl z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-pink-600" />
          </div>
          <div>
            <h1 className="text-white font-heading text-lg font-bold">EstadísticaMente</h1>
            <p className="text-pink-200 text-xs">CRM Educativo</p>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                isActive
                  ? 'bg-white text-pink-600 font-bold shadow-lg'
                  : 'text-pink-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Volver al Inicio */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          data-testid="back-to-home-button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-pink-100 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Volver al Inicio</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;