import React from 'react';
import { Bell, User } from 'lucide-react';

const Navbar = ({ projectName, educationLevel }) => {
  const getLevelBadge = () => {
    const colors = {
      primario: 'bg-orange-100 text-orange-700',
      secundario: 'bg-purple-100 text-purple-700',
      superior: 'bg-gray-800 text-white'
    };

    return (
      <span className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold ${colors[educationLevel] || colors.secundario}`}>
        <span className="hidden sm:inline">
          {educationLevel === 'primario' && '🟠 Nivel Primario'}
          {educationLevel === 'secundario' && '🟣 Nivel Secundario'}
          {educationLevel === 'superior' && '⚫ Nivel Superior'}
        </span>
        <span className="sm:hidden">
          {educationLevel === 'primario' && '🟠'}
          {educationLevel === 'secundario' && '🟣'}
          {educationLevel === 'superior' && '⚫'}
        </span>
      </span>
    );
  };

  return (
    <div className="h-14 sm:h-16 bg-white border-b border-pink-100 px-3 sm:px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
        {projectName && (
          <h2 className="text-base sm:text-lg lg:text-xl font-heading font-bold text-pink-900 truncate" data-testid="project-name">
            {projectName}
          </h2>
        )}
        {educationLevel && getLevelBadge()}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <button 
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center transition-colors"
          data-testid="notifications-button"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3" data-testid="user-profile">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="text-xs sm:text-sm hidden md:block">
            <p className="font-bold text-pink-900 truncate max-w-[150px]">Mi Máquina</p>
            <p className="text-pink-600 text-xs">Uso Local</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
