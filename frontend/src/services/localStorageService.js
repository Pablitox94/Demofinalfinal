/**
 * LocalStorage Service - Reemplaza las llamadas al backend para almacenamiento local
 * Los datos se guardan en el navegador de cada usuario, sin sincronización en la nube
 */

const STORAGE_KEYS = {
  PROJECTS: 'estadisticamente_projects',
  DATASETS: 'estadisticamente_datasets',
  STATISTICS: 'estadisticamente_statistics',
  REPORTS: 'estadisticamente_reports'
};

// Utilidades
const generateId = () => {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// ============ PROJECTS ============

export const getProjects = async (educationLevel = null) => {
  const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
  if (educationLevel) {
    return projects.filter(p => p.educationLevel === educationLevel);
  }
  return projects;
};

export const getProjectById = async (projectId) => {
  const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error('Proyecto no encontrado');
  }
  return project;
};

export const createProject = async (projectData) => {
  const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
  
  const newProject = {
    id: generateId(),
    ...projectData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  
  return newProject;
};

export const updateProject = async (projectId, updateData) => {
  const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
  const index = projects.findIndex(p => p.id === projectId);
  
  if (index === -1) {
    throw new Error('Proyecto no encontrado');
  }
  
  projects[index] = {
    ...projects[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  return { success: true, message: 'Proyecto actualizado' };
};

export const deleteProject = async (projectId) => {
  let projects = getFromStorage(STORAGE_KEYS.PROJECTS);
  const initialLength = projects.length;
  
  projects = projects.filter(p => p.id !== projectId);
  
  if (projects.length === initialLength) {
    throw new Error('Proyecto no encontrado');
  }
  
  saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  
  // También eliminar datasets, estadísticas y reportes asociados
  await deleteDatasetsByProject(projectId);
  await deleteStatisticsByProject(projectId);
  await deleteReportsByProject(projectId);
  
  return { success: true, message: 'Proyecto eliminado' };
};

// ============ DATASETS ============

export const getDatasets = async (projectId) => {
  const datasets = getFromStorage(STORAGE_KEYS.DATASETS);
  return datasets.filter(d => d.projectId === projectId);
};

export const createDataset = async (datasetData) => {
  const datasets = getFromStorage(STORAGE_KEYS.DATASETS);
  
  const newDataset = {
    id: generateId(),
    ...datasetData,
    createdAt: new Date().toISOString()
  };
  
  datasets.push(newDataset);
  saveToStorage(STORAGE_KEYS.DATASETS, datasets);
  
  return newDataset;
};

export const deleteDatasetsByProject = async (projectId) => {
  let datasets = getFromStorage(STORAGE_KEYS.DATASETS);
  const initialLength = datasets.length;
  
  datasets = datasets.filter(d => d.projectId !== projectId);
  saveToStorage(STORAGE_KEYS.DATASETS, datasets);
  
  return { success: true, deleted_count: initialLength - datasets.length };
};

// ============ STATISTICS ============

export const getStatistics = async (projectId) => {
  const statistics = getFromStorage(STORAGE_KEYS.STATISTICS);
  return statistics.filter(s => s.projectId === projectId);
};

export const saveStatistics = async (statsData) => {
  const statistics = getFromStorage(STORAGE_KEYS.STATISTICS);
  
  const newStats = {
    id: generateId(),
    ...statsData,
    createdAt: new Date().toISOString()
  };
  
  statistics.push(newStats);
  saveToStorage(STORAGE_KEYS.STATISTICS, statistics);
  
  return newStats;
};

export const deleteStatisticsByProject = async (projectId) => {
  let statistics = getFromStorage(STORAGE_KEYS.STATISTICS);
  statistics = statistics.filter(s => s.projectId !== projectId);
  saveToStorage(STORAGE_KEYS.STATISTICS, statistics);
  return { success: true };
};

// ============ REPORTS ============

export const getReports = async (projectId) => {
  const reports = getFromStorage(STORAGE_KEYS.REPORTS);
  return reports.filter(r => r.projectId === projectId);
};

export const saveReport = async (reportData) => {
  const reports = getFromStorage(STORAGE_KEYS.REPORTS);
  
  const newReport = {
    id: generateId(),
    ...reportData,
    createdAt: new Date().toISOString()
  };
  
  reports.push(newReport);
  saveToStorage(STORAGE_KEYS.REPORTS, reports);
  
  return newReport;
};

export const deleteReportsByProject = async (projectId) => {
  let reports = getFromStorage(STORAGE_KEYS.REPORTS);
  reports = reports.filter(r => r.projectId !== projectId);
  saveToStorage(STORAGE_KEYS.REPORTS, reports);
  return { success: true };
};

// ============ UTILITY FUNCTIONS ============

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  return { success: true, message: 'Todos los datos locales han sido eliminados' };
};

export const exportAllData = () => {
  const data = {
    projects: getFromStorage(STORAGE_KEYS.PROJECTS),
    datasets: getFromStorage(STORAGE_KEYS.DATASETS),
    statistics: getFromStorage(STORAGE_KEYS.STATISTICS),
    reports: getFromStorage(STORAGE_KEYS.REPORTS),
    exportedAt: new Date().toISOString()
  };
  return data;
};

export const importAllData = (data) => {
  try {
    if (data.projects) saveToStorage(STORAGE_KEYS.PROJECTS, data.projects);
    if (data.datasets) saveToStorage(STORAGE_KEYS.DATASETS, data.datasets);
    if (data.statistics) saveToStorage(STORAGE_KEYS.STATISTICS, data.statistics);
    if (data.reports) saveToStorage(STORAGE_KEYS.REPORTS, data.reports);
    return { success: true, message: 'Datos importados correctamente' };
  } catch (error) {
    return { success: false, message: 'Error al importar datos' };
  }
};

// Default export con todas las funciones
const localStorageService = {
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  
  // Datasets
  getDatasets,
  createDataset,
  deleteDatasetsByProject,
  
  // Statistics
  getStatistics,
  saveStatistics,
  deleteStatisticsByProject,
  
  // Reports
  getReports,
  saveReport,
  deleteReportsByProject,
  
  // Utilities
  clearAllData,
  exportAllData,
  importAllData
};

export default localStorageService;
