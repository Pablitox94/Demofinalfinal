/**
 * API Service - Wrapper que usa localStorage para datos y backend para IA
 * 
 * MODO LOCAL: Los datos (proyectos, datasets, estadísticas) se guardan en localStorage
 * MODO BACKEND: Las funciones de IA (chat, reportes) siguen usando el backend
 */

import axios from 'axios';
import localStorageService from './localStorageService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// ============ PROJECTS (LOCAL) ============

export const getProjects = async () => {
  return await localStorageService.getProjects();
};

export const getProjectsByLevel = async (educationLevel) => {
  return await localStorageService.getProjects(educationLevel);
};

export const getProjectById = async (projectId) => {
  return await localStorageService.getProjectById(projectId);
};

export const createProject = async (projectData) => {
  return await localStorageService.createProject(projectData);
};

export const updateProject = async (projectId, updateData) => {
  return await localStorageService.updateProject(projectId, updateData);
};

export const deleteProject = async (projectId) => {
  return await localStorageService.deleteProject(projectId);
};

// ============ DATASETS (LOCAL) ============

export const getDatasets = async (projectId) => {
  return await localStorageService.getDatasets(projectId);
};

export const createDataset = async (datasetData) => {
  return await localStorageService.createDataset(datasetData);
};

export const deleteDatasetsByProject = async (projectId) => {
  return await localStorageService.deleteDatasetsByProject(projectId);
};

// ============ STATISTICS (LOCAL) ============

export const getStatistics = async (projectId) => {
  return await localStorageService.getStatistics(projectId);
};

export const calculateStatistics = async (projectId, variableName, data) => {
  // Calculamos estadísticas localmente
  const stats = calculateLocalStats(data);
  
  const statsData = {
    projectId,
    variableName,
    ...stats
  };
  
  await localStorageService.saveStatistics(statsData);
  return stats;
};

// Función auxiliar para calcular estadísticas localmente
const calculateLocalStats = (data) => {
  const numericData = data.map(Number).filter(n => !isNaN(n));
  
  if (numericData.length === 0) {
    return { mean: 0, median: 0, mode: [], range: 0, variance: 0, stdDev: 0 };
  }
  
  // Media
  const sum = numericData.reduce((a, b) => a + b, 0);
  const mean = sum / numericData.length;
  
  // Mediana
  const sorted = [...numericData].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // Moda
  const frequency = {};
  numericData.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(frequency));
  const mode = Object.keys(frequency).filter(key => frequency[key] === maxFreq).map(Number);
  
  // Rango
  const range = Math.max(...numericData) - Math.min(...numericData);
  
  // Varianza y desviación estándar
  const squaredDiffs = numericData.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numericData.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    mode,
    range: Number(range.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    count: numericData.length,
    sum: Number(sum.toFixed(4)),
    min: Math.min(...numericData),
    max: Math.max(...numericData)
  };
};

// Calcular tabla de frecuencias localmente
export const calculateFrequency = async (projectId, variableName, data) => {
  const frequency = {};
  data.forEach(val => {
    const key = String(val);
    frequency[key] = (frequency[key] || 0) + 1;
  });
  
  const total = data.length;
  const table = Object.entries(frequency).map(([value, count]) => ({
    value,
    frequency: count,
    relativeFrequency: Number((count / total).toFixed(4)),
    percentage: Number(((count / total) * 100).toFixed(2))
  }));
  
  return {
    table,
    total,
    uniqueValues: Object.keys(frequency).length
  };
};

// ============ REPORTS (LOCAL STORAGE + BACKEND IA) ============

export const getReports = async (projectId) => {
  return await localStorageService.getReports(projectId);
};

export const generateReport = async (projectId, educationLevel = 'secundario') => {
  try {
    // Obtener datos del proyecto localmente
    const project = await localStorageService.getProjectById(projectId);
    const datasets = await localStorageService.getDatasets(projectId);
    const stats = await localStorageService.getStatistics(projectId);
    
    // Llamar al backend solo para generar el reporte con IA
    const response = await axios.post(`${API_BASE}/reports/generate`, null, {
      params: { project_id: projectId, education_level: educationLevel }
    });
    
    // Guardar el reporte localmente
    const reportData = {
      projectId,
      content: response.data.report,
      educationLevel
    };
    await localStorageService.saveReport(reportData);
    
    return response.data;
  } catch (error) {
    console.error('Error generando reporte:', error);
    // Si falla el backend, generamos un reporte básico local
    const basicReport = await generateBasicLocalReport(projectId, educationLevel);
    return { report: basicReport, id: 'local_' + Date.now() };
  }
};

// Generar reporte básico sin IA
const generateBasicLocalReport = async (projectId, educationLevel) => {
  const project = await localStorageService.getProjectById(projectId);
  const datasets = await localStorageService.getDatasets(projectId);
  
  let report = `# Reporte de Análisis: ${project.name}\n\n`;
  report += `**Nivel educativo:** ${educationLevel}\n`;
  report += `**Fecha:** ${new Date().toLocaleDateString('es-AR')}\n\n`;
  
  if (datasets.length > 0) {
    const dataset = datasets[0];
    if (dataset.variables && dataset.variables.length > 0) {
      const variable = dataset.variables[0];
      report += `## Datos analizados\n`;
      report += `- **Variable:** ${variable.name}\n`;
      report += `- **Cantidad de datos:** ${variable.values.length}\n\n`;
    }
  }
  
  report += `\n*Nota: Este es un reporte básico generado localmente. Para reportes con análisis de IA, se requiere conexión al servidor.*`;
  
  return report;
};

// ============ CHAT (BACKEND - IA) ============

export const chatWithProfeMarce = async (message, sessionId, educationLevel = 'primario') => {
  try {
    const response = await axios.post(`${API_BASE}/chat`, {
      message,
      sessionId,
      educationLevel
    });
    return response.data;
  } catch (error) {
    console.error('Error en chat:', error);
    throw error;
  }
};

// ============ FILE UPLOAD (LOCAL PROCESSING) ============

export const uploadExcel = async (file) => {
  // Procesar Excel localmente usando SheetJS si está disponible
  // Por ahora, intentamos con el backend
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/upload/excel`, formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading Excel:', error);
    throw error;
  }
};

export const uploadCSV = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/upload/csv`, formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading CSV:', error);
    throw error;
  }
};

// ============ EXAMPLES (LOCAL) ============

export const getExampleDatasets = async () => {
  // Retornamos ejemplos localmente
  return [
    {
      id: 'ejemplo_secundario_cualitativo',
      name: '⚽ Mundial 2026: Selecciones Favoritas',
      educationLevel: 'secundario',
      description: 'Encuesta sobre selecciones favoritas para ganar el Mundial 2026',
      analysisType: 'univariado',
      variables: [
        { name: 'seleccion', type: 'cualitativa_nominal', values: ['Argentina', 'Brasil', 'Francia', 'España', 'Alemania', 'Argentina', 'Brasil', 'Argentina', 'Francia', 'Argentina', 'España', 'Argentina', 'Brasil', 'Argentina', 'Alemania', 'Argentina', 'Francia', 'Brasil', 'Argentina', 'España'] }
      ]
    },
    {
      id: 'ejemplo_secundario_cuantitativo',
      name: '📊 Edades de Estudiantes',
      educationLevel: 'secundario',
      description: 'Análisis de edades de estudiantes de secundaria',
      analysisType: 'univariado',
      variables: [
        { name: 'edad', type: 'cuantitativa_discreta', values: [13, 14, 13, 15, 14, 16, 13, 14, 15, 14, 13, 16, 14, 15, 13, 14, 17, 14, 15, 14, 13, 15, 14, 16, 15] }
      ]
    }
  ];
};

// ============ UTILITIES ============

export const clearAllLocalData = () => {
  return localStorageService.clearAllData();
};

export const exportAllData = () => {
  return localStorageService.exportAllData();
};

export const importAllData = (data) => {
  return localStorageService.importAllData(data);
};

// Default export
const apiService = {
  // Projects
  getProjects,
  getProjectsByLevel,
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
  calculateStatistics,
  calculateFrequency,
  
  // Reports
  getReports,
  generateReport,
  
  // Chat (IA)
  chatWithProfeMarce,
  
  // File upload
  uploadExcel,
  uploadCSV,
  
  // Examples
  getExampleDatasets,
  
  // Utilities
  clearAllLocalData,
  exportAllData,
  importAllData
};

export default apiService;
