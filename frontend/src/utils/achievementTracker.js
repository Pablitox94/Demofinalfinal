// Achievement tracking utilities for EstadísticaMente Nivel Primario

const STATS_KEY = 'estadisticamente_user_stats';

// Get current stats from localStorage
export const getUserStats = () => {
  const saved = localStorage.getItem(STATS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    projectsCreated: 0,
    chartsCreated: 0,
    analysisCompleted: 0,
    gamesWon: 0,
    questionsAsked: 0,
    reportsGenerated: 0,
    dataTypesUsed: [],
    worldCupProjectCompleted: false
  };
};

// Save stats to localStorage
export const saveUserStats = (stats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

// Increment a specific stat
export const incrementStat = (statName, amount = 1) => {
  const stats = getUserStats();
  if (typeof stats[statName] === 'number') {
    stats[statName] += amount;
    saveUserStats(stats);
  }
  return stats;
};

// Track project creation
export const trackProjectCreated = (projectName = '') => {
  const stats = getUserStats();
  stats.projectsCreated += 1;
  
  // Check for World Cup project
  if (projectName.toLowerCase().includes('mundial') || 
      projectName.toLowerCase().includes('world cup') ||
      projectName.toLowerCase().includes('2026')) {
    stats.worldCupProjectCompleted = true;
  }
  
  saveUserStats(stats);
  return stats;
};

// Track chart creation
export const trackChartCreated = () => {
  return incrementStat('chartsCreated');
};

// Track analysis completion
export const trackAnalysisCompleted = () => {
  return incrementStat('analysisCompleted');
};

// Track game won
export const trackGameWon = () => {
  return incrementStat('gamesWon');
};

// Track question asked to Profe Marce
export const trackQuestionAsked = () => {
  return incrementStat('questionsAsked');
};

// Track report generated
export const trackReportGenerated = () => {
  return incrementStat('reportsGenerated');
};

// Track data type used
export const trackDataTypeUsed = (dataType) => {
  const stats = getUserStats();
  if (!stats.dataTypesUsed.includes(dataType)) {
    stats.dataTypesUsed.push(dataType);
    saveUserStats(stats);
  }
  return stats;
};

// Reset all stats (for new user registration)
export const resetUserStats = () => {
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
  saveUserStats(emptyStats);
  localStorage.removeItem('estadisticamente_achievements');
  return emptyStats;
};
