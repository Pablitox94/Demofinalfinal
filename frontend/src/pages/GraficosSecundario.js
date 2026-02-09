import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Plus, X, 
  Download, Grid3X3, Flame, LineChartIcon, LayoutGrid, Filter
} from 'lucide-react';
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
import html2canvas from 'html2canvas';
import localStorageService from '../services/localStorageService';

const COLORS = ['#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const GraficosSecundario = () => {
  const getChartPreferenceKey = (projectId) => `chartPreference_secundario_${projectId}`;
  const dashboardRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('');
  
  // Dashboard con múltiples gráficos
  const [dashboardCharts, setDashboardCharts] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState('📊');
  
  // Filtros cruzados
  const [activeFilters, setActiveFilters] = useState({});

  const chartTypes = [
    { value: 'bar', label: 'Barras Verticales', icon: '📊' },
    { value: 'barH', label: 'Barras Horizontales', icon: '📉' },
    { value: 'pie', label: 'Sectores (Torta)', icon: '🥧' },
    { value: 'line', label: 'Líneas', icon: '📈' },
    { value: 'area', label: 'Área', icon: '📐' },
    { value: 'histogram', label: 'Histograma', icon: '📊' },
    { value: 'polygon', label: 'Polígono de Frecuencias', icon: '📈' },
    { value: 'stackedBar', label: 'Barras Apiladas', icon: '📊' },
    { value: 'groupedBar', label: 'Barras Agrupadas', icon: '📊' },
    { value: 'scatter', label: 'Dispersión', icon: '⚫' },
    { value: 'pictogram', label: 'Pictograma', icon: '😊' },
    { value: 'cumulative', label: 'Línea Acumulada', icon: '📈' },
    { value: 'heatmap', label: 'Mapa de Calor', icon: '🔥' },
    { value: 'comparative', label: 'Comparativo', icon: '⚖️' }
  ];

  const emojiOptions = ['📊', '⭐', '❤️', '🎯', '🏆', '⚽', '📚', '🎮', '🌟', '🔥', '👍', '💯'];

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
      
      if (projectDatasets.length > 0) {
        const dataset = projectDatasets[0];
        setVariables(dataset.variables || []);
        
        if (dataset.variables && dataset.variables.length > 0) {
          setSelectedVariable(dataset.variables[0].name);
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
    
    // Aplicar filtros cruzados
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

    // Contar frecuencias
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

    // Calcular frecuencias acumuladas
    let cumulative = 0;
    processed.forEach(item => {
      cumulative += item.value;
      item.acumulada = cumulative;
    });

    setChartData(processed);
  }, []);

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
      emoji: selectedEmoji
    };

    setDashboardCharts([...dashboardCharts, newChart]);
    if (selectedProject) {
      localStorage.setItem(getChartPreferenceKey(selectedProject), chartType);
    }
    toast.success('Gráfico agregado al dashboard');
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
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `dashboard_${currentProject?.name || 'graficos'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Dashboard exportado como imagen');
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar dashboard');
    }
  };

  const renderChart = (chartType, data, chartId = null) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-purple-300 mx-auto mb-2" />
            <p>Sin datos para mostrar</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      onClick: (e) => e && handleChartClick(e.activePayload?.[0]?.payload)
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Bar 
                dataKey="cantidad" 
                fill="#8B5CF6" 
                radius={[8, 8, 0, 0]} 
                cursor="pointer"
                onClick={(data) => handleChartClick(data)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeFilters[selectedVariable] === entry.name ? '#6D28D9' : '#8B5CF6'}
                    opacity={activeFilters[selectedVariable] && activeFilters[selectedVariable] !== entry.name ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'barH':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis type="number" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#6B21A8', fontSize: 12 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Bar 
                dataKey="cantidad" 
                fill="#6366F1" 
                radius={[0, 8, 8, 0]} 
                cursor="pointer"
                onClick={(data) => handleChartClick(data)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeFilters[selectedVariable] === entry.name ? '#4338CA' : '#6366F1'}
                    opacity={activeFilters[selectedVariable] && activeFilters[selectedVariable] !== entry.name ? 0.4 : 1}
                  />
                ))}
              </Bar>
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
                fill="#8884d8"
                dataKey="value"
                cursor="pointer"
                onClick={(data) => handleChartClick(data)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    opacity={activeFilters[selectedVariable] && activeFilters[selectedVariable] !== entry.name ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Line type="monotone" dataKey="cantidad" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6, fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Area type="monotone" dataKey="cantidad" stroke="#8B5CF6" fill="#C4B5FD" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'histogram':
      case 'polygon':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              {chartType === 'histogram' && <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} />}
              <Line type="monotone" dataKey="cantidad" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'cumulative':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Line type="monotone" dataKey="acumulada" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} name="Frecuencia Acumulada" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        if (variables.length < 2) {
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Necesitás 2 variables para gráfico de dispersión</p>
            </div>
          );
        }
        
        const scatterData = datasets[0]?.rawData?.map((row, idx) => ({
          x: variables[0]?.values[idx],
          y: variables[1]?.values[idx],
          name: `Punto ${idx + 1}`
        })) || [];
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="x" name={variables[0]?.name} tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis dataKey="y" name={variables[1]?.name} tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Scatter name={`${variables[0]?.name} vs ${variables[1]?.name}`} data={scatterData} fill="#8B5CF6" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pictogram':
        const emoji = dashboardCharts.find(c => c.id === chartId)?.emoji || selectedEmoji;
        return (
          <div className="space-y-3 max-h-72 overflow-y-auto p-2">
            {data.map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-purple-50 rounded-xl p-4 cursor-pointer transition-all ${
                  activeFilters[selectedVariable] === item.name ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => handleChartClick(item)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-900">{item.name}</span>
                  <span className="text-purple-600 font-bold">{item.value}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array(Math.min(item.value, 20)).fill(0).map((_, i) => (
                    <span key={i} className="text-2xl">{emoji}</span>
                  ))}
                  {item.value > 20 && <span className="text-gray-500">+{item.value - 20} más</span>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'heatmap':
        if (variables.length < 2) {
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Necesitás 2 variables para mapa de calor</p>
            </div>
          );
        }

        // Crear matriz de calor
        const var1Values = [...new Set(variables[0]?.values || [])];
        const var2Values = [...new Set(variables[1]?.values || [])];
        const heatmapData = [];
        
        var1Values.forEach(v1 => {
          var2Values.forEach(v2 => {
            const count = datasets[0]?.rawData?.filter(
              (row, idx) => variables[0]?.values[idx] === v1 && variables[1]?.values[idx] === v2
            ).length || 0;
            heatmapData.push({ x: String(v1), y: String(v2), value: count });
          });
        });

        const maxVal = Math.max(...heatmapData.map(d => d.value));

        return (
          <div className="p-4 overflow-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${var2Values.length}, minmax(60px, 1fr))` }}>
              <div></div>
              {var2Values.map((v2, idx) => (
                <div key={idx} className="text-xs font-bold text-center text-purple-900 truncate p-1">
                  {String(v2)}
                </div>
              ))}
              {var1Values.map((v1, i) => (
                <React.Fragment key={i}>
                  <div className="text-xs font-bold text-purple-900 pr-2 flex items-center">{String(v1)}</div>
                  {var2Values.map((v2, j) => {
                    const cell = heatmapData.find(d => d.x === String(v1) && d.y === String(v2));
                    const intensity = maxVal > 0 ? (cell?.value || 0) / maxVal : 0;
                    return (
                      <div
                        key={j}
                        className="aspect-square rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-105"
                        style={{
                          backgroundColor: `rgba(139, 92, 246, ${0.1 + intensity * 0.9})`,
                          color: intensity > 0.5 ? 'white' : '#6B21A8'
                        }}
                        title={`${v1} x ${v2}: ${cell?.value || 0}`}
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

      case 'stackedBar':
      case 'groupedBar':
        if (variables.length < 2) {
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Necesitás múltiples variables para este gráfico</p>
            </div>
          );
        }

        const groupedData = [];
        const uniqueValues = [...new Set(variables[0]?.values || [])];
        uniqueValues.forEach(val => {
          const item = { name: String(val) };
          variables.forEach((v, idx) => {
            const count = v.values.filter((x, i) => variables[0].values[i] === val).length;
            item[v.name] = count;
          });
          groupedData.push(item);
        });

        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              {variables.slice(0, 3).map((v, idx) => (
                <Bar 
                  key={v.name} 
                  dataKey={v.name} 
                  fill={COLORS[idx]} 
                  stackId={chartType === 'stackedBar' ? 'stack' : undefined}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'comparative':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #8B5CF6' }} />
              <Legend />
              <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Frecuencia" />
              <Line type="monotone" dataKey="acumulada" stroke="#10B981" strokeWidth={2} name="Acumulada" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
              <XAxis dataKey="name" tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B21A8', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Gráficos'} educationLevel="secundario" />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                  <LayoutGrid className="w-8 h-8" />
                  Dashboard de Gráficos
                </h1>
                <p className="text-purple-100">
                  Visualizá hasta 4 gráficos simultáneos con filtros cruzados interactivos
                </p>
              </div>
              <Button 
                onClick={exportDashboard}
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                data-testid="export-dashboard"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Dashboard
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-bold mb-2 block">Proyecto</Label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger data-testid="project-select">
                    <SelectValue placeholder="Seleccioná un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-bold mb-2 block">Variable</Label>
                <Select value={selectedVariable} onValueChange={handleVariableChange}>
                  <SelectTrigger data-testid="variable-select">
                    <SelectValue placeholder="Seleccioná variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {variables.map(v => (
                      <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-bold mb-2 block">Emoji (Pictograma)</Label>
                <div className="flex gap-1 flex-wrap">
                  {emojiOptions.slice(0, 6).map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-2xl p-1 rounded-lg transition-all ${
                        selectedEmoji === emoji ? 'bg-purple-200 scale-110' : 'hover:bg-purple-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold mb-2 block">Filtros Activos</Label>
                {Object.keys(activeFilters).length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {Object.entries(activeFilters).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </span>
                    <button 
                      onClick={clearFilters}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Sin filtros</span>
                )}
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="bg-white rounded-2xl p-4 mb-6 border border-purple-100 shadow-sm">
            <Label className="text-sm font-bold mb-3 block">Agregar Gráfico al Dashboard (máx. 4)</Label>
            <div className="flex flex-wrap gap-2">
              {chartTypes.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => addChartToDashboard(ct.value)}
                  disabled={dashboardCharts.length >= 4}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    dashboardCharts.length >= 4
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                  data-testid={`add-chart-${ct.value}`}
                >
                  <span>{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Grid */}
          <div 
            ref={dashboardRef}
            className={`grid gap-4 ${
              dashboardCharts.length === 0 ? 'grid-cols-1' :
              dashboardCharts.length === 1 ? 'grid-cols-1' :
              dashboardCharts.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}
            data-testid="charts-dashboard"
          >
            {dashboardCharts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-purple-200 text-center">
                <Grid3X3 className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-purple-900 mb-2">Dashboard Vacío</h3>
                <p className="text-gray-600 mb-4">
                  Agregá gráficos usando los botones de arriba para crear tu dashboard personalizado
                </p>
                <p className="text-sm text-purple-600">
                  Hacé click en un gráfico para aplicar filtros cruzados
                </p>
              </div>
            ) : (
              dashboardCharts.map((chart) => (
                <div 
                  key={chart.id}
                  className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
                  data-testid={`chart-${chart.id}`}
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chartTypes.find(c => c.value === chart.type)?.icon}</span>
                      <span className="font-bold text-purple-900 text-sm">
                        {chartTypes.find(c => c.value === chart.type)?.label}
                      </span>
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                        {chart.variable}
                      </span>
                    </div>
                    <button
                      onClick={() => removeChartFromDashboard(chart.id)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="p-4">
                    {renderChart(chart.type, chartData, chart.id)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">Total de Datos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {chartData.reduce((sum, item) => sum + item.value, 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">Categorías</p>
                <p className="text-2xl font-bold text-purple-900">{chartData.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">Valor Máximo</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.max(...chartData.map(d => d.value))}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">Valor Mínimo</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.min(...chartData.map(d => d.value))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraficosSecundario;
