import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import { 
  BarChart3, Plus, X, Download, LayoutGrid, TrendingUp
} from 'lucide-react';
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
import html2canvas from 'html2canvas';
import localStorageService from '../services/localStorageService';

const COLORS = ['#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'];

const GraficosSuperior = () => {
  const getChartPreferenceKey = (projectId) => `chartPreference_superior_${projectId}`;
  const dashboardRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('');
  const [selectedVarX, setSelectedVarX] = useState('');
  const [selectedVarY, setSelectedVarY] = useState('');
  const [dashboardCharts, setDashboardCharts] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState('📊');
  const [activeFilters, setActiveFilters] = useState({});
  const [regressionLine, setRegressionLine] = useState(null);

  const chartTypes = [
    { value: 'bar', label: 'Barras Verticales', icon: '📊' },
    { value: 'barH', label: 'Barras Horizontales', icon: '📉' },
    { value: 'pie', label: 'Sectores', icon: '🥧' },
    { value: 'line', label: 'Líneas', icon: '📈' },
    { value: 'area', label: 'Área', icon: '📐' },
    { value: 'histogram', label: 'Histograma', icon: '📊' },
    { value: 'polygon', label: 'Polígono de Frecuencias', icon: '📈' },
    { value: 'scatter', label: 'Dispersión', icon: '⚫' },
    { value: 'scatterRegression', label: 'Dispersión + Regresión', icon: '📈' },
    { value: 'pictogram', label: 'Pictograma', icon: '😊' },
    { value: 'cumulative', label: 'Línea Acumulada', icon: '📈' },
    { value: 'heatmap', label: 'Mapa de Calor', icon: '🔥' },
    { value: 'stackedBar', label: 'Barras Apiladas', icon: '📊' },
    { value: 'comparative', label: 'Comparativo', icon: '⚖️' }
  ];

  const emojiOptions = ['📊', '⭐', '❤️', '🎯', '🏆', '💼', '📚', '🎓', '🌟', '🔥', '💡', '💯'];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject);
      loadDatasets(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const superiorProjects = await localStorageService.getProjects('superior');
      setProjects(superiorProjects);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (currentProjectId && superiorProjects.find(p => p.id === currentProjectId)) {
        setSelectedProject(currentProjectId);
      } else if (superiorProjects.length > 0) {
        setSelectedProject(superiorProjects[0].id);
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
      
      if (projectDatasets.length > 0) {
        const dataset = projectDatasets[0];
        setVariables(dataset.variables || []);
        
        if (dataset.variables && dataset.variables.length > 0) {
          setSelectedVariable(dataset.variables[0].name);
          if (dataset.variables.length >= 2) {
            setSelectedVarX(dataset.variables[0].name);
            setSelectedVarY(dataset.variables[1].name);
          }
          processDataForChart(dataset, dataset.variables[0].name);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const processDataForChart = useCallback((dataset, varName, filters = {}) => {
    if (!dataset || !dataset.variables) return;
    const variable = dataset.variables.find(v => v.name === varName);
    if (!variable) return;

    let values = [...variable.values];
    
    if (Object.keys(filters).length > 0) {
      const indices = [];
      values.forEach((_, idx) => {
        let passFilters = true;
        for (const [filterVar, filterVal] of Object.entries(filters)) {
          const fv = dataset.variables.find(v => v.name === filterVar);
          if (fv && fv.values[idx] !== filterVal) {
            passFilters = false;
            break;
          }
        }
        if (passFilters) indices.push(idx);
      });
      values = indices.map(i => variable.values[i]);
    }

    const valueCounts = {};
    values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });

    const processed = Object.entries(valueCounts)
      .map(([name, value]) => ({
        name: String(name),
        value,
        cantidad: value
      }))
      .sort((a, b) => {
        const numA = parseFloat(a.name);
        const numB = parseFloat(b.name);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.name.localeCompare(b.name);
      });

    let cumulative = 0;
    processed.forEach(item => {
      cumulative += item.value;
      item.acumulada = cumulative;
    });

    setChartData(processed);
    
    // Calcular línea de regresión si hay dos variables
    if (selectedVarX && selectedVarY) {
      calculateRegressionLine();
    }
  }, [selectedVarX, selectedVarY]);

  const calculateRegressionLine = () => {
    if (!datasets.length || !selectedVarX || !selectedVarY) return;
    
    const varX = variables.find(v => v.name === selectedVarX);
    const varY = variables.find(v => v.name === selectedVarY);
    
    if (!varX || !varY) return;
    
    const xValues = varX.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const yValues = varY.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    const n = Math.min(xValues.length, yValues.length);
    if (n < 2) return;
    
    const xSlice = xValues.slice(0, n);
    const ySlice = yValues.slice(0, n);
    
    const sumX = xSlice.reduce((a, b) => a + b, 0);
    const sumY = ySlice.reduce((a, b) => a + b, 0);
    const sumXY = xSlice.reduce((acc, x, i) => acc + x * ySlice[i], 0);
    const sumX2 = xSlice.reduce((acc, x) => acc + x * x, 0);
    
    const b1 = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b0 = sumY / n - b1 * sumX / n;
    
    const minX = Math.min(...xSlice);
    const maxX = Math.max(...xSlice);
    
    setRegressionLine({
      b0, b1,
      points: [
        { x: minX, y: b0 + b1 * minX },
        { x: maxX, y: b0 + b1 * maxX }
      ]
    });
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);
    setDashboardCharts([]);
    setActiveFilters({});
  };

  const handleVariableChange = (varName) => {
    setSelectedVariable(varName);
    if (datasets.length > 0) {
      processDataForChart(datasets[0], varName, activeFilters);
    }
  };

  const addChartToDashboard = (chartType) => {
    if (dashboardCharts.length >= 4) {
      toast.error('Máximo 4 gráficos en el dashboard');
      return;
    }
    const newChart = {
      id: Date.now(),
      type: chartType,
      variable: selectedVariable,
      varX: selectedVarX,
      varY: selectedVarY,
      emoji: selectedEmoji
    };
    setDashboardCharts([...dashboardCharts, newChart]);
    if (selectedProject) {
      localStorage.setItem(getChartPreferenceKey(selectedProject), chartType);
    }
    toast.success('Gráfico agregado');
  };

  const removeChartFromDashboard = (chartId) => {
    setDashboardCharts(dashboardCharts.filter(c => c.id !== chartId));
  };

  const handleChartClick = (data) => {
    if (!data || !data.name) return;
    const newFilters = { ...activeFilters };
    if (newFilters[selectedVariable] === data.name) {
      delete newFilters[selectedVariable];
    } else {
      newFilters[selectedVariable] = data.name;
    }
    setActiveFilters(newFilters);
    if (datasets.length > 0) {
      processDataForChart(datasets[0], selectedVariable, newFilters);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    if (datasets.length > 0) {
      processDataForChart(datasets[0], selectedVariable, {});
    }
  };

  const exportDashboard = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `dashboard_${currentProject?.name || 'graficos'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Dashboard exportado');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const renderChart = (chartType, data, chartId = null) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
            <p>Sin datos para mostrar</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #10B981' }} />
              <Legend />
              <Bar dataKey="cantidad" fill="#10B981" radius={[8, 8, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'barH':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis type="number" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#065F46', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #14B8A6' }} />
              <Bar dataKey="cantidad" fill="#14B8A6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #10B981' }} />
              <Legend />
              <Line type="monotone" dataKey="cantidad" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'scatter':
      case 'scatterRegression':
        if (variables.length < 2) {
          return <div className="flex items-center justify-center h-full text-gray-500">Necesitás 2 variables</div>;
        }
        
        const scatterData = datasets[0]?.rawData?.map((row, idx) => ({
          x: parseFloat(variables.find(v => v.name === selectedVarX)?.values[idx]),
          y: parseFloat(variables.find(v => v.name === selectedVarY)?.values[idx])
        })).filter(d => !isNaN(d.x) && !isNaN(d.y)) || [];
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="x" name={selectedVarX} tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis dataKey="y" name={selectedVarY} tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={`${selectedVarX} vs ${selectedVarY}`} data={scatterData} fill="#10B981" />
              {chartType === 'scatterRegression' && regressionLine && (
                <ReferenceLine
                  segment={regressionLine.points}
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'histogram':
      case 'polygon':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {chartType === 'histogram' && <Bar dataKey="cantidad" fill="#10B981" />}
              <Line type="monotone" dataKey="cantidad" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'cumulative':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="acumulada" stroke="#06B6D4" strokeWidth={3} name="Frecuencia Acumulada" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cantidad" stroke="#10B981" fill="#A7F3D0" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pictogram':
        const emoji = dashboardCharts.find(c => c.id === chartId)?.emoji || selectedEmoji;
        return (
          <div className="space-y-3 max-h-72 overflow-y-auto p-2">
            {data.map((item, idx) => (
              <div key={idx} className="bg-emerald-50 rounded-xl p-4 cursor-pointer" onClick={() => handleChartClick(item)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-900">{item.name}</span>
                  <span className="text-emerald-600 font-bold">{item.value}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array(Math.min(item.value, 20)).fill(0).map((_, i) => (
                    <span key={i} className="text-2xl">{emoji}</span>
                  ))}
                  {item.value > 20 && <span className="text-gray-500">+{item.value - 20}</span>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'heatmap':
        if (variables.length < 2) {
          return <div className="flex items-center justify-center h-full text-gray-500">Necesitás 2 variables</div>;
        }
        const var1Values = [...new Set(variables[0]?.values || [])].slice(0, 10);
        const var2Values = [...new Set(variables[1]?.values || [])].slice(0, 10);
        const heatmapData = [];
        var1Values.forEach(v1 => {
          var2Values.forEach(v2 => {
            const count = datasets[0]?.rawData?.filter(
              (_, idx) => variables[0]?.values[idx] === v1 && variables[1]?.values[idx] === v2
            ).length || 0;
            heatmapData.push({ x: String(v1), y: String(v2), value: count });
          });
        });
        const maxVal = Math.max(...heatmapData.map(d => d.value));
        return (
          <div className="p-4 overflow-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${var2Values.length}, minmax(50px, 1fr))` }}>
              <div></div>
              {var2Values.map((v2, idx) => (
                <div key={idx} className="text-xs font-bold text-center text-emerald-900 truncate p-1">{String(v2)}</div>
              ))}
              {var1Values.map((v1, i) => (
                <React.Fragment key={i}>
                  <div className="text-xs font-bold text-emerald-900 pr-2">{String(v1)}</div>
                  {var2Values.map((v2, j) => {
                    const cell = heatmapData.find(d => d.x === String(v1) && d.y === String(v2));
                    const intensity = maxVal > 0 ? (cell?.value || 0) / maxVal : 0;
                    return (
                      <div
                        key={j}
                        className="aspect-square rounded flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${0.1 + intensity * 0.9})`,
                          color: intensity > 0.5 ? 'white' : '#065F46'
                        }}
                      >
                        {cell?.value || 0}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        );

      case 'comparative':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
              <XAxis dataKey="name" tick={{ fill: '#065F46', fontSize: 11 }} />
              <YAxis tick={{ fill: '#065F46', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#10B981" name="Frecuencia" />
              <Line type="monotone" dataKey="acumulada" stroke="#06B6D4" strokeWidth={2} name="Acumulada" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <SidebarSuperior />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Gráficos'} educationLevel="superior" />
        
        <div className="p-6">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                  <LayoutGrid className="w-8 h-8" />
                  Dashboard de Visualización
                </h1>
                <p className="text-emerald-100">
                  Gráficos profesionales con filtros cruzados y líneas de regresión
                </p>
              </div>
              <Button onClick={exportDashboard} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-sm font-bold mb-2 block">Proyecto</Label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger><SelectValue placeholder="Proyecto" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-bold mb-2 block">Variable</Label>
                <Select value={selectedVariable} onValueChange={handleVariableChange}>
                  <SelectTrigger><SelectValue placeholder="Variable" /></SelectTrigger>
                  <SelectContent>
                    {variables.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-bold mb-2 block">Variable X</Label>
                <Select value={selectedVarX} onValueChange={setSelectedVarX}>
                  <SelectTrigger><SelectValue placeholder="Var X" /></SelectTrigger>
                  <SelectContent>
                    {variables.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-bold mb-2 block">Variable Y</Label>
                <Select value={selectedVarY} onValueChange={setSelectedVarY}>
                  <SelectTrigger><SelectValue placeholder="Var Y" /></SelectTrigger>
                  <SelectContent>
                    {variables.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-bold mb-2 block">Emoji</Label>
                <div className="flex gap-1 flex-wrap">
                  {emojiOptions.slice(0, 6).map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-xl p-1 rounded ${selectedEmoji === emoji ? 'bg-emerald-200' : 'hover:bg-emerald-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {Object.keys(activeFilters).length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Filtros:</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {Object.entries(activeFilters).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </span>
                <button onClick={clearFilters} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 mb-6 border border-emerald-100 shadow-sm">
            <Label className="text-sm font-bold mb-3 block">Agregar Gráfico (máx. 4)</Label>
            <div className="flex flex-wrap gap-2">
              {chartTypes.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => addChartToDashboard(ct.value)}
                  disabled={dashboardCharts.length >= 4}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${
                    dashboardCharts.length >= 4
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  <span>{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div 
            ref={dashboardRef}
            className={`grid gap-4 ${
              dashboardCharts.length <= 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {dashboardCharts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-emerald-200 text-center">
                <LayoutGrid className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Dashboard Vacío</h3>
                <p className="text-gray-600">Agregá gráficos usando los botones de arriba</p>
              </div>
            ) : (
              dashboardCharts.map((chart) => (
                <div key={chart.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chartTypes.find(c => c.value === chart.type)?.icon}</span>
                      <span className="font-bold text-emerald-900 text-sm">{chartTypes.find(c => c.value === chart.type)?.label}</span>
                    </div>
                    <button onClick={() => removeChartFromDashboard(chart.id)} className="p-1 hover:bg-red-100 rounded-lg">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="p-4">{renderChart(chart.type, chartData, chart.id)}</div>
                </div>
              ))
            )}
          </div>

          {chartData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-emerald-900">{chartData.reduce((sum, item) => sum + item.value, 0)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Categorías</p>
                <p className="text-2xl font-bold text-emerald-900">{chartData.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Máximo</p>
                <p className="text-2xl font-bold text-emerald-900">{Math.max(...chartData.map(d => d.value))}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                <p className="text-2xl font-bold text-emerald-900">{Math.min(...chartData.map(d => d.value))}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraficosSuperior;
