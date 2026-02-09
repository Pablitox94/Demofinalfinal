import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, TrendingUp, BarChart3, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

const AnalisisSecundario = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('');
  
  // Tabla de frecuencia
  const [freqTableType, setFreqTableType] = useState('simple');
  const [numIntervals, setNumIntervals] = useState(5);
  const [useSturgess, setUseSturgess] = useState(false);
  const [frequencyTable, setFrequencyTable] = useState([]);
  
  // Estadísticos
  const [basicStats, setBasicStats] = useState(null);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [advancedStats, setAdvancedStats] = useState({});
  const [percentileValue, setPercentileValue] = useState(50);
  const [decileValue, setDecileValue] = useState(5);
  const [quartileValue, setQuartileValue] = useState(2);

  const getAnalysisStorageKey = useCallback((projectId, variableName) => {
    if (!projectId || !variableName) return null;
    return `analysisSecundario:${projectId}:${variableName}`;
  }, []);

  useEffect(() => {
    loadProjects();
    const currentProjectId = localStorage.getItem('currentProjectId');
    if (currentProjectId) {
      setSelectedProject(currentProjectId);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject);
      loadDatasets(selectedProject);
    }
  }, [selectedProject]);

 useEffect(() => {
    const storageKey = getAnalysisStorageKey(selectedProject, selectedVariable);
    if (!storageKey) return;

    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsedState = JSON.parse(savedState);
      if (parsedState.advancedStats) {
        setAdvancedStats(parsedState.advancedStats);
      }
      if (parsedState.basicStats) {
        setBasicStats(parsedState.basicStats);
      }
      if (parsedState.frequencyTable) {
        setFrequencyTable(parsedState.frequencyTable);
      }
      if (parsedState.freqTableType) {
        setFreqTableType(parsedState.freqTableType);
      }
      if (typeof parsedState.numIntervals === 'number') {
        setNumIntervals(parsedState.numIntervals);
      }
      if (typeof parsedState.useSturgess === 'boolean') {
        setUseSturgess(parsedState.useSturgess);
      }
      if (typeof parsedState.percentileValue === 'number') {
        setPercentileValue(parsedState.percentileValue);
      }
      if (typeof parsedState.decileValue === 'number') {
        setDecileValue(parsedState.decileValue);
      }
      if (typeof parsedState.quartileValue === 'number') {
        setQuartileValue(parsedState.quartileValue);
      }
      if (typeof parsedState.showAdvancedStats === 'boolean') {
        setShowAdvancedStats(parsedState.showAdvancedStats);
      }
    } catch (error) {
      console.error('Error al leer el estado guardado:', error);
    }
  }, [getAnalysisStorageKey, selectedProject, selectedVariable]);

  useEffect(() => {
    const storageKey = getAnalysisStorageKey(selectedProject, selectedVariable);
    if (!storageKey) return;

    const stateToPersist = {
      advancedStats,
      basicStats,
      frequencyTable,
      freqTableType,
      numIntervals,
      useSturgess,
      percentileValue,
      decileValue,
      quartileValue,
      showAdvancedStats
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
  }, [
    advancedStats,
    basicStats,
    decileValue,
    freqTableType,
    frequencyTable,
    getAnalysisStorageKey,
    numIntervals,
    percentileValue,
    quartileValue,
    selectedProject,
    selectedVariable,
    showAdvancedStats,
    useSturgess
  ]);

  const loadProjects = async () => {
    try {
      const secundarioProjects = await localStorageService.getProjects('secundario');
      setProjects(secundarioProjects);
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
          calculateAll(dataset.variables[0]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateAll = useCallback((variable) => {
    if (!variable || !variable.values) return;
    
    calculateFrequencyTable(variable);
    calculateBasicStatistics(variable);
  }, [freqTableType, numIntervals, useSturgess]);

  const calculateFrequencyTable = (variable) => {
    const values = variable.values;
    const isNumeric = values.every(v => !isNaN(parseFloat(v)));
    const n = values.length;

    if (freqTableType === 'simple' || !isNumeric) {
      // Tabla simple
      const counts = {};
      values.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });

      let cumAbsolute = 0;
      let cumRelative = 0;
      
      const table = Object.entries(counts)
        .sort((a, b) => {
          const numA = parseFloat(a[0]);
          const numB = parseFloat(b[0]);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a[0].localeCompare(b[0]);
        })
        .map(([value, freq]) => {
          cumAbsolute += freq;
          const relative = freq / n;
          cumRelative += relative;
          return {
            valor: value,
            fi: freq,
            fri: relative,
            pi: relative * 100,
            Fi: cumAbsolute,
            Fri: cumRelative,
            Pi: cumRelative * 100
          };
        });

      setFrequencyTable(table);
    } else {
      // Tabla agrupada
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
      // Calcular número de intervalos
      let k = numIntervals;
      if (useSturgess) {
        k = Math.ceil(1 + 3.322 * Math.log10(n));
      }
      
      const amplitude = (max - min) / k;
      const intervals = [];
      
      for (let i = 0; i < k; i++) {
        const lowerBound = min + (i * amplitude);
        const upperBound = min + ((i + 1) * amplitude);
        intervals.push({
          li: lowerBound,
          ls: upperBound,
          xi: (lowerBound + upperBound) / 2  // Marca de clase
        });
      }

      let cumAbsolute = 0;
      let cumRelative = 0;

      const table = intervals.map((interval, idx) => {
        const freq = numericValues.filter(v => {
          if (idx === k - 1) {
            return v >= interval.li && v <= interval.ls;
          }
          return v >= interval.li && v < interval.ls;
        }).length;
        
        cumAbsolute += freq;
        const relative = freq / n;
        cumRelative += relative;

        return {
          intervalo: `[${interval.li.toFixed(2)} - ${interval.ls.toFixed(2)})`,
          xi: interval.xi.toFixed(2),
          fi: freq,
          fri: relative,
          pi: relative * 100,
          Fi: cumAbsolute,
          Fri: cumRelative,
          Pi: cumRelative * 100
        };
      });

      setFrequencyTable(table);
    }
  };

  const calculateBasicStatistics = (variable) => {
    const values = variable.values;
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (numericValues.length === 0) {
      // Solo moda para variables cualitativas
      const counts = {};
      values.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });
      const maxFreq = Math.max(...Object.values(counts));
      const modes = Object.entries(counts)
        .filter(([_, freq]) => freq === maxFreq)
        .map(([val]) => val);
      
      setBasicStats({
        moda: modes.join(', '),
        n: values.length
      });
      return;
    }

    const n = numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    
    // Media
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    // Mediana
    const median = n % 2 === 0
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2
      : sorted[Math.floor(n/2)];
    
    // Moda
    const counts = {};
    numericValues.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(counts));
    const modes = Object.entries(counts)
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => parseFloat(val));
    
    // Min y Max
    const min = sorted[0];
    const max = sorted[n - 1];
    
    setBasicStats({
      n,
      media: mean,
      mediana: median,
      moda: modes.length === n ? 'Sin moda' : modes.join(', '),
      minimo: min,
      maximo: max
    });
  };

  const calculateAdvancedStat = (type) => {
    const variable = variables.find(v => v.name === selectedVariable);
    if (!variable) return;

    const numericValues = variable.values
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    
    if (numericValues.length === 0) {
      toast.error('Se necesitan datos numéricos para este cálculo');
      return;
    }

    const n = numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mean = numericValues.reduce((a, b) => a + b, 0) / n;

    switch (type) {
      case 'dispersion':
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const range = sorted[n - 1] - sorted[0];
        const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;
        
        setAdvancedStats(prev => ({
          ...prev,
          varianza: variance,
          desviacionEstandar: stdDev,
          rango: range,
          coeficienteVariacion: cv
        }));
        toast.success('Medidas de dispersión calculadas');
        break;

      case 'percentile':
        const pIndex = (percentileValue / 100) * (n - 1);
        const pLower = Math.floor(pIndex);
        const pFrac = pIndex - pLower;
        const percentile = sorted[pLower] + pFrac * (sorted[Math.min(pLower + 1, n - 1)] - sorted[pLower]);
        
        setAdvancedStats(prev => ({
          ...prev,
          [`percentil_${percentileValue}`]: percentile
        }));
        toast.success(`Percentil ${percentileValue} calculado`);
        break;

      case 'decile':
        const dIndex = (decileValue / 10) * (n - 1);
        const dLower = Math.floor(dIndex);
        const dFrac = dIndex - dLower;
        const decile = sorted[dLower] + dFrac * (sorted[Math.min(dLower + 1, n - 1)] - sorted[dLower]);
        
        setAdvancedStats(prev => ({
          ...prev,
          [`decil_${decileValue}`]: decile
        }));
        toast.success(`Decil ${decileValue} calculado`);
        break;

      case 'quartile':
        const qIndex = (quartileValue / 4) * (n - 1);
        const qLower = Math.floor(qIndex);
        const qFrac = qIndex - qLower;
        const quartile = sorted[qLower] + qFrac * (sorted[Math.min(qLower + 1, n - 1)] - sorted[qLower]);
        
        setAdvancedStats(prev => ({
          ...prev,
          [`cuartil_${quartileValue}`]: quartile
        }));
        toast.success(`Cuartil ${quartileValue} calculado`);
        break;

      default:
        break;
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    localStorage.setItem('currentProjectId', projectId);

  };

  const handleVariableChange = (varName) => {
    setSelectedVariable(varName);
    const variable = variables.find(v => v.name === varName);
    if (variable) {
      calculateAll(variable);
    }

  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Análisis'} educationLevel="secundario" />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              Análisis Estadístico
            </h1>
            <p className="text-purple-100">
              Tablas de frecuencia y cálculo de medidas estadísticas
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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

              <div>
                <Label className="text-sm font-bold mb-2 block">Variable</Label>
                <Select value={selectedVariable} onValueChange={handleVariableChange}>
                  <SelectTrigger>
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
                <Label className="text-sm font-bold mb-2 block">Tipo de Tabla</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFreqTableType('simple');
                      const variable = variables.find(v => v.name === selectedVariable);
                      if (variable) calculateFrequencyTable(variable);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      freqTableType === 'simple'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Simples
                  </button>
                  <button
                    onClick={() => {
                      setFreqTableType('agrupada');
                      const variable = variables.find(v => v.name === selectedVariable);
                      if (variable) calculateFrequencyTable(variable);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      freqTableType === 'agrupada'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Agrupados
                  </button>
                </div>
              </div>
            </div>

            {freqTableType === 'agrupada' && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useSturgess}
                    onChange={(e) => {
                      setUseSturgess(e.target.checked);
                      const variable = variables.find(v => v.name === selectedVariable);
                      if (variable) setTimeout(() => calculateFrequencyTable(variable), 0);
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Regla de Sturges</span>
                </label>
                {!useSturgess && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Intervalos:</Label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={numIntervals}
                      onChange={(e) => {
                        setNumIntervals(parseInt(e.target.value) || 5);
                        const variable = variables.find(v => v.name === selectedVariable);
                        if (variable) setTimeout(() => calculateFrequencyTable(variable), 0);
                      }}
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla de Frecuencia */}
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tabla de Frecuencias
                </h2>
              </div>
              <div className="p-4 overflow-x-auto">
                {frequencyTable.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-100">
                        <th className="px-3 py-2 text-left font-bold text-purple-900">
                          {freqTableType === 'agrupada' ? 'Intervalo' : 'Valor'}
                        </th>
                        {freqTableType === 'agrupada' && (
                          <th className="px-3 py-2 text-center font-bold text-purple-900">xi</th>
                        )}
                        <th className="px-3 py-2 text-center font-bold text-purple-900">fi</th>
                        <th className="px-3 py-2 text-center font-bold text-purple-900">fri</th>
                        <th className="px-3 py-2 text-center font-bold text-purple-900">%</th>
                        <th className="px-3 py-2 text-center font-bold text-purple-900">Fi</th>
                        <th className="px-3 py-2 text-center font-bold text-purple-900">Fri</th>
                        <th className="px-3 py-2 text-center font-bold text-purple-900">%Ac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frequencyTable.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                          <td className="px-3 py-2 font-medium">
                            {freqTableType === 'agrupada' ? row.intervalo : row.valor}
                          </td>
                          {freqTableType === 'agrupada' && (
                            <td className="px-3 py-2 text-center">{row.xi}</td>
                          )}
                          <td className="px-3 py-2 text-center font-bold text-purple-600">{row.fi}</td>
                          <td className="px-3 py-2 text-center">{row.fri.toFixed(4)}</td>
                          <td className="px-3 py-2 text-center">{row.pi.toFixed(2)}%</td>
                          <td className="px-3 py-2 text-center font-bold text-indigo-600">{row.Fi}</td>
                          <td className="px-3 py-2 text-center">{row.Fri.toFixed(4)}</td>
                          <td className="px-3 py-2 text-center">{row.Pi.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Seleccioná un proyecto con datos para ver la tabla
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticos */}
            <div className="space-y-6">
              {/* Estadísticos Básicos */}
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                  <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Medidas de Tendencia Central
                  </h2>
                </div>
                <div className="p-4">
                  {basicStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">N (cantidad)</p>
                        <p className="text-2xl font-bold text-purple-900">{basicStats.n}</p>
                      </div>
                      {basicStats.media !== undefined && (
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Media (x̄)</p>
                          <p className="text-2xl font-bold text-blue-900">{basicStats.media.toFixed(2)}</p>
                        </div>
                      )}
                      {basicStats.mediana !== undefined && (
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Mediana (Me)</p>
                          <p className="text-2xl font-bold text-indigo-900">{basicStats.mediana.toFixed(2)}</p>
                        </div>
                      )}
                      <div className="bg-violet-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Moda (Mo)</p>
                        <p className="text-lg font-bold text-violet-900">{basicStats.moda}</p>
                      </div>
                      {basicStats.minimo !== undefined && (
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                          <p className="text-2xl font-bold text-green-900">{basicStats.minimo}</p>
                        </div>
                      )}
                      {basicStats.maximo !== undefined && (
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Máximo</p>
                          <p className="text-2xl font-bold text-red-900">{basicStats.maximo}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Seleccioná un proyecto con datos
                    </div>
                  )}
                </div>
              </div>

              {/* Medidas Adicionales */}
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-between hover:from-purple-200 hover:to-indigo-200 transition-all"
                >
                  <span className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Agregar Más Medidas
                  </span>
                  {showAdvancedStats ? (
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-600" />
                  )}
                </button>
                
                {showAdvancedStats && (
                  <div className="p-4 space-y-4">
                    {/* Dispersión */}
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-orange-900">Medidas de Dispersión</h3>
                        <Button
                          onClick={() => calculateAdvancedStat('dispersion')}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Calcular
                        </Button>
                      </div>
                      {advancedStats.varianza !== undefined && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-500">Varianza:</span>
                            <span className="font-bold ml-2">{advancedStats.varianza.toFixed(4)}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-500">Desv. Est.:</span>
                            <span className="font-bold ml-2">{advancedStats.desviacionEstandar.toFixed(4)}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-500">Rango:</span>
                            <span className="font-bold ml-2">{advancedStats.rango.toFixed(2)}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-500">CV:</span>
                            <span className="font-bold ml-2">{advancedStats.coeficienteVariacion.toFixed(2)}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Percentiles */}
                    <div className="bg-cyan-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-cyan-900">Percentil</h3>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={percentileValue}
                          onChange={(e) => setPercentileValue(parseInt(e.target.value) || 50)}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <Button
                          onClick={() => calculateAdvancedStat('percentile')}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          Calcular P{percentileValue}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(advancedStats)
                          .filter(([k]) => k.startsWith('percentil_'))
                          .map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg px-3 py-1 text-sm">
                              <span className="text-gray-500">P{key.split('_')[1]}:</span>
                              <span className="font-bold ml-1">{value.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Deciles */}
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-emerald-900">Decil</h3>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={decileValue}
                          onChange={(e) => setDecileValue(parseInt(e.target.value) || 5)}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <Button
                          onClick={() => calculateAdvancedStat('decile')}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Calcular D{decileValue}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(advancedStats)
                          .filter(([k]) => k.startsWith('decil_'))
                          .map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg px-3 py-1 text-sm">
                              <span className="text-gray-500">D{key.split('_')[1]}:</span>
                              <span className="font-bold ml-1">{value.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Cuartiles */}
                    <div className="bg-pink-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-pink-900">Cuartil</h3>
                        <select
                          value={quartileValue}
                          onChange={(e) => setQuartileValue(parseInt(e.target.value))}
                          className="px-2 py-1 border rounded"
                        >
                          <option value={1}>Q1 (25%)</option>
                          <option value={2}>Q2 (50%)</option>
                          <option value={3}>Q3 (75%)</option>
                        </select>
                        <Button
                          onClick={() => calculateAdvancedStat('quartile')}
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          Calcular Q{quartileValue}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(advancedStats)
                          .filter(([k]) => k.startsWith('cuartil_'))
                          .map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg px-3 py-1 text-sm">
                              <span className="text-gray-500">Q{key.split('_')[1]}:</span>
                              <span className="font-bold ml-1">{value.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisisSecundario;
