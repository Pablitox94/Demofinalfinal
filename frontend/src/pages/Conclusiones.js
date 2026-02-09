import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { FileText, Sparkles, Download as DownloadIcon } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Conclusiones = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

    useEffect(() => {
    if (selectedProject) {
      loadLatestReport(selectedProject);
    }
  }, [selectedProject]);

  const loadLatestReport = async (projectId) => {
    try {
      const reports = await localStorageService.getReports(projectId);
      if (reports && reports.length > 0) {
        setReport(reports[reports.length - 1].content || '');
      } else {
        setReport('');
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
      setReport('');
    }
  };

  const loadProjects = async () => {
    try {
      const primaryProjects = await localStorageService.getProjects('primario');
      setProjects(primaryProjects);
      
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId && primaryProjects.find(p => p.id === savedProjectId)) {
        setSelectedProject(savedProjectId);
      } else if (primaryProjects.length > 0) {
        setSelectedProject(primaryProjects[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedProject) {
      toast.error('¡Elegí una misión primero!');
      return;
    }

    setLoading(true);
    try {
      // Primero intentamos con el backend (IA)
      const response = await axios.post(
        `${API}/reports/generate?project_id=${selectedProject}&education_level=primario`
      );
      setReport(response.data.report);
      
      // Guardar el reporte localmente
      await localStorageService.saveReport({
        projectId: selectedProject,
        content: response.data.report,
        educationLevel: 'primario'
      });
      
      toast.success('¡Reporte generado! 🎉');
    } catch (error) {
      console.error('Error con IA, generando conclusiones locales:', error);
      
      // Si falla el backend, generamos conclusiones básicas localmente
      try {
        const localReport = await generateLocalConclusions();
        setReport(localReport);
         await localStorageService.saveReport({
          projectId: selectedProject,
          content: localReport,
          educationLevel: 'primario'
        });
        toast.info('Conclusiones generadas localmente (sin IA)');
      } catch (localError) {
        console.error('Error generando conclusiones locales:', localError);
        toast.error('Error al generar conclusiones. Verificá que tengas datos cargados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateLocalConclusions = async () => {
    const datasets = await localStorageService.getDatasets(selectedProject);
    const project = await localStorageService.getProjectById(selectedProject);
    
    if (!datasets || datasets.length === 0) {
      throw new Error('No hay datos cargados');
    }
    
    const dataset = datasets[0];
    const variable = dataset.variables?.[0];
    
    if (!variable || !variable.values || variable.values.length === 0) {
      throw new Error('No hay valores en el dataset');
    }
    
    const values = variable.values;
    const total = values.length;
    
    // Calcular frecuencias
    const frequency = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    // Encontrar moda
    const sortedByFreq = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const moda = sortedByFreq[0][0];
    const modaCount = sortedByFreq[0][1];
    const modaPercent = ((modaCount / total) * 100).toFixed(1);
    
    // Generar conclusiones
    let report = `# 📊 Conclusiones de: ${project.name}\n\n`;
    report += `## 📋 Resumen de los datos\n\n`;
    report += `- **Variable analizada:** ${variable.name || 'valor'}\n`;
    report += `- **Total de datos:** ${total}\n`;
    report += `- **Valores diferentes:** ${Object.keys(frequency).length}\n\n`;
    
    report += `## 🏆 ¿Qué descubrimos?\n\n`;
    report += `El valor que más se repite es **"${moda}"** con **${modaCount} veces** (${modaPercent}% del total).\n\n`;
    
    report += `## 📊 Tabla de frecuencias\n\n`;
    report += `| Valor | Cantidad | Porcentaje |\n`;
    report += `|-------|----------|------------|\n`;
    sortedByFreq.forEach(([val, count]) => {
      const percent = ((count / total) * 100).toFixed(1);
      report += `| ${val} | ${count} | ${percent}% |\n`;
    });
    
    report += `\n## 💡 ¿Qué significa esto?\n\n`;
    report += `Según los datos recopilados, la mayoría de las respuestas fueron **"${moda}"**. `;
    report += `Esto nos dice que es la opción más popular o común en el grupo analizado.\n\n`;
    
    report += `---\n*Conclusiones generadas automáticamente basadas en los datos locales.*`;
    
    return report;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Conclusiones" educationLevel="primario" />
        
        <div className="p-8">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <h1 className="text-5xl font-heading font-black mb-2 flex items-center gap-3">
              <FileText className="w-12 h-12" />
              ¡Conclusiones!
            </h1>
            <p className="text-2xl font-accent">Profe Marce te ayuda a entender qué significan los datos</p>
          </div>

          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="bg-white rounded-3xl p-6 mb-6 border-4 border-purple-200">
              <label className="text-xl font-bold mb-3 block">Elegí tu Misión:</label>
              <div className="flex gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject} className="flex-1">
                  <SelectTrigger className="text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={generateReport}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-3 text-lg font-bold"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {loading ? 'Generando...' : '¡Generar Conclusiones!'}
                </Button>
              </div>
            </div>
          )}

          {/* Report Display */}
          {!report && !loading && (
            <div className="bg-white rounded-3xl p-12 text-center border-4 border-purple-200">
              <div className="text-8xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">¡Generá tus conclusiones!</h3>
              <p className="text-xl text-gray-600">Profe Marce va a analizar tus datos y explicarte qué significan</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl p-12 text-center border-4 border-purple-200">
              <div className="text-8xl mb-4 animate-bounce">✨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Profe Marce está analizando...</h3>
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          {report && (
            <div className="bg-white rounded-3xl p-8 border-4 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-6xl">🎯</div>
                <h2 className="text-3xl font-bold text-gray-800">Reporte de Profe Marce</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conclusiones;
