import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, GraduationCap, BookOpen, Users, Download } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar si se instaló
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación');
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const levels = [
    {
      id: 'primario',
      title: 'Nivel Primario',
      icon: '🔵',
      description: 'Aprendé estadística de forma visual y divertida',
      color: 'from-blue-400 to-blue-600',
      features: ['Pictogramas', 'Gráficos simples', 'Entrada por voz'],
      testId: 'primary-level-button'
    },
    {
      id: 'secundario',
      title: 'Nivel Secundario',
      icon: '🟣',
      description: 'Analizá datos con tablas de frecuencia y gráficos',
      color: 'from-purple-400 to-purple-600',
      features: ['Tablas de frecuencia', 'Múltiples gráficos', 'Análisis básico'],
      testId: 'secondary-level-button'
    },
    {
      id: 'superior',
      title: 'Nivel Superior',
      icon: '⚫',
      description: 'Herramientas profesionales de análisis estadístico',
      color: 'from-gray-700 to-gray-900',
      features: ['Análisis avanzado', 'Correlaciones', 'Regresión lineal'],
      testId: 'higher-level-button'
    }
  ];

  const handleLevelSelect = (levelId) => {
    localStorage.setItem('educationLevel', levelId);
    if (levelId === 'primario') {
      navigate('/dashboard-primaria');
    } else if (levelId === 'secundario') {
      navigate('/dashboard-secundario');
    } else if (levelId === 'superior') {
      navigate('/dashboard-superior');
    } else {
      navigate('/dashboard-secundario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* Logo & Title */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16" data-testid="home-header">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img src="/logo.png" alt="EstadísticaMente" className="h-20 sm:h-24 lg:h-28 w-auto object-contain" />
            </div>
            <p className="text-xl sm:text-2xl text-pink-700 font-medium mb-2">
              CRM Analítico Educativo
            </p>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 mb-6">
              Pensar con datos, decidir con criterio
            </p>

            {/* Install Button */}
            {!isInstalled && (
              <div className="flex justify-center">
                <button
                  onClick={handleInstallClick}
                  disabled={!isInstallable}
                  className={`inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-xl transition-all duration-300 ${
                    isInstallable 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  {isInstallable ? '¡Instalar EstadísticaMente!' : 'App instalable en Chrome/Edge'}
                </button>
              </div>
            )}

            {isInstalled && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-100 text-green-700 font-bold">
                  <span className="text-2xl">✅</span>
                  <span>App instalada correctamente</span>
                </div>
              </div>
            )}
          </div>

          {/* Level Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelSelect(level.id)}
                data-testid={level.testId}
                className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-2 border-2 border-pink-100 hover:border-pink-300"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{level.icon}</div>
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-pink-900 mb-1 sm:mb-2">
                    {level.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{level.description}</p>
                  
                  <div className="space-y-1 mb-3 sm:mb-4">
                    {level.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-1.5 text-xs text-gray-700">
                        <div className="w-1 h-1 rounded-full bg-pink-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`inline-block px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r ${level.color} text-white font-bold text-sm sm:text-base shadow-lg group-hover:shadow-xl transition-shadow`}>
                    Comenzar
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center shadow-sm border border-pink-100">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-pink-900 mb-1.5 sm:mb-2 text-sm sm:text-base">Aprendé Haciendo</h3>
              <p className="text-xs sm:text-sm text-gray-600">Trabajá con datos reales y casos prácticos</p>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center shadow-sm border border-pink-100">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-pink-900 mb-1.5 sm:mb-2 text-sm sm:text-base">Asistente AI</h3>
              <p className="text-xs sm:text-sm text-gray-600">Profe Marce te guía en cada paso</p>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center shadow-sm border border-pink-100 sm:col-span-2 lg:col-span-1">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-pink-900 mb-1.5 sm:mb-2 text-sm sm:text-base">Para Todos</h3>
              <p className="text-xs sm:text-sm text-gray-600">Desde primaria hasta universidad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;