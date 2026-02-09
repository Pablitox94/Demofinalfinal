import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SidebarSecundario from '../components/SidebarSecundario';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportesSecundario = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject);
      loadDatasets(selectedProject);
      loadExistingReport(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const secundarioProjects = await localStorageService.getProjects('secundario');
      setProjects(secundarioProjects);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (currentProjectId && secundarioProjects.find(p => p.id === currentProjectId)) {
        setSelectedProject(currentProjectId);
      } else if (secundarioProjects.length > 0) {
        setSelectedProject(secundarioProjects[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      const project = await localStorageService.getProjectById(projectId);
      setCurrentProject(project);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadDatasets = async (projectId) => {
    try {
      const projectDatasets = await localStorageService.getDatasets(projectId);
      setDatasets(projectDatasets);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadExistingReport = async (projectId) => {
    try {
      const reports = await localStorageService.getReports(projectId);
      if (reports.length > 0) {
        setReport(reports[reports.length - 1].content);
      } else {
        setReport('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedProject) {
      toast.error('Seleccioná un proyecto primero');
      return;
    }

    if (datasets.length === 0) {
      toast.error('El proyecto no tiene datos cargados');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/reports/generate`, null, {
        params: {
          project_id: selectedProject,
          education_level: 'secundario'
        }
      });

      if (response.data.report) {
        setReport(response.data.report);
        await localStorageService.saveReport({
          projectId: selectedProject,
          content: response.data.report,
          educationLevel: 'secundario'
        });
        toast.success('Reporte generado exitosamente');
      }
    } catch (error) {
      console.error('Error generando reporte con IA, usando fallback local:', error);
      try {
        const localReport = await generateLocalReport();
        setReport(localReport);
        toast.info('Reporte generado localmente (sin IA)');
      } catch (localError) {
        toast.error('Error al generar el reporte. Verificá que tengas datos cargados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateLocalReport = async () => {
    const project = await localStorageService.getProjectById(selectedProject);
    const projectDatasets = await localStorageService.getDatasets(selectedProject);
    
    if (!projectDatasets || projectDatasets.length === 0) {
      throw new Error('No hay datos');
    }
    
    const dataset = projectDatasets[0];
    let report = `# 📊 Reporte Estadístico: ${project.name}\n\n`;
    report += `**Nivel:** Secundario\n`;
    report += `**Fecha:** ${new Date().toLocaleDateString('es-AR')}\n\n`;
    
    if (dataset.variables && dataset.variables.length > 0) {
      for (const variable of dataset.variables) {
        report += `## Variable: ${variable.name}\n\n`;
        
        const values = variable.values;
        const n = values.length;
        
        // Si es numérica
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length === values.length) {
          const sum = numericValues.reduce((a, b) => a + b, 0);
          const mean = sum / n;
          const sorted = [...numericValues].sort((a, b) => a - b);
          const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          const range = max - min;
          
          report += `- **N:** ${n}\n`;
          report += `- **Media:** ${mean.toFixed(2)}\n`;
          report += `- **Mediana:** ${median.toFixed(2)}\n`;
          report += `- **Mínimo:** ${min}\n`;
          report += `- **Máximo:** ${max}\n`;
          report += `- **Rango:** ${range.toFixed(2)}\n\n`;
        } else {
          // Cualitativa
          const frequency = {};
          values.forEach(v => { frequency[v] = (frequency[v] || 0) + 1; });
          const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
          
          report += `- **N:** ${n}\n`;
          report += `- **Categorías:** ${Object.keys(frequency).length}\n`;
          report += `- **Moda:** ${sorted[0][0]} (${sorted[0][1]} ocurrencias)\n\n`;
          
          report += `| Categoría | Frecuencia | % |\n|---|---|---|\n`;
          sorted.forEach(([cat, freq]) => {
            report += `| ${cat} | ${freq} | ${((freq/n)*100).toFixed(1)}% |\n`;
          });
          report += '\n';
        }
      }
    }
    
    report += `---\n*Reporte generado localmente*`;
    return report;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('Reporte copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);
    setReport('');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Reportes IA'} educationLevel="secundario" />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Reportes con Inteligencia Artificial
            </h1>
            <p className="text-purple-100">
              Generá informes automáticos que analizan e interpretan tus resultados estadísticos
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm font-bold mb-2 block">Proyecto</Label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateReport}
                disabled={loading || !selectedProject}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="generate-report-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>

              {report && (
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="border-purple-300 text-purple-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              )}
            </div>

            {datasets.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-800">
                <strong>Datos disponibles:</strong> {datasets[0]?.variables?.length || 0} variable(s), {datasets[0]?.rawData?.length || 0} registros
              </div>
            )}
          </div>

          {/* Report Display */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
              <h2 className="text-xl font-bold text-purple-900">
                📄 Informe Estadístico
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Analizando tus datos y generando el reporte...</p>
                  <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                </div>
              ) : report ? (
                <div className="prose prose-purple max-w-none" data-testid="report-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-purple-900 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-purple-800 mb-3 mt-6" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold text-purple-700 mb-2 mt-4" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-purple-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-purple-700" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm" {...props} />
                        ) : (
                          <code className="block bg-gray-100 p-4 rounded-lg overflow-x-auto" {...props} />
                        ),
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-purple-400 pl-4 italic text-gray-600 my-4" {...props} />
                      )
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    No hay reporte generado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Seleccioná un proyecto con datos y hacé click en "Generar Reporte"
                  </p>
                  <p className="text-sm text-purple-600">
                    El reporte analizará tus gráficos, tablas y cálculos estadísticos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesSecundario;
