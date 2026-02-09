import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Volume2 } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';
import { trackAnalysisCompleted } from '../utils/achievementTracker';

const AnalisisPrimaria = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [frequencyTable, setFrequencyTable] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [speaking, setSpeaking] = useState(false);

  const getAnalysisStorageKey = useCallback((projectId) => {
    if (!projectId) return null;
    return `analysisPrimaria:${projectId}`;
  }, []);

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

  useEffect(() => {
    const storageKey = getAnalysisStorageKey(selectedProject);
    if (!storageKey) return;

    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsedState = JSON.parse(savedState);
      if (parsedState.statistics) {
        setStatistics(parsedState.statistics);
      }
      if (parsedState.frequencyTable) {
        setFrequencyTable(parsedState.frequencyTable);
      }
    } catch (error) {
      console.error('Error al leer el estado guardado:', error);
    }
  }, [getAnalysisStorageKey, selectedProject]);

  useEffect(() => {
    const storageKey = getAnalysisStorageKey(selectedProject);
    if (!storageKey) return;

    const stateToPersist = {
      statistics,
      frequencyTable
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
  }, [frequencyTable, getAnalysisStorageKey, selectedProject, statistics]);

  const loadProjects = async () => {
    try {
      const primaryProjects = await localStorageService.getProjects('primario');
      setProjects(primaryProjects);
      
      const savedProjectId = localStorage.getItem('currentProjectId');
      
      if (savedProjectId && primaryProjects.find(p => p.id === savedProjectId)) {
        setSelectedProject(savedProjectId);
        loadDatasets(savedProjectId);
      } else if (primaryProjects.length > 0) {
        const firstProject = primaryProjects[0].id;
        setSelectedProject(firstProject);
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
        calculateFrequencyTable(projectDatasets[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateFrequencyTable = (dataset) => {
    if (!dataset || !dataset.variables || dataset.variables.length === 0) return;
    
    const variable = dataset.variables[0];
    const valueCounts = {};
    variable.values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });

    const total = variable.values.length;
    let accumulatedF = 0;
    let accumulatedFr = 0;

    const table = Object.entries(valueCounts).map(([value, freq]) => {
      const relativeFreq = freq / total;
      const percentageFreq = (freq / total) * 100;
      accumulatedF += freq;
      accumulatedFr += relativeFreq;

      return {
        value,
        f: freq,
        fr: relativeFreq.toFixed(2),
        percentage: percentageFreq.toFixed(1) + '%',
        accumulatedF: accumulatedF,
        accumulatedFr: accumulatedFr.toFixed(2)
      };
    });

    setFrequencyTable(table);
  };

  const calculateStatistics = async () => {
    if (datasets.length === 0) {
      toast.error('¡No hay datos para analizar!');
      return;
    }

    const dataset = datasets[0];
    const values = dataset.variables[0].values;
    
    const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
    
    if (numericValues.length === 0) {
      const mode = getMostFrequent(values);
      setStatistics({ mode, type: 'qualitative' });
      trackAnalysisCompleted();
      toast.success('¡Cálculo completado! 🎯');
      return;
    }

    // Calcular estadísticas localmente
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    const mode = getMostFrequent(numericValues);
    const range = Math.max(...numericValues) - Math.min(...numericValues);

    const stats = {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      mode,
      range: Number(range.toFixed(2)),
      type: 'quantitative'
    };

    setStatistics(stats);
    trackAnalysisCompleted();
    toast.success('¡Cálculos completados! 🎯');
  };

  const getMostFrequent = (arr) => {
    const counts = {};
    arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  };

  const readResults = () => {
    if (!statistics) {
      toast.error('¡Primero calculá las estadísticas!');
      return;
    }

    setSpeaking(true);
    let text = '';

    if (statistics.type === 'qualitative') {
      text = `La moda es ${statistics.mode}. Esto significa que ${statistics.mode} es el valor que más se repite en los datos.`;
    } else {
      text = `La media es ${statistics.mean}. La mediana es ${statistics.median}. La moda es ${statistics.mode}. El rango es ${statistics.range}.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    toast.success('🔊 ¡Escuchá los resultados!');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Análisis de Datos" educationLevel="primario" />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-2 flex items-center gap-3">
              <Calculator className="w-10 h-10 sm:w-12 sm:h-12" />¡Análisis!
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl font-accent">Descubrí qué nos dicen los datos</p>
          </div>

          {projects.length > 0 && (
            <div className="bg-white rounded-3xl p-6 mb-6 border-4 border-blue-200">
              <label className="text-xl font-bold mb-3 block">Elegí tu Misión:</label>
              <Select value={selectedProject} onValueChange={(id) => { 
                setSelectedProject(id); 
                localStorage.setItem('currentProjectId', id);
                window.dispatchEvent(new CustomEvent('projectChanged', { detail: id }));
                loadDatasets(id); 
              }}>
                <SelectTrigger className="text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequencyTable.length > 0 && (
            <div className="bg-white rounded-3xl p-8 mb-6 border-4 border-purple-200">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Tabla de Frecuencia</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-lg">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="p-4 text-left font-bold border-2 border-purple-300">Valor</th>
                      <th className="p-4 text-center font-bold border-2 border-purple-300">Frecuencia (f)</th>
                      <th className="p-4 text-center font-bold border-2 border-purple-300">Frec. Relativa (fr)</th>
                      <th className="p-4 text-center font-bold border-2 border-purple-300">Porcentaje</th>
                      <th className="p-4 text-center font-bold border-2 border-purple-300">F. Acumulada</th>
                      <th className="p-4 text-center font-bold border-2 border-purple-300">Fr. Acumulada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencyTable.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                        <td className="p-4 font-bold border-2 border-purple-200">{row.value}</td>
                        <td className="p-4 text-center border-2 border-purple-200">{row.f}</td>
                        <td className="p-4 text-center border-2 border-purple-200">{row.fr}</td>
                        <td className="p-4 text-center border-2 border-purple-200">{row.percentage}</td>
                        <td className="p-4 text-center border-2 border-purple-200">{row.accumulatedF}</td>
                        <td className="p-4 text-center border-2 border-purple-200">{row.accumulatedFr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 mb-6 border-4 border-green-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🧠 Medidas de Tendencia Central</h2>
            
            {!statistics ? (
              <div className="text-center py-8">
                <Button onClick={calculateStatistics} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full px-8 py-4 text-xl font-bold">
                  <Calculator className="w-6 h-6 mr-3" />¡Calcular Medidas!
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {statistics.type === 'quantitative' && (
                    <>
                      <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white text-center">
                        <div className="text-5xl mb-2">📊</div>
                        <div className="text-sm opacity-90 mb-1">Media (Promedio)</div>
                        <div className="text-4xl font-black">{statistics.mean}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white text-center">
                        <div className="text-5xl mb-2">🎯</div>
                        <div className="text-sm opacity-90 mb-1">Mediana (Del Medio)</div>
                        <div className="text-4xl font-black">{statistics.median}</div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-6 text-white text-center">
                        <div className="text-5xl mb-2">⭐</div>
                        <div className="text-sm opacity-90 mb-1">Moda (Más Repetido)</div>
                        <div className="text-4xl font-black">{statistics.mode}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white text-center">
                        <div className="text-5xl mb-2">📎</div>
                        <div className="text-sm opacity-90 mb-1">Rango (Diferencia)</div>
                        <div className="text-4xl font-black">{statistics.range}</div>
                      </div>
                    </>
                  )}
                  {statistics.type === 'qualitative' && (
                    <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-8 text-white text-center col-span-full">
                      <div className="text-7xl mb-4">⭐</div>
                      <div className="text-2xl opacity-90 mb-2">Moda (Más Repetido)</div>
                      <div className="text-6xl font-black">{statistics.mode}</div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <Button onClick={readResults} disabled={speaking} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full px-8 py-4 text-xl font-bold">
                    <Volume2 className={`w-6 h-6 mr-3 ${speaking ? 'animate-pulse' : ''}`} />
                    {speaking ? '🔊 Leyendo...' : '🔊 Leer Resultados'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisisPrimaria;
