import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, FileText, Database, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, LineChart, Line } from 'recharts';
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

const COLORS = ['#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1', '#10B981', '#F97316'];

// Función para limpiar texto para PDF
const cleanTextForPDF = (text) => {
  if (!text) return '';
  return text
    .replace(/[^\x00-\x7F]/g, (char) => {
      const charMap = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U',
        '¿': '?', '¡': '!', '°': 'o', '²': '2', '³': '3',
        '×': 'x', '÷': '/', '±': '+/-',
        '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~',
        '∑': 'Sum', '√': 'sqrt',
        'μ': 'mu', 'σ': 'sigma', 'π': 'pi',
        '•': '*', '–': '-', '—': '-'
      };
      return charMap[char] || '';
    })
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\$[^$]+\$/g, (match) => {
      return match.replace(/\$/g, '').replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        .replace(/\\bar\{([^}]+)\}/g, '$1').replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
        .replace(/\\/g, '');
    })
    .replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
};

const DescargarSecundario = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [chartData, setChartData] = useState([]);
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const contentRef = useRef(null);
  const chartRef = useRef(null);
  const getChartPreferenceKey = (projectId) => `chartPreference_secundario_${projectId}`;

  useEffect(() => {
    loadProjects();
    const currentProjectId = localStorage.getItem('currentProjectId');
    if (currentProjectId) {
      setSelectedProject(currentProjectId);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadAllProjectData(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      const secundarioProjects = response.data.filter(p => p.educationLevel === 'secundario');
      setProjects(secundarioProjects);
    } catch (error) {
      console.error('Error backend, usando datos locales:', error);
      const secundarioProjects = await localStorageService.getProjects('secundario');
      setProjects(secundarioProjects);
    }
  };

  const loadAllProjectData = async (projectId) => {
    try {
      setSelectedChartType(localStorage.getItem(getChartPreferenceKey(projectId)) || 'bar');

      let projectData;
      let datasetsData;
      let statsData;
      let reportsData;

      try {
        const [projectRes, datasetsRes, statsRes, reportsRes] = await Promise.all([
          axios.get(`${API}/projects/${projectId}`),
          axios.get(`${API}/datasets/${projectId}`),
          axios.get(`${API}/statistics/${projectId}`),
          axios.get(`${API}/reports/${projectId}`)
        ]);

        projectData = projectRes.data;
        datasetsData = datasetsRes.data;
        statsData = statsRes.data;
        reportsData = reportsRes.data;
      } catch (backendError) {
        console.error('Error cargando backend, usando localStorage:', backendError);
        const [project, datasets, stats, reports] = await Promise.all([
          localStorageService.getProjectById(projectId),
          localStorageService.getDatasets(projectId),
          localStorageService.getStatistics(projectId),
          localStorageService.getReports(projectId)
        ]);


        projectData = project;
        datasetsData = datasets;
        statsData = stats;
        reportsData = reports;
      }

      setCurrentProject(projectData);
      setDatasets(datasetsData);
      setStatistics(statsData);
      setReports(reportsData);

      // Preparar datos para gráfico
      if (datasetsData.length > 0 && datasetsData[0].variables) {
        const variable = datasetsData[0].variables[0];
        if (variable && variable.values) {
          // Crear tabla de frecuencias para el gráfico
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

          // Calcular estadísticos
          const numericValues = variable.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
          if (numericValues.length > 0) {
            const n = numericValues.length;
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const mean = sum / n;
            const sorted = [...numericValues].sort((a, b) => a - b);
            const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
            const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
            const varianceMuestral = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
            const stdDev = Math.sqrt(variance);
            const stdDevMuestral = Math.sqrt(varianceMuestral);
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            const range = max - min;
            const cv = (stdDev / mean) * 100;

            // Moda
            const modeCount = {};
            numericValues.forEach(v => { modeCount[v] = (modeCount[v] || 0) + 1; });
            const maxFreq = Math.max(...Object.values(modeCount));
            const modes = Object.keys(modeCount).filter(k => modeCount[k] === maxFreq).map(Number);

            setCalculatedStats({
              n, mean, median, modes, variance, varianceMuestral, stdDev, stdDevMuestral, min, max, range, cv
            });
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos del proyecto:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);
  };

  const exportToPDF = async () => {
    if (!currentProject) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    setLoading(true);
    setExportProgress('Preparando documento...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Título
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EstadisticaMente - Nivel Secundario', margin, 25);
      
      yPosition = 50;
      pdf.setTextColor(0, 0, 0);

      // Información del proyecto
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanTextForPDF(currentProject.name), margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Tipo de analisis: ' + cleanTextForPDF(currentProject.analysisType), margin, yPosition);
      yPosition += 6;
      pdf.text('Fecha: ' + new Date().toLocaleDateString('es-AR'), margin, yPosition);
      yPosition += 15;

      setExportProgress('Agregando datos...');

      // Datos
      if (datasets.length > 0 && datasets[0].variables) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Datos del Proyecto', margin, yPosition);
        yPosition += 8;

        datasets[0].variables.forEach((variable) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Variable: ' + cleanTextForPDF(variable.name) + ' (' + cleanTextForPDF(variable.type) + ')', margin, yPosition);
          yPosition += 6;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          const valuesText = variable.values.slice(0, 30).map(v => cleanTextForPDF(String(v))).join(', ') + (variable.values.length > 30 ? '...' : '');
          const splitValues = pdf.splitTextToSize(valuesText, pageWidth - 2 * margin);
          pdf.text(splitValues, margin, yPosition);
          yPosition += splitValues.length * 4 + 8;
        });
      }

      setExportProgress('Capturando grafico...');

      // Capturar gráfico si existe
      if (chartRef.current && chartData.length > 0) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Grafico de Frecuencias', margin, yPosition);
          yPosition += 8;

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          let imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (imgHeight > pageHeight - 50) {
            imgHeight = pageHeight - 50;
          }
          if (yPosition + imgHeight > pageHeight - 15) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (chartError) {
          console.error('Error capturando grafico:', chartError);
        }
      }

      setExportProgress('Agregando estadisticos...');

      // Estadísticos calculados
      if (calculatedStats) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Estadisticos Calculados', margin, yPosition);
        yPosition += 10;

        const statsData = [
          ['Cantidad (n)', calculatedStats.n.toString()],
          ['Media', calculatedStats.mean.toFixed(4)],
          ['Mediana', calculatedStats.median.toFixed(4)],
          ['Moda', calculatedStats.modes.join(', ')],
          ['Minimo', calculatedStats.min.toFixed(2)],
          ['Maximo', calculatedStats.max.toFixed(2)],
          ['Rango', calculatedStats.range.toFixed(2)],
          ['Varianza Poblacional', calculatedStats.variance.toFixed(4)],
          ['Varianza Muestral', calculatedStats.varianceMuestral.toFixed(4)],
          ['Desv. Estandar Poblacional', calculatedStats.stdDev.toFixed(4)],
          ['Desv. Estandar Muestral', calculatedStats.stdDevMuestral.toFixed(4)],
          ['Coef. de Variacion', calculatedStats.cv.toFixed(2) + '%']
        ];

        pdf.setFontSize(10);
        statsData.forEach(([label, value]) => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.text(label + ':', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, margin + 60, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      setExportProgress('Agregando reporte IA...');

      // Reporte IA
      if (reports.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Reporte de Inteligencia Artificial', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Limpiar texto para PDF
        const reportText = cleanTextForPDF(reports[reports.length - 1].content);
        
        const splitReport = pdf.splitTextToSize(reportText, pageWidth - 2 * margin);
        
        splitReport.forEach(line => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
      }

      // Pie de página en todas las páginas
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          'EstadisticaMente - Pagina ' + i + ' de ' + totalPages,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      setExportProgress('Guardando PDF...');
      
      const fileName = cleanTextForPDF(currentProject.name).replace(/[^a-zA-Z0-9]/g, '_') + '_reporte.pdf';
      pdf.save(fileName);
      
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setLoading(false);
      setExportProgress('');
    }
  };

  const exportProject = () => {
    if (!currentProject) {
      toast.error('Seleccioná un proyecto primero');
      return;
    }

    const projectData = {
      name: currentProject.name,
      analysisType: currentProject.analysisType,
      description: currentProject.description,
      educationLevel: 'secundario',
      exportedAt: new Date().toISOString(),
      datasets: datasets.map(d => ({
        rawData: d.rawData,
        variables: d.variables,
        source: d.source
      }))
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_proyecto.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Proyecto exportado exitosamente');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Descargar'} educationLevel="secundario" />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Download className="w-8 h-8" />
              Descargar y Exportar
            </h1>
            <p className="text-purple-100">
              Exportá tus gráficos, tablas, estadísticos y reportes en formato PDF
            </p>
          </div>

          {/* Project Selector */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
            <Label className="text-sm font-bold mb-2 block">Seleccioná el Proyecto</Label>
            <Select value={selectedProject} onValueChange={handleProjectChange}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Seleccioná un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentProject && (
            <>
              {/* Project Summary */}
              <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
                <h2 className="text-xl font-bold text-purple-900 mb-4">📊 Resumen del Proyecto</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">
                      {datasets[0]?.variables?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Variables</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-indigo-900">
                      {datasets[0]?.rawData?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Registros</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Check className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">
                      {statistics.length > 0 ? 'Sí' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">Estadísticos</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-4 text-center">
                    <FileText className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-violet-900">
                      {reports.length > 0 ? 'Sí' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">Reporte IA</p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: '1200px', zIndex: -1 }}>
                  <div ref={chartRef} className="bg-white p-6 rounded-xl" style={{ width: 1200 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      {selectedChartType === 'pie' ? (
                        <PieChart>
                          <Pie data={chartData} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      ) : selectedChartType === 'line' || selectedChartType === 'polygon' || selectedChartType === 'cumulative' ? (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                          <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#6B21A8', fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey={selectedChartType === 'cumulative' ? 'acumulada' : 'cantidad'} stroke="#8B5CF6" strokeWidth={3} />
                        </LineChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                          <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#6B21A8', fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
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

              {/* Calculated Stats Preview */}
              {calculatedStats && (
                <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
                  <h2 className="text-xl font-bold text-purple-900 mb-4">📊 Estadisticos Calculados</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">Media</p>
                      <p className="text-lg font-bold text-purple-900">{calculatedStats.mean.toFixed(2)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">Mediana</p>
                      <p className="text-lg font-bold text-indigo-900">{calculatedStats.median.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">Desv. Est.</p>
                      <p className="text-lg font-bold text-blue-900">{calculatedStats.stdDev.toFixed(2)}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">CV</p>
                      <p className="text-lg font-bold text-violet-900">{calculatedStats.cv.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Export */}
                <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                      <FileText className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Exportar PDF Completo</h3>
                      <p className="text-sm text-gray-600">
                        Incluye datos, tablas de frecuencia, estadísticos y reporte IA
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={exportToPDF}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="export-pdf-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {exportProgress || 'Exportando...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Project Export */}
                <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <Database className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Exportar Proyecto</h3>
                      <p className="text-sm text-gray-600">
                        Archivo JSON con todos los datos para importar en otro dispositivo
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={exportProject}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    data-testid="export-project-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Proyecto (.json)
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">💡 Información sobre exportaciones</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <strong>PDF:</strong> Ideal para entregar trabajos prácticos o imprimir</li>
                  <li>• <strong>Proyecto JSON:</strong> Permite compartir el proyecto con compañeros o continuar en otra computadora</li>
                  <li>• Los gráficos se pueden exportar desde la sección "Gráficos" como imágenes</li>
                </ul>
              </div>
            </>
          )}

          {!currentProject && (
            <div className="bg-white rounded-2xl p-12 text-center border border-purple-100">
              <Download className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Seleccioná un proyecto
              </h3>
              <p className="text-gray-500">
                Elegí un proyecto de la lista para ver las opciones de exportación
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescargarSecundario;
