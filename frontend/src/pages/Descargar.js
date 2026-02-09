import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Download, FileText, Save, Loader, Upload } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const COLORS = ['#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1'];

// Función para limpiar texto para PDF (elimina caracteres especiales problemáticos)
const cleanTextForPDF = (text) => {
  if (!text) return '';
  return text
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Mapeo de caracteres especiales a ASCII
      const charMap = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U',
        '¿': '?', '¡': '!',
        '°': 'o', '²': '2', '³': '3',
        '×': 'x', '÷': '/', '±': '+/-',
        '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~',
        '∑': 'Sum', '∏': 'Prod', '√': 'sqrt',
        'μ': 'mu', 'σ': 'sigma', 'π': 'pi', 'α': 'alpha', 'β': 'beta',
        '∞': 'inf', '∈': 'in', '∉': 'not in',
        '→': '->', '←': '<-', '↔': '<->',
        '•': '*', '–': '-', '—': '-'
      };
      return charMap[char] || '';
    })
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\$[^$]+\$/g, (match) => {
      // Simplificar fórmulas LaTeX
      return match.replace(/\$/g, '').replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        .replace(/\\bar\{([^}]+)\}/g, '$1')
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
        .replace(/\\sum/g, 'Sum')
        .replace(/\\_/g, '_')
        .replace(/\\/g, '');
    })
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');
};

const Descargar = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [conclusions, setConclusions] = useState('');
  const [chartData, setChartData] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const chartRef = useRef(null);
  const conclusionsRef = useRef(null);

  const getChartPreferenceKey = (projectId) => `chartPreference_primario_${projectId}`;

  useEffect(() => {
    loadProjects();
    
    // Escuchar cambios de proyecto
    const handleStorageChange = (e) => {
      if (e.key === 'currentProjectId' && e.newValue) {
        setSelectedProject(e.newValue);
        loadProjectData(e.newValue);
      }
    };
    
    const handleProjectChange = (e) => {
      if (e.detail && e.detail !== selectedProject) {
        setSelectedProject(e.detail);
        loadProjectData(e.detail);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('projectChanged', handleProjectChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projectChanged', handleProjectChange);
    };
  }, []);

  const loadProjects = async () => {
    try {
      const primaryProjects = await localStorageService.getProjects('primario');
      setProjects(primaryProjects);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (currentProjectId && primaryProjects.find(p => p.id === currentProjectId)) {
        setSelectedProject(currentProjectId);
        loadProjectData(currentProjectId);
      } else if (primaryProjects.length > 0) {
        const firstProject = primaryProjects[0].id;
        setSelectedProject(firstProject);
        localStorage.setItem('currentProjectId', firstProject);
        loadProjectData(firstProject);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      setSelectedChartType(localStorage.getItem(getChartPreferenceKey(projectId)) || 'bar');
      const [project, datasets, statistics, reports] = await Promise.all([
        localStorageService.getProjectById(projectId),
        localStorageService.getDatasets(projectId),
        localStorageService.getStatistics(projectId),
        localStorageService.getReports(projectId)
      ]);

      setProjectData({
        project: project,
        datasets: datasets,
        statistics: statistics
      });

      if (reports && reports.length > 0) {
        setConclusions(reports[reports.length - 1].content);
      } else {
        setConclusions('');
      }

      if (datasets.length > 0 && datasets[0].variables) {
        const variable = datasets[0].variables[0];
        if (variable && variable.values) {
          const valueCounts = {};
          variable.values.forEach(val => {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
          });
          
          const processed = Object.entries(valueCounts).map(([name, value]) => ({
            name: String(name),
            cantidad: value,
            value: value
          }));
          let cumulative = 0;
          processed.forEach(item => {
            cumulative += item.cantidad;
            item.acumulada = cumulative;
          });
          setChartData(processed);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: projectId }));
    loadProjectData(projectId);
  };

  const downloadPDF = async () => {
    if (!projectData) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    setLoading(true);
    toast.info('Generando PDF...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFillColor(219, 39, 119);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EstadisticaMente', pageWidth / 2, 18, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text('Mi Reporte de Estadistica - Nivel Primario', pageWidth / 2, 28, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      yPosition = 45;

      // Nombre del proyecto
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const projectName = cleanTextForPDF(projectData.project.name);
      pdf.text(projectName, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Fecha: ' + new Date().toLocaleDateString('es-AR'), 20, yPosition);
      yPosition += 15;

      // Capturar gráfico
      if (chartRef.current && chartData.length > 0) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          });
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Mi Grafico:', 20, yPosition);
          yPosition += 8;

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          let imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (imgHeight > pageHeight - 50) {
            imgHeight = pageHeight - 50;
          }
          if (yPosition + imgHeight > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (chartError) {
          console.error('Error capturando grafico:', chartError);
        }
      }

      // Estadísticas
      if (projectData.statistics && projectData.statistics.length > 0) {
        const stats = projectData.statistics[0];
        
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resultados:', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const statsData = [
          { label: 'Media (Promedio)', value: stats.mean?.toFixed(2) || 'N/A' },
          { label: 'Mediana', value: stats.median || 'N/A' },
          { label: 'Moda', value: stats.mode || 'N/A' },
          { label: 'Rango', value: stats.range || 'N/A' }
        ];

        statsData.forEach(stat => {
          pdf.text('- ' + stat.label + ': ' + stat.value, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Tabla de datos
      if (projectData.datasets && projectData.datasets.length > 0) {
        const dataset = projectData.datasets[0];
        if (dataset.variables && dataset.variables.length > 0) {
          const variable = dataset.variables[0];
          
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Mis Datos:', 20, yPosition);
          yPosition += 10;

          const valueCounts = {};
          variable.values.forEach(val => {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
          });

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Valor', 25, yPosition);
          pdf.text('Cantidad', 100, yPosition);
          yPosition += 7;

          pdf.setFont('helvetica', 'normal');
          Object.entries(valueCounts).slice(0, 15).forEach(([value, count]) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            const cleanValue = cleanTextForPDF(String(value)).substring(0, 30);
            pdf.text(cleanValue, 25, yPosition);
            pdf.text(String(count), 100, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }
      }

      // Conclusiones
      if (conclusions) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFillColor(139, 92, 246);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Conclusiones de Profe Marce', 20, yPosition + 4);
        yPosition += 18;

        pdf.setTextColor(0, 0, 0);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const cleanReport = cleanTextForPDF(conclusions);
        const reportLines = pdf.splitTextToSize(cleanReport, pageWidth - 40);

        reportLines.forEach(line => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Pagina ' + i + ' de ' + totalPages, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('EstadisticaMente - CRM Educativo', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      pdf.save(projectName.replace(/\s+/g, '_') + '_Reporte.pdf');
      toast.success('PDF descargado!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  const exportProject = () => {
    if (!projectData) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = projectData.project.name.replace(/\s+/g, '_') + '_Proyecto.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Proyecto exportado!');
  };

  const importProject = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        // Validar estructura
        if (!importedData.project || !importedData.datasets) {
          toast.error('Archivo inválido');
          return;
        }
        
        toast.info('Importando proyecto...');
        
        // Crear proyecto (mantener nombre original)
        const newProject = await localStorageService.createProject({
          name: importedData.project.name,
          description: importedData.project.description || '',
          educationLevel: 'primario',
          analysisType: importedData.project.analysisType || 'univariado'
        });
        
        const newProjectId = newProject.id;
        
        // Importar datasets
        if (importedData.datasets) {
          for (const dataset of importedData.datasets) {
            await localStorageService.createDataset({
              projectId: newProjectId,
              name: dataset.name,
              rawData: dataset.rawData || [],
              variables: dataset.variables || [],
              source: 'imported'
            });
          }
        }
        
        // Importar estadísticas si existen
        if (importedData.statistics && importedData.statistics.length > 0) {
          for (const stat of importedData.statistics) {
            await localStorageService.saveStatistics({
              projectId: newProjectId,
              variableName: stat.variableName,
              ...stat
            });
          }
        }
        
        // Importar reportes si existen
        if (importedData.reports && importedData.reports.length > 0) {
          for (const report of importedData.reports) {
            await localStorageService.saveReport({
              projectId: newProjectId,
              content: report.content,
              educationLevel: 'primario'
            });
          }
        }
        
        toast.success('¡Proyecto importado exitosamente!');
        
        // Recargar proyectos y seleccionar el nuevo
        await loadProjects();
        setSelectedProject(newProjectId);
        localStorage.setItem('currentProjectId', newProjectId);
        window.dispatchEvent(new CustomEvent('projectChanged', { detail: newProjectId }));
        loadProjectData(newProjectId);
        
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al importar proyecto');
      }
    };
    
    input.click();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Descargar" educationLevel="primario" />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-2 flex items-center gap-3">
              <Download className="w-10 h-10 sm:w-12 sm:h-12" />
              Descargar
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl font-accent">Guarda tus trabajos y compartilos</p>
          </div>

          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="bg-white rounded-3xl p-6 mb-8 border-4 border-blue-200">
              <label className="text-xl font-bold mb-3 block">Elegi tu Mision:</label>
              <Select value={selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {chartData.length > 0 && (
            <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: '1200px', zIndex: -1 }}>
              <div ref={chartRef} className="bg-white p-6 rounded-xl" style={{ width: 1200 }}>
                <ResponsiveContainer width="100%" height={300}>
                  {selectedChartType === 'pie' ? (
                    <PieChart>
                      <Pie data={chartData} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
                      <XAxis dataKey="name" tick={{ fill: '#831843', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#831843', fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #EC4899' }} />
                      <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Conclusions Preview con LaTeX */}
          {conclusions && (
            <div className="bg-white rounded-3xl p-6 mb-8 border-4 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-5xl">🎯</div>
                <h3 className="text-xl font-bold text-gray-800">Conclusiones de Profe Marce</h3>
              </div>
              <div ref={conclusionsRef} className="bg-purple-50 rounded-2xl p-4 max-h-64 overflow-y-auto prose prose-purple max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {conclusions}
                </ReactMarkdown>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Estas conclusiones se incluiran en el PDF
              </p>
            </div>
          )}

          {!conclusions && projectData && (
            <div className="bg-yellow-50 rounded-3xl p-6 mb-8 border-4 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="text-4xl">💡</div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-800">Queres agregar conclusiones al PDF?</h3>
                  <p className="text-yellow-700">
                    Anda a <strong>&quot;Conclusiones&quot;</strong> en el menu y pedile a Profe Marce que analice tus datos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 border-4 border-red-200 hover:border-red-400 transition-all hover:scale-105">
              <div className="text-7xl mb-4 text-center">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">Descargar PDF</h3>
              <p className="text-gray-600 text-center mb-6">
                {conclusions 
                  ? 'PDF completo con datos, grafico y conclusiones' 
                  : 'PDF con datos y grafico'}
              </p>
              <Button
                onClick={downloadPDF}
                disabled={loading || !projectData}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full py-4 text-lg font-bold"
                data-testid="download-pdf-btn"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Descargar PDF
                  </>
                )}
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-8 border-4 border-green-200 hover:border-green-400 transition-all hover:scale-105">
              <div className="text-7xl mb-4 text-center">💾</div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">Exportar Proyecto</h3>
              <p className="text-gray-600 text-center mb-6">Guarda todo tu proyecto para continuar despues</p>
              <Button
                onClick={exportProject}
                disabled={!projectData}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-full py-4 text-lg font-bold"
                data-testid="export-project-btn"
              >
                <Save className="w-5 h-5 mr-2" />
                Exportar Proyecto
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-8 border-4 border-blue-200 hover:border-blue-400 transition-all hover:scale-105">
              <div className="text-7xl mb-4 text-center">📂</div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">Importar Proyecto</h3>
              <p className="text-gray-600 text-center mb-6">Carga un proyecto guardado anteriormente</p>
              <Button
                onClick={importProject}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full py-4 text-lg font-bold"
                data-testid="import-project-btn"
              >
                <Upload className="w-5 h-5 mr-2" />
                Importar Proyecto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Descargar;
