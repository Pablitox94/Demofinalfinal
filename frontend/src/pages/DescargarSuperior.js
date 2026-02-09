import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, FileText, Database, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import SidebarSuperior from '../components/SidebarSuperior';
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
const COLORS = ['#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A', '#10B981', '#059669', '#047857'];

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

const DescargarSuperior = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [chartData, setChartData] = useState([]);
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const chartRef = useRef(null);

  const getChartPreferenceKey = (projectId) => `chartPreference_superior_${projectId}`;

  useEffect(() => {
    loadProjects();
    const currentProjectId = localStorage.getItem('currentProjectId');
    if (currentProjectId) setSelectedProject(currentProjectId);
  }, []);

  useEffect(() => {
    if (selectedProject) loadAllProjectData(selectedProject);
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data.filter(p => p.educationLevel === 'superior'));
    } catch (error) {
      console.error('Error backend, usando datos locales:', error);
      const superiorProjects = await localStorageService.getProjects('superior');
      setProjects(superiorProjects);
    }
  };

  const loadAllProjectData = async (projectId) => {
    try {
      setSelectedChartType(localStorage.getItem(getChartPreferenceKey(projectId)) || 'bar');
      const [projectRes, datasetsRes, reportsRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`),
        axios.get(`${API}/datasets/${projectId}`),
        axios.get(`${API}/reports/${projectId}`)
      ]);
      setCurrentProject(projectRes.data);
      setDatasets(datasetsRes.data);
      setReports(reportsRes.data);

      // Preparar datos para gráfico y estadísticos
      if (datasetsRes.data.length > 0 && datasetsRes.data[0].variables) {
        const variable = datasetsRes.data[0].variables[0];
        if (variable && variable.values) {
          // Crear tabla de frecuencias
          const valueCounts = {};
          variable.values.forEach(val => {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
          });
          
          const processed = Object.entries(valueCounts).map(([name, value]) => ({
            name: String(name),
            cantidad: value
          }));
          let cumulative = 0;
          processed.forEach(item => {
            cumulative += item.cantidad;
            item.acumulada = cumulative;
          });
          setChartData(processed);

          // Calcular estadísticos avanzados
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
            const errorEstandar = stdDevMuestral / Math.sqrt(n);

            // Cuartiles
            const q1 = sorted[Math.floor(n * 0.25)];
            const q3 = sorted[Math.floor(n * 0.75)];
            const iqr = q3 - q1;

            setCalculatedStats({
              n, mean, median, variance, varianceMuestral, stdDev, stdDevMuestral, 
              min, max, range, cv, errorEstandar, q1, q3, iqr
            });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const exportToPDF = async () => {
    if (!currentProject) {
      toast.error('Seleccioná un proyecto');
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

      // Header
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EstadisticaMente - Nivel Superior', margin, 25);
      
      yPosition = 50;
      pdf.setTextColor(0, 0, 0);

      // Project info
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanTextForPDF(currentProject.name), margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Tipo: ' + cleanTextForPDF(currentProject.analysisType), margin, yPosition);
      yPosition += 6;
      pdf.text('Fecha: ' + new Date().toLocaleDateString('es-AR'), margin, yPosition);
      yPosition += 15;

      setExportProgress('Agregando datos...');

      // Data
      if (datasets.length > 0 && datasets[0].variables) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Datos del Proyecto', margin, yPosition);
        yPosition += 8;

        datasets[0].variables.forEach(variable => {
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
          const valuesText = variable.values.slice(0, 25).map(v => cleanTextForPDF(String(v))).join(', ') + (variable.values.length > 25 ? '...' : '');
          const splitValues = pdf.splitTextToSize(valuesText, pageWidth - 2 * margin);
          pdf.text(splitValues, margin, yPosition);
          yPosition += splitValues.length * 4 + 6;
        });
      }

      setExportProgress('Capturando grafico...');

      // Capture chart
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
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, 70));
          yPosition += Math.min(imgHeight, 70) + 10;
        } catch (chartError) {
          console.error('Error capturando grafico:', chartError);
        }
      }

      setExportProgress('Agregando estadisticos...');

      // Statistics
      if (calculatedStats) {
        if (yPosition > pageHeight - 70) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Estadisticos Descriptivos', margin, yPosition);
        yPosition += 10;

        const statsData = [
          ['n (tamanio muestral)', calculatedStats.n.toString()],
          ['Media aritmetica', calculatedStats.mean.toFixed(4)],
          ['Mediana', calculatedStats.median.toFixed(4)],
          ['Minimo', calculatedStats.min.toFixed(2)],
          ['Maximo', calculatedStats.max.toFixed(2)],
          ['Rango', calculatedStats.range.toFixed(2)],
          ['Varianza poblacional', calculatedStats.variance.toFixed(4)],
          ['Varianza muestral', calculatedStats.varianceMuestral.toFixed(4)],
          ['Desviacion estandar (S)', calculatedStats.stdDevMuestral.toFixed(4)],
          ['Error estandar', calculatedStats.errorEstandar.toFixed(4)],
          ['Coeficiente de variacion', calculatedStats.cv.toFixed(2) + '%'],
          ['Cuartil 1 (Q1)', calculatedStats.q1.toFixed(2)],
          ['Cuartil 3 (Q3)', calculatedStats.q3.toFixed(2)],
          ['Rango intercuartilico (IQR)', calculatedStats.iqr.toFixed(2)]
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
          pdf.text(value, margin + 65, yPosition);
          yPosition += 5.5;
        });
        yPosition += 8;
      }

      setExportProgress('Agregando reporte IA...');

      // Report
      if (reports.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Reporte de Analisis (IA)', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
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

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('EstadisticaMente - Nivel Superior | Pagina ' + i + ' de ' + totalPages, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      setExportProgress('Guardando PDF...');
      pdf.save(cleanTextForPDF(currentProject.name).replace(/[^a-zA-Z0-9]/g, '_') + '_reporte_academico.pdf');
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setLoading(false);
      setExportProgress('');
    }
  };

  const exportProject = () => {
    if (!currentProject) {
      toast.error('Seleccioná un proyecto');
      return;
    }

    const projectData = {
      name: currentProject.name,
      analysisType: currentProject.analysisType,
      description: currentProject.description,
      educationLevel: 'superior',
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
    toast.success('Proyecto exportado');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <SidebarSuperior />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Descargar'} educationLevel="superior" />
        
        <div className="p-6">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Download className="w-8 h-8" />
              Descargar y Exportar
            </h1>
            <p className="text-emerald-100">Exportá tu análisis completo en formato PDF académico</p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm">
            <Label className="text-sm font-bold mb-2 block">Seleccioná el Proyecto</Label>
            <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); localStorage.setItem('currentProjectId', v); }}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Proyecto" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {currentProject && (
            <>
              <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm">
                <h2 className="text-xl font-bold text-emerald-900 mb-4">📊 Resumen</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <Database className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-900">{datasets[0]?.variables?.length || 0}</p>
                    <p className="text-sm text-gray-600">Variables</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <FileText className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-teal-900">{datasets[0]?.rawData?.length || 0}</p>
                    <p className="text-sm text-gray-600">Registros</p>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-4 text-center">
                    <Check className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-cyan-900">{reports.length > 0 ? 'Sí' : 'No'}</p>
                    <p className="text-sm text-gray-600">Reporte IA</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{currentProject.analysisType}</p>
                    <p className="text-sm text-gray-600">Tipo</p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="sr-only" aria-hidden="true">
                  <div ref={chartRef} className="bg-white p-4 rounded-xl" style={{ width: 900 }}>
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
                          <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey={selectedChartType === 'cumulative' ? 'acumulada' : 'cantidad'} stroke="#10B981" strokeWidth={3} />
                        </LineChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
                          <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
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

              {/* Stats Preview */}
              {calculatedStats && (
                <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm">
                  <h2 className="text-xl font-bold text-emerald-900 mb-4">📐 Estadisticos Descriptivos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">n</p>
                      <p className="text-lg font-bold text-emerald-900">{calculatedStats.n}</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">Media</p>
                      <p className="text-lg font-bold text-teal-900">{calculatedStats.mean.toFixed(2)}</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">Mediana</p>
                      <p className="text-lg font-bold text-cyan-900">{calculatedStats.median.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">S (Desv.Est.)</p>
                      <p className="text-lg font-bold text-blue-900">{calculatedStats.stdDevMuestral.toFixed(2)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-600">CV</p>
                      <p className="text-lg font-bold text-indigo-900">{calculatedStats.cv.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                      <FileText className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">PDF Académico</h3>
                      <p className="text-sm text-gray-600">Documento completo con datos, estadísticos y reporte</p>
                    </div>
                  </div>
                  <Button onClick={exportToPDF} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{exportProgress}</> : <><Download className="w-4 h-4 mr-2" />Descargar PDF</>}
                  </Button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Database className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Exportar Proyecto</h3>
                      <p className="text-sm text-gray-600">Archivo JSON para compartir o respaldar</p>
                    </div>
                  </div>
                  <Button onClick={exportProject} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar (.json)
                  </Button>
                </div>
              </div>
            </>
          )}

          {!currentProject && (
            <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100">
              <Download className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Seleccioná un proyecto</h3>
              <p className="text-gray-500">Elegí un proyecto para ver las opciones de exportación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescargarSuperior;
