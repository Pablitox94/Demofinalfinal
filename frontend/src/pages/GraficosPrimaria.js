import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { trackChartCreated } from '../utils/achievementTracker';
import localStorageService from '../services/localStorageService';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const GraficosPrimaria = () => {
  const getChartPreferenceKey = (projectId) => `chartPreference_primario_${projectId}`;
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const chartTracked = useRef(false);

  const emojiOptions = ['😊', '⭐', '❤️', '🎉', '🏆', '🎯', '🌟', '🔥', '👍', '🎈', '🦄', '🌈'];

  useEffect(() => {
    loadProjects();
    
    const handleStorageChange = (e) => {
      if (e.key === 'currentProjectId' && e.newValue) {
        setSelectedProject(e.newValue);
        loadDatasets(e.newValue);
      }
    };
    
    const handleProjectChange = (e) => {
      if (e.detail && e.detail !== selectedProject) {
        setSelectedProject(e.detail);
        loadDatasets(e.detail);
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
        const savedChartType = localStorage.getItem(getChartPreferenceKey(currentProjectId));
        if (savedChartType) setChartType(savedChartType);
        loadDatasets(currentProjectId);
      } else if (primaryProjects.length > 0) {
        const firstProject = primaryProjects[0].id;
        setSelectedProject(firstProject);
        const savedChartType = localStorage.getItem(getChartPreferenceKey(firstProject));
        if (savedChartType) setChartType(savedChartType);
        localStorage.setItem('currentProjectId', firstProject);
        loadDatasets(firstProject);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadDatasets = async (projectId) => {
    try {
      const projectDatasets = await localStorageService.getDatasets(projectId);
      setDatasets(projectDatasets);
      if (projectDatasets.length > 0) {
        processDataForChart(projectDatasets[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const processDataForChart = (dataset) => {
    if (!dataset.variables || dataset.variables.length === 0) return;

    const variable = dataset.variables[0];
    const values = variable.values;

    const counts = {};
    values.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });

    const data = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      porcentaje: Math.round((value / values.length) * 100)
    }));

    setChartData(data);
    
    if (!chartTracked.current && data.length > 0) {
      trackChartCreated(chartType);
      chartTracked.current = true;
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: projectId }));
    const savedChartType = localStorage.getItem(getChartPreferenceKey(projectId));
    if (savedChartType) setChartType(savedChartType);
    loadDatasets(projectId);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
    if (selectedProject) {
      localStorage.setItem(getChartPreferenceKey(selectedProject), type);
    }
    trackChartCreated(type);
  };

  const renderPictogram = () => {
    if (chartData.length === 0) return null;

    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-pink-200">
        <h3 className="text-2xl font-heading font-bold text-pink-600 mb-6 text-center">🎨 Pictograma</h3>
        <div className="space-y-4">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-32 text-right font-bold text-lg text-gray-700">{item.name}</div>
              <div className="flex-1 flex flex-wrap gap-1">
                {[...Array(item.value)].map((_, i) => (
                  <span key={i} className="text-3xl">{selectedEmoji}</span>
                ))}
              </div>
              <div className="w-16 text-left font-bold text-purple-600">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-gray-600">
          Cada {selectedEmoji} = 1 respuesta
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Gráficos" educationLevel="primario" />
        
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <h1 className="text-5xl font-heading font-black mb-2 flex items-center gap-3">
              <BarChart3 className="w-12 h-12" />¡Mis Gráficos!
            </h1>
            <p className="text-2xl font-accent">Mirá tus datos convertidos en gráficos coloridos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border-4 border-blue-200">
              <Label className="text-lg font-bold text-blue-700 mb-3 block">📁 Elegí tu Misión</Label>
              <Select value={selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger className="text-lg h-14"><SelectValue placeholder="Seleccionar misión" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-2xl p-6 border-4 border-purple-200">
              <Label className="text-lg font-bold text-purple-700 mb-3 block">📊 Tipo de Gráfico</Label>
              <Select value={chartType} onValueChange={handleChartTypeChange}>
                <SelectTrigger className="text-lg h-14"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">📊 Barras</SelectItem>
                  <SelectItem value="pie">🥧 Torta</SelectItem>
                  <SelectItem value="pictogram">🎨 Pictograma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chartType === 'pictogram' && (
              <div className="bg-white rounded-2xl p-6 border-4 border-pink-200">
                <Label className="text-lg font-bold text-pink-700 mb-3 block">😊 Elegí tu Emoji</Label>
                <Select value={selectedEmoji} onValueChange={setSelectedEmoji}>
                  <SelectTrigger className="text-lg h-14"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {emojiOptions.map(emoji => (
                      <SelectItem key={emoji} value={emoji}><span className="text-2xl">{emoji}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-4 border-gray-200">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-gray-600">Cargá datos en tu misión para ver gráficos</p>
            </div>
          ) : (
            <>
              {chartType === 'bar' && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-blue-200">
                  <h3 className="text-2xl font-heading font-bold text-blue-600 mb-6 text-center">📊 Gráfico de Barras</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 'bold' }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Cantidad" radius={[10, 10, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartType === 'pie' && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-purple-200">
                  <h3 className="text-2xl font-heading font-bold text-purple-600 mb-6 text-center">🥧 Gráfico de Torta</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" labelLine={true} label={({ name, porcentaje }) => `${name}: ${porcentaje}%`} outerRadius={150} fill="#8884d8" dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartType === 'pictogram' && renderPictogram()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraficosPrimaria;
