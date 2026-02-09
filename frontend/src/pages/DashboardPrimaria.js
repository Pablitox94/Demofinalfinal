import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Award, Star, Zap } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import localStorageService from '../services/localStorageService';

const DashboardPrimaria = () => {
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState(5);
  const [badges, setBadges] = useState(3);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const primaryProjects = await localStorageService.getProjects('primario');
      setProjects(primaryProjects);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const metrics = [
    {
      label: 'Misiones Completadas',
      value: projects.length,
      icon: Target,
      color: 'bg-gradient-to-br from-green-200 to-green-300',
      textColor: 'text-green-800',
      emoji: '🎯'
    },
    {
      label: 'Logros Desbloqueados',
      value: achievements,
      icon: Trophy,
      color: 'bg-gradient-to-br from-yellow-200 to-yellow-300',
      textColor: 'text-yellow-800',
      emoji: '🏆'
    },
    {
      label: 'Insignias Obtenidas',
      value: badges,
      icon: Award,
      color: 'bg-gradient-to-br from-purple-200 to-pink-200',
      textColor: 'text-purple-800',
      emoji: '🎖️'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mi Aventura Estadística" educationLevel="primario" />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Hero */}
          <div className="bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8 text-white shadow-xl" data-testid="welcome-hero">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-2 sm:mb-3 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <span>¡Hola Explorador!</span>
                  <span className="text-4xl sm:text-5xl lg:text-6xl">👋</span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl font-accent text-white/90 mb-3 sm:mb-4">
                  ¡Bienvenido a tu aventura con los datos!
                </p>
                <Link to="/misiones">
                  <button className="bg-white text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:scale-105 transition-transform shadow-lg flex items-center gap-2 mx-auto sm:mx-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                    ¡Comenzar Nueva Misión!
                  </button>
                </Link>
              </div>
              <div className="text-6xl sm:text-7xl lg:text-9xl">
                🚀
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`${metric.color} rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${metric.textColor} shadow-xl hover:scale-105 transition-transform`}
                data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl lg:text-6xl">{metric.emoji}</div>
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 fill-yellow-400" />
                </div>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">{metric.value}</div>
                <div className="text-base sm:text-lg font-bold opacity-90">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Link to="/misiones">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-4 border-orange-200 hover:border-orange-300 transition-all hover:scale-105 cursor-pointer" data-testid="quick-action-missions">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎯</div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-orange-900 mb-1 sm:mb-2">Mis Misiones</h3>
                <p className="text-gray-600 text-base sm:text-lg">Completa proyectos y gana puntos</p>
              </div>
            </Link>

            <Link to="/juegos">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-4 border-amber-200 hover:border-amber-300 transition-all hover:scale-105 cursor-pointer" data-testid="quick-action-games">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎮</div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-amber-900 mb-1 sm:mb-2">Juegos</h3>
                <p className="text-gray-600 text-base sm:text-lg">Aprende jugando con estadística</p>
              </div>
            </Link>

            <Link to="/profe-marce-primaria">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-4 border-yellow-200 hover:border-yellow-300 transition-all hover:scale-105 cursor-pointer" data-testid="quick-action-chat">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">💬</div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-yellow-900 mb-1 sm:mb-2">Profe Marce</h3>
                <p className="text-gray-600 text-base sm:text-lg">Pregunta lo que quieras</p>
              </div>
            </Link>

            <Link to="/logros">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-4 border-green-200 hover:border-green-300 transition-all hover:scale-105 cursor-pointer" data-testid="quick-action-achievements">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🏆</div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-green-900 mb-1 sm:mb-2">Mis Logros</h3>
                <p className="text-gray-600 text-base sm:text-lg">Ver tus insignias y trofeos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPrimaria;