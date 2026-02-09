import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Star, Lock, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Keys for localStorage
const ACHIEVEMENTS_KEY = 'estadisticamente_achievements';
const STATS_KEY = 'estadisticamente_user_stats';

const Logros = () => {
  const [userStats, setUserStats] = useState({
    projectsCreated: 0,
    chartsCreated: 0,
    analysisCompleted: 0,
    gamesWon: 0,
    questionsAsked: 0,
    reportsGenerated: 0,
    dataTypesUsed: [],
    worldCupProjectCompleted: false
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  // Define all achievements with unlock conditions
  const achievementDefinitions = [
    {
      id: 1,
      name: '🌟 Primer Paso',
      description: 'Completaste tu primera misión',
      icon: '🌟',
      color: 'from-yellow-400 to-orange-500',
      condition: (stats) => stats.projectsCreated >= 1
    },
    {
      id: 2,
      name: '📊 Creador de Gráficos',
      description: 'Creaste tu primer gráfico',
      icon: '📊',
      color: 'from-blue-400 to-purple-500',
      condition: (stats) => stats.chartsCreated >= 1
    },
    {
      id: 3,
      name: '📈 Maestro de Gráficos',
      description: 'Creaste 5 gráficos diferentes',
      icon: '📈',
      color: 'from-blue-500 to-indigo-600',
      condition: (stats) => stats.chartsCreated >= 5
    },
    {
      id: 4,
      name: '🧠 Primer Análisis',
      description: 'Completaste tu primer análisis estadístico',
      icon: '🧠',
      color: 'from-green-400 to-teal-500',
      condition: (stats) => stats.analysisCompleted >= 1
    },
    {
      id: 5,
      name: '🔬 Calculador Experto',
      description: 'Realizaste 5 análisis estadísticos',
      icon: '🔬',
      color: 'from-green-500 to-emerald-600',
      condition: (stats) => stats.analysisCompleted >= 5
    },
    {
      id: 6,
      name: '⚽ Campeón Mundial',
      description: 'Completaste un proyecto del Mundial 2026',
      icon: '⚽',
      color: 'from-indigo-400 to-blue-500',
      condition: (stats) => stats.worldCupProjectCompleted
    },
    {
      id: 7,
      name: '🎯 5 Misiones',
      description: 'Completaste 5 misiones',
      icon: '🎯',
      color: 'from-pink-400 to-rose-500',
      condition: (stats) => stats.projectsCreated >= 5
    },
    {
      id: 8,
      name: '🏆 10 Misiones',
      description: 'Completaste 10 misiones',
      icon: '🏆',
      color: 'from-amber-400 to-orange-500',
      condition: (stats) => stats.projectsCreated >= 10
    },
    {
      id: 9,
      name: '🚀 Explorador de Datos',
      description: 'Analizaste datos de 3 tipos diferentes',
      icon: '🚀',
      color: 'from-purple-400 to-pink-500',
      condition: (stats) => stats.dataTypesUsed.length >= 3
    },
    {
      id: 10,
      name: '🎮 Jugador Novato',
      description: 'Ganaste tu primer juego educativo',
      icon: '🎮',
      color: 'from-red-400 to-pink-500',
      condition: (stats) => stats.gamesWon >= 1
    },
    {
      id: 11,
      name: '🎮 Jugador Estelar',
      description: 'Ganaste 5 juegos educativos',
      icon: '🎮',
      color: 'from-red-500 to-rose-600',
      condition: (stats) => stats.gamesWon >= 5
    },
    {
      id: 12,
      name: '💡 Curioso',
      description: 'Hiciste tu primera pregunta a Profe Marce',
      icon: '💡',
      color: 'from-yellow-400 to-amber-500',
      condition: (stats) => stats.questionsAsked >= 1
    },
    {
      id: 13,
      name: '💡 Preguntón',
      description: 'Hiciste 10 preguntas a Profe Marce',
      icon: '💡',
      color: 'from-yellow-500 to-orange-500',
      condition: (stats) => stats.questionsAsked >= 10
    },
    {
      id: 14,
      name: '📝 Primer Reporte',
      description: 'Generaste tu primer reporte de IA',
      icon: '📝',
      color: 'from-indigo-400 to-purple-500',
      condition: (stats) => stats.reportsGenerated >= 1
    },
    {
      id: 15,
      name: '📚 Reportero Experto',
      description: 'Generaste 5 reportes de IA',
      icon: '📚',
      color: 'from-indigo-500 to-violet-600',
      condition: (stats) => stats.reportsGenerated >= 5
    }
  ];

  const badges = [
    { name: 'Medalla de Oro', icon: '🥇', condition: (count) => count >= 10 },
    { name: 'Medalla de Plata', icon: '🥈', condition: (count) => count >= 5 },
    { name: 'Medalla de Bronce', icon: '🥉', condition: (count) => count >= 3 },
    { name: 'Estrella Dorada', icon: '⭐', condition: (count) => count >= 12 },
    { name: 'Trofeo Diamante', icon: '💎', condition: (count) => count >= 15 }
  ];

  // Load user stats and achievements from localStorage and backend
  useEffect(() => {
    loadUserData();
  }, []);

  // Check for new achievements whenever stats change
  useEffect(() => {
    checkAndUnlockAchievements();
  }, [userStats]);

  const loadUserData = async () => {
    // Load from localStorage first
    const savedStats = localStorage.getItem(STATS_KEY);
    const savedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);

    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setUserStats(parsed);
    }

    if (savedAchievements) {
      setUnlockedAchievements(JSON.parse(savedAchievements));
    }

    // Also sync with backend data
    await syncWithBackend();
  };

  const syncWithBackend = async () => {
    try {
      // Get projects count
      const projectsRes = await axios.get(`${API}/projects`);
      const primaryProjects = projectsRes.data.filter(p => p.educationLevel === 'primario');
      
      // Check for World Cup project
      const worldCupProject = primaryProjects.some(p => 
        p.name.toLowerCase().includes('mundial') || 
        p.name.toLowerCase().includes('world cup') ||
        p.name.toLowerCase().includes('2026')
      );

      // Update stats based on backend data
      setUserStats(prev => {
        const newStats = {
          ...prev,
          projectsCreated: Math.max(prev.projectsCreated, primaryProjects.length),
          worldCupProjectCompleted: prev.worldCupProjectCompleted || worldCupProject
        };
        
        // Save to localStorage
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
        return newStats;
      });
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  };

  const checkAndUnlockAchievements = () => {
    const newUnlocked = [];
    
    achievementDefinitions.forEach(achievement => {
      if (achievement.condition(userStats) && !unlockedAchievements.includes(achievement.id)) {
        newUnlocked.push(achievement.id);
      }
    });

    if (newUnlocked.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newUnlocked];
      setUnlockedAchievements(updatedAchievements);
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
      
      // Show toast for each new achievement
      newUnlocked.forEach(id => {
        const achievement = achievementDefinitions.find(a => a.id === id);
        if (achievement) {
          toast.success(`¡Desbloqueaste: ${achievement.name}! 🎉`);
        }
      });
    }
  };

  const resetProgress = () => {
    if (window.confirm('¿Estás seguro? Esto borrará todo tu progreso de logros.')) {
      const emptyStats = {
        projectsCreated: 0,
        chartsCreated: 0,
        analysisCompleted: 0,
        gamesWon: 0,
        questionsAsked: 0,
        reportsGenerated: 0,
        dataTypesUsed: [],
        worldCupProjectCompleted: false
      };
      
      setUserStats(emptyStats);
      setUnlockedAchievements([]);
      localStorage.setItem(STATS_KEY, JSON.stringify(emptyStats));
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([]));
      toast.success('Progreso reiniciado');
    }
  };

  const refreshStats = async () => {
    toast.info('Actualizando estadísticas...');
    await syncWithBackend();
    toast.success('¡Estadísticas actualizadas!');
  };

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievementDefinitions.length;

  // Calculate unlocked badges
  const unlockedBadges = badges.map(badge => ({
    ...badge,
    unlocked: badge.condition(unlockedCount)
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mis Logros e Insignias" educationLevel="primario" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-heading font-black mb-2 flex items-center gap-3">
                  <Trophy className="w-12 h-12" />
                  ¡Mis Logros!
                </h1>
                <p className="text-2xl font-accent">
                  Has desbloqueado {unlockedCount} de {totalCount} logros
                </p>
              </div>
              <div className="text-9xl">🏆</div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white rounded-3xl p-6 mb-8 border-4 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">📊 Tu Actividad</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={refreshStats} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-300"
                  data-testid="refresh-stats-btn"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Actualizar
                </Button>
                <Button 
                  onClick={resetProgress} 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="reset-progress-btn"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reiniciar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-blue-600" data-testid="stat-projects">{userStats.projectsCreated}</p>
                <p className="text-sm text-blue-800">Misiones</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-purple-600" data-testid="stat-charts">{userStats.chartsCreated}</p>
                <p className="text-sm text-purple-800">Gráficos</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-green-600" data-testid="stat-analysis">{userStats.analysisCompleted}</p>
                <p className="text-sm text-green-800">Análisis</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-pink-600" data-testid="stat-games">{userStats.gamesWon}</p>
                <p className="text-sm text-pink-800">Juegos Ganados</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-3xl p-6 mb-8 border-4 border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-gray-800">Tu Progreso</span>
              <span className="text-2xl font-black text-yellow-600">{Math.round((unlockedCount/totalCount)*100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max((unlockedCount/totalCount)*100, 5)}%` }}
              >
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6">🌟 Logros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {achievementDefinitions.map((achievement) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`bg-white rounded-3xl p-6 border-4 transition-all ${
                    isUnlocked
                      ? 'border-yellow-300 hover:scale-105 shadow-lg'
                      : 'border-gray-200 opacity-60'
                  }`}
                  data-testid={`achievement-${achievement.id}`}
                >
                  <div className="text-center">
                    <div className={`text-6xl mb-4 ${
                      isUnlocked ? '' : 'grayscale'
                    }`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-800 mb-2">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    {isUnlocked ? (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                        <CheckCircle className="w-5 h-5" />
                        ¡Desbloqueado!
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Lock className="w-5 h-5" />
                        Bloqueado
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Badges Section */}
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6">🎖️ Insignias Especiales</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {unlockedBadges.map((badge, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-8 text-center border-4 transition-all ${
                  badge.unlocked
                    ? 'border-purple-300 hover:scale-105 shadow-lg'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className={`text-7xl mb-3 ${
                  badge.unlocked ? '' : 'grayscale'
                }`}>
                  {badge.icon}
                </div>
                <p className="font-bold text-sm text-gray-700">{badge.name}</p>
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-3xl p-6 mt-8 border-4 border-blue-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">💡 ¿Cómo gano logros?</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Crear misiones:</strong> Andá a "Mis Misiones" y creá proyectos nuevos</li>
              <li>• <strong>Hacer gráficos:</strong> Cargá datos y generá gráficos de barras, sectores, etc.</li>
              <li>• <strong>Analizar datos:</strong> Usá las herramientas de análisis estadístico</li>
              <li>• <strong>Jugar juegos:</strong> Jugá los juegos educativos y ganá puntos</li>
              <li>• <strong>Preguntar a Profe Marce:</strong> Hacele preguntas al chatbot de IA</li>
              <li>• <strong>Generar reportes:</strong> Creá reportes de IA en la sección de Descargar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logros;
