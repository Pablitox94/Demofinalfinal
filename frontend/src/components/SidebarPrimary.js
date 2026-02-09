import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Trophy,
  Target,
  BarChart3,
  Calculator,
  FileText,
  Download,
  Gamepad2,
  MessageCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarPrimary = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard-primaria' },
    { icon: Trophy, label: 'Logros', path: '/logros' },
    { icon: Target, label: 'Misiones', path: '/misiones' },
    { icon: BarChart3, label: 'Gráficos', path: '/graficos-primaria' },
    { icon: Calculator, label: 'Análisis', path: '/analisis-primaria' },
    { icon: FileText, label: 'Conclusiones', path: '/conclusiones' },
    { icon: Download, label: 'Descargar', path: '/descargar' },
    { icon: Gamepad2, label: 'Juegos', path: '/juegos' },
    { icon: MessageCircle, label: 'Profe Marce', path: '/profe-marce-primaria' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-br from-orange-400 to-orange-500 p-3 rounded-xl shadow-lg text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 gradient-sidebar-orange shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="block" onClick={closeSidebar}>
            <img src="/logo.png" alt="EstadísticaMente" className="w-full h-auto max-h-16 object-contain" />
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
                onClick={closeSidebar}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-orange-600 font-bold shadow-lg'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Volver al Inicio */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              handleLogout();
              closeSidebar();
            }}
            data-testid="back-to-home-button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Volver al Inicio</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarPrimary;
