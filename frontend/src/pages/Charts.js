import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#4F46E5', '#F59E0B'];

const Charts = () => {
  const [educationLevel, setEducationLevel] = useState('secundario');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const level = localStorage.getItem('educationLevel') || 'secundario';
    setEducationLevel(level);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const loadDatasets = async (projectId) => {
    try {
      const response = await axios.get(`${API}/datasets/${projectId}`);
      setDatasets(response.data);
      
      if (response.data.length > 0) {
        setSelectedDataset(response.data[0]);
        processDataForChart(response.data[0]);
      }
    } catch (error) {
      console.error('Error cargando datasets:', error);
    }
  };

  const processDataForChart = (dataset) => {
    if (!dataset || !dataset.variables || dataset.variables.length === 0) {
      setChartData([]);
      return;
    }

    const variable = dataset.variables[0];
    
    const valueCounts = {};
    variable.values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });

    const processed = Object.entries(valueCounts).map(([name, value]) => ({
      name,
      value,
      cantidad: value
    }));

    setChartData(processed);
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    loadDatasets(projectId);
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-pink-300 mx-auto mb-4" />
            <p>Seleccioná un proyecto con datos para visualizar</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="name" stroke="#831843" style={{ fontSize: '14px', fontWeight: 500 }} />
              <YAxis stroke="#831843" style={{ fontSize: '14px', fontWeight: 500 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #DB2777',
                  borderRadius: '12px',
                  fontWeight: 600
                }} 
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Bar dataKey="cantidad" fill="#DB2777" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="name" stroke="#831843" style={{ fontSize: '14px', fontWeight: 500 }} />
              <YAxis stroke="#831843" style={{ fontSize: '14px', fontWeight: 500 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #DB2777',
                  borderRadius: '12px',
                  fontWeight: 600
                }} 
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Line 
                type="monotone" 
                dataKey="cantidad" 
                stroke="#DB2777" 
                strokeWidth={3}
                dot={{ fill: '#DB2777', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const chartTypes = [
    { value: 'bar', label: 'Gráfico de Barras', icon: BarChart3 },
    { value: 'line', label: 'Gráfico de Líneas', icon: TrendingUp },
    { value: 'pie', label: 'Gráfico Circular', icon: PieIcon }
  ];

  return (
    <div className="flex min-h-screen bg-pink-50">
      <Sidebar educationLevel={educationLevel} />
      
      <div className="flex-1 ml-64">
        <Navbar projectName="Gráficos" educationLevel={educationLevel} />
        
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-pink-900 mb-2">
              Crear Gráficos
            </h1>
            <p className="text-gray-600">
              Visualizá tus datos con gráficos interactivos
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 mb-6 border border-pink-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Proyecto</Label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger data-testid="chart-project-select">
                    <SelectValue placeholder="Seleccioná un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Gráfico</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger data-testid="chart-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="btn-primary w-full" data-testid="export-chart-button">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Gráfico
                </Button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="bg-white rounded-3xl p-8 border border-pink-100" data-testid="chart-display">
            <h3 className="text-2xl font-heading font-bold text-pink-900 mb-6">
              {chartTypes.find(t => t.value === chartType)?.label}
            </h3>
            {renderChart()}
          </div>

          {/* Statistics Summary */}
          {selectedDataset && chartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-2xl p-6 border border-pink-100">
                <p className="text-sm text-gray-600 mb-1">Total de Datos</p>
                <p className="text-3xl font-bold text-pink-900">
                  {chartData.reduce((sum, item) => sum + item.value, 0)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-pink-100">
                <p className="text-sm text-gray-600 mb-1">Categorías</p>
                <p className="text-3xl font-bold text-pink-900">{chartData.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-pink-100">
                <p className="text-sm text-gray-600 mb-1">Valor Máximo</p>
                <p className="text-3xl font-bold text-pink-900">
                  {Math.max(...chartData.map(d => d.value))}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-pink-100">
                <p className="text-sm text-gray-600 mb-1">Valor Mínimo</p>
                <p className="text-3xl font-bold text-pink-900">
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

export default Charts;
