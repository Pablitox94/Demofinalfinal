import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, TrendingUp, BarChart3, ChevronDown, ChevronUp, 
  Sigma, Target, Activity, GitBranch, Percent
} from 'lucide-react';
import SidebarSuperior from '../components/SidebarSuperior';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const AnalisisSuperior = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('');
  const [selectedVarX, setSelectedVarX] = useState('');
  const [selectedVarY, setSelectedVarY] = useState('');
  
  // Tabla de frecuencia
  const [freqTableType, setFreqTableType] = useState('simple');
  const [numIntervals, setNumIntervals] = useState(5);
  const [useSturgess, setUseSturgess] = useState(true);
  const [frequencyTable, setFrequencyTable] = useState([]);
  
  // Estadísticos
  const [basicStats, setBasicStats] = useState(null);
  const [advancedStats, setAdvancedStats] = useState({});
  
  // Secciones expandibles
  const [expandedSections, setExpandedSections] = useState({
    descriptivo: true,
    dispersion: false,
    posicion: false,
    regresion: false,
    correlacion: false,
    inferencia: false,
    distribucion: false,
    hipotesis: false
  });

  // Parámetros de cálculos
  const [percentileValue, setPercentileValue] = useState(50);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [hypothesisValue, setHypothesisValue] = useState(0);
  
  const getAnalysisStorageKey = useCallback((projectId, variableName) => {
    if (!projectId || !variableName) return null;
    return `analysisSuperior:${projectId}:${variableName}`;
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
      if (typeof parsedState.confidenceLevel === 'number') {
        setConfidenceLevel(parsedState.confidenceLevel);
      }
      if (typeof parsedState.hypothesisValue === 'number') {
        setHypothesisValue(parsedState.hypothesisValue);
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
      confidenceLevel,
      hypothesisValue
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
  }, [
    advancedStats,
    basicStats,
    confidenceLevel,
    freqTableType,
    frequencyTable,
    getAnalysisStorageKey,
    hypothesisValue,
    numIntervals,
    percentileValue,
    selectedProject,
    selectedVariable,
    useSturgess
  ]); 

  const loadProjects = async () => {
    try {
      const superiorProjects = await localStorageService.getProjects('superior');
      setProjects(superiorProjects);
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
          calculateAll(dataset.variables[0]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getNumericValues = (variable) => {
    if (!variable || !variable.values) return [];
    return variable.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
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
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
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
          xi: (lowerBound + upperBound) / 2
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
    const numericValues = getNumericValues(variable);
    
    if (numericValues.length === 0) {
      const counts = {};
      variable.values.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });
      const maxFreq = Math.max(...Object.values(counts));
      const modes = Object.entries(counts)
        .filter(([_, freq]) => freq === maxFreq)
        .map(([val]) => val);
      
      setBasicStats({ moda: modes.join(', '), n: variable.values.length });
      return;
    }

    const n = numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = n % 2 === 0
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2
      : sorted[Math.floor(n/2)];
    
    const counts = {};
    numericValues.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(counts));
    const modes = Object.entries(counts)
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => parseFloat(val));
    
    const min = sorted[0];
    const max = sorted[n - 1];
    
    // Varianza y desviación estándar
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const varianceSample = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDevSample = Math.sqrt(varianceSample);
    
    setBasicStats({
      n,
      media: mean,
      mediana: median,
      moda: modes.length === n ? 'Sin moda' : modes.join(', '),
      minimo: min,
      maximo: max,
      rango: max - min,
      varianzaPoblacional: variance,
      varianzaMuestral: varianceSample,
      desvEstandarPoblacional: stdDev,
      desvEstandarMuestral: stdDevSample,
      coefVariacion: mean !== 0 ? (stdDev / mean) * 100 : 0,
      errorEstandar: stdDevSample / Math.sqrt(n)
    });
  };

  // Cálculos de Posición
  const calculatePercentile = () => {
    const variable = variables.find(v => v.name === selectedVariable);
    if (!variable) return;
    
    const numericValues = getNumericValues(variable);
    if (numericValues.length === 0) {
      toast.error('Se requieren datos numéricos');
      return;
    }

    const n = numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    
    // Función para calcular percentil
    const getPercentile = (p) => {
      const pIndex = (p / 100) * (n - 1);
      const pLower = Math.floor(pIndex);
      const pFrac = pIndex - pLower;
      return sorted[pLower] + pFrac * (sorted[Math.min(pLower + 1, n - 1)] - sorted[pLower]);
    };

    // Percentil solicitado
    const percentile = getPercentile(percentileValue);
    
    // Cuartiles
    const q1 = getPercentile(25);
    const q2 = getPercentile(50);
    const q3 = getPercentile(75);
    const iqr = q3 - q1;
    
    // Deciles
    const d1 = getPercentile(10);
    const d2 = getPercentile(20);
    const d3 = getPercentile(30);
    const d4 = getPercentile(40);
    const d5 = getPercentile(50);
    const d6 = getPercentile(60);
    const d7 = getPercentile(70);
    const d8 = getPercentile(80);
    const d9 = getPercentile(90);
    
    setAdvancedStats(prev => ({
      ...prev,
      [`P${percentileValue}`]: percentile,
      Q1: q1,
      Q2: q2,
      Q3: q3,
      IQR: iqr,
      D1: d1,
      D2: d2,
      D3: d3,
      D4: d4,
      D5: d5,
      D6: d6,
      D7: d7,
      D8: d8,
      D9: d9
    }));
    toast.success('Medidas de posición calculadas (cuartiles y deciles)');
  };

  // Regresión Lineal Simple
  const calculateRegression = () => {
    if (!selectedVarX || !selectedVarY) {
      toast.error('Seleccioná ambas variables X e Y');
      return;
    }

    const varX = variables.find(v => v.name === selectedVarX);
    const varY = variables.find(v => v.name === selectedVarY);
    
    if (!varX || !varY) return;

    const xValues = getNumericValues(varX);
    const yValues = getNumericValues(varY);
    
    const n = Math.min(xValues.length, yValues.length);
    if (n < 2) {
      toast.error('Se necesitan al menos 2 pares de datos');
      return;
    }

    const xSlice = xValues.slice(0, n);
    const ySlice = yValues.slice(0, n);

    const sumX = xSlice.reduce((a, b) => a + b, 0);
    const sumY = ySlice.reduce((a, b) => a + b, 0);
    const sumXY = xSlice.reduce((acc, x, i) => acc + x * ySlice[i], 0);
    const sumX2 = xSlice.reduce((acc, x) => acc + x * x, 0);
    const sumY2 = ySlice.reduce((acc, y) => acc + y * y, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Coeficientes de regresión
    const b1 = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b0 = meanY - b1 * meanX;

    // R² (coeficiente de determinación)
    const ssTotal = ySlice.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
    const ssResidual = ySlice.reduce((acc, y, i) => {
      const yPred = b0 + b1 * xSlice[i];
      return acc + Math.pow(y - yPred, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);
    const r = Math.sqrt(r2) * (b1 >= 0 ? 1 : -1);

    // Error estándar de la estimación
    const see = Math.sqrt(ssResidual / (n - 2));

    setAdvancedStats(prev => ({
      ...prev,
      regresion: {
        ecuacion: `ŷ = ${b0.toFixed(4)} + ${b1.toFixed(4)}x`,
        b0: b0,
        b1: b1,
        r2: r2,
        r: r,
        errorEstandar: see,
        n: n
      }
    }));
    toast.success('Regresión lineal calculada');
  };

  // Correlación de Pearson
  const calculateCorrelation = () => {
    if (!selectedVarX || !selectedVarY) {
      toast.error('Seleccioná ambas variables');
      return;
    }

    const varX = variables.find(v => v.name === selectedVarX);
    const varY = variables.find(v => v.name === selectedVarY);
    
    if (!varX || !varY) return;

    const xValues = getNumericValues(varX);
    const yValues = getNumericValues(varY);
    
    const n = Math.min(xValues.length, yValues.length);
    if (n < 2) {
      toast.error('Se necesitan al menos 2 pares de datos');
      return;
    }

    const xSlice = xValues.slice(0, n);
    const ySlice = yValues.slice(0, n);

    const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
    const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = xSlice[i] - meanX;
      const diffY = ySlice[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    const r = numerator / Math.sqrt(denomX * denomY);
    const r2 = r * r;

    // Test de significancia
    const t = r * Math.sqrt((n - 2) / (1 - r2));
    
    let interpretacion = '';
    const absR = Math.abs(r);
    if (absR < 0.3) interpretacion = 'Correlación débil';
    else if (absR < 0.7) interpretacion = 'Correlación moderada';
    else interpretacion = 'Correlación fuerte';
    
    interpretacion += r > 0 ? ' positiva' : ' negativa';

    setAdvancedStats(prev => ({
      ...prev,
      correlacion: {
        r: r,
        r2: r2,
        t: t,
        interpretacion: interpretacion,
        n: n
      }
    }));
    toast.success('Correlación calculada');
  };

  // Intervalo de Confianza para la Media
  const calculateConfidenceInterval = () => {
    const variable = variables.find(v => v.name === selectedVariable);
    if (!variable) return;
    
    const numericValues = getNumericValues(variable);
    if (numericValues.length < 2) {
      toast.error('Se necesitan al menos 2 datos');
      return;
    }

    const n = numericValues.length;
    const mean = numericValues.reduce((a, b) => a + b, 0) / n;
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const se = stdDev / Math.sqrt(n);

    // Valor z para nivel de confianza
    const zValues = { 90: 1.645, 95: 1.96, 99: 2.576 };
    const z = zValues[confidenceLevel] || 1.96;

    const marginError = z * se;
    const lowerBound = mean - marginError;
    const upperBound = mean + marginError;

    setAdvancedStats(prev => ({
      ...prev,
      intervaloConfianza: {
        media: mean,
        errorEstandar: se,
        nivelConfianza: confidenceLevel,
        limiteInferior: lowerBound,
        limiteSuperior: upperBound,
        margenError: marginError
      }
    }));
    toast.success('Intervalo de confianza calculado');
  };

  // Prueba de Hipótesis para la Media
  const calculateHypothesisTest = () => {
    const variable = variables.find(v => v.name === selectedVariable);
    if (!variable) return;
    
    const numericValues = getNumericValues(variable);
    if (numericValues.length < 2) {
      toast.error('Se necesitan al menos 2 datos');
      return;
    }

    const n = numericValues.length;
    const mean = numericValues.reduce((a, b) => a + b, 0) / n;
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const se = stdDev / Math.sqrt(n);

    // Estadístico t
    const t = (mean - hypothesisValue) / se;
    const df = n - 1;

    // Aproximación del p-valor (simplificada)
    const absT = Math.abs(t);
    let pValue;
    if (absT > 3.5) pValue = 0.001;
    else if (absT > 2.5) pValue = 0.02;
    else if (absT > 2) pValue = 0.05;
    else if (absT > 1.5) pValue = 0.15;
    else pValue = 0.5;

    const alpha = (100 - confidenceLevel) / 100;
    const rechazaH0 = pValue < alpha;

    setAdvancedStats(prev => ({
      ...prev,
      pruebaHipotesis: {
        mediaObservada: mean,
        valorHipotesis: hypothesisValue,
        estadisticoT: t,
        gradosLibertad: df,
        pValorAprox: pValue,
        nivelSignificancia: alpha,
        rechazaH0: rechazaH0,
        conclusion: rechazaH0 
          ? `Se rechaza H₀: La media es significativamente diferente de ${hypothesisValue}`
          : `No se rechaza H₀: No hay evidencia suficiente para afirmar que la media difiere de ${hypothesisValue}`
      }
    }));
    toast.success('Prueba de hipótesis realizada');
  };

  // Distribución Normal
  const calculateNormalDistribution = () => {
    const variable = variables.find(v => v.name === selectedVariable);
    if (!variable) return;
    
    const numericValues = getNumericValues(variable);
    if (numericValues.length < 3) {
      toast.error('Se necesitan al menos 3 datos');
      return;
    }

    const n = numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mean = numericValues.reduce((a, b) => a + b, 0) / n;
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Asimetría (Skewness)
    const skewness = numericValues.reduce((acc, val) => 
      acc + Math.pow((val - mean) / stdDev, 3), 0) / n;

    // Curtosis
    const kurtosis = numericValues.reduce((acc, val) => 
      acc + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;

    // Test de normalidad simplificado (Jarque-Bera)
    const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);
    const esNormal = jb < 5.99; // Valor crítico aproximado para α=0.05

    setAdvancedStats(prev => ({
      ...prev,
      distribucion: {
        media: mean,
        desvEstandar: stdDev,
        asimetria: skewness,
        curtosis: kurtosis,
        estadisticoJB: jb,
        esNormal: esNormal,
        interpretacion: esNormal 
          ? 'Los datos se aproximan a una distribución normal'
          : 'Los datos no siguen una distribución normal'
      }
    }));
    toast.success('Análisis de distribución completado');
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ section, title, icon: Icon, color }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full px-6 py-4 bg-gradient-to-r ${color} flex items-center justify-between hover:opacity-90 transition-all rounded-t-2xl`}
    >
      <span className="text-lg font-bold text-white flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </span>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-white" />
      ) : (
        <ChevronDown className="w-5 h-5 text-white" />
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <SidebarSuperior />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Análisis'} educationLevel="superior" />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              Análisis Estadístico Avanzado
            </h1>
            <p className="text-emerald-100">
              Estadística descriptiva, inferencial, regresión, correlación y pruebas de hipótesis
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-bold mb-2 block">Proyecto</Label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-bold mb-2 block">Variable Principal</Label>
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
                <Label className="text-sm font-bold mb-2 block">Variable X (Regresión)</Label>
                <Select value={selectedVarX} onValueChange={setSelectedVarX}>
                  <SelectTrigger>
                    <SelectValue placeholder="Variable X" />
                  </SelectTrigger>
                  <SelectContent>
                    {variables.map(v => (
                      <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-bold mb-2 block">Variable Y (Regresión)</Label>
                <Select value={selectedVarY} onValueChange={setSelectedVarY}>
                  <SelectTrigger>
                    <SelectValue placeholder="Variable Y" />
                  </SelectTrigger>
                  <SelectContent>
                    {variables.map(v => (
                      <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Tabla de Frecuencias */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="descriptivo" 
                  title="Tabla de Frecuencias" 
                  icon={BarChart3} 
                  color="from-emerald-500 to-teal-500"
                />
                {expandedSections.descriptivo && (
                  <div className="p-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setFreqTableType('simple');
                          const v = variables.find(v => v.name === selectedVariable);
                          if (v) calculateFrequencyTable(v);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          freqTableType === 'simple' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Simples
                      </button>
                      <button
                        onClick={() => {
                          setFreqTableType('agrupada');
                          const v = variables.find(v => v.name === selectedVariable);
                          if (v) calculateFrequencyTable(v);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          freqTableType === 'agrupada' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Agrupados
                      </button>
                    </div>

                    {frequencyTable.length > 0 && (
                      <div className="border border-emerald-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-emerald-100 z-10">
                              <tr>
                                <th className="px-2 py-2 text-left">{freqTableType === 'agrupada' ? 'Intervalo' : 'Valor'}</th>
                                {freqTableType === 'agrupada' && <th className="px-2 py-2">xi</th>}
                                <th className="px-2 py-2">fi</th>
                                <th className="px-2 py-2">fri</th>
                                <th className="px-2 py-2">%</th>
                                <th className="px-2 py-2">Fi</th>
                                <th className="px-2 py-2">Fri</th>
                                <th className="px-2 py-2">%Ac</th>
                              </tr>
                            </thead>
                            <tbody>
                              {frequencyTable.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50'}>
                                  <td className="px-2 py-1 font-medium">{freqTableType === 'agrupada' ? row.intervalo : row.valor}</td>
                                  {freqTableType === 'agrupada' && <td className="px-2 py-1 text-center">{row.xi}</td>}
                                  <td className="px-2 py-1 text-center font-bold text-emerald-600">{row.fi}</td>
                                  <td className="px-2 py-1 text-center">{row.fri.toFixed(4)}</td>
                                  <td className="px-2 py-1 text-center">{row.pi.toFixed(2)}%</td>
                                  <td className="px-2 py-1 text-center font-bold text-teal-600">{row.Fi}</td>
                                  <td className="px-2 py-1 text-center">{row.Fri.toFixed(4)}</td>
                                  <td className="px-2 py-1 text-center">{row.Pi.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {frequencyTable.length > 10 && (
                          <div className="bg-emerald-50 px-4 py-2 text-xs text-center text-emerald-700 border-t border-emerald-200">
                            📊 Mostrando {frequencyTable.length} filas - Deslizá para ver más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Estadísticos Descriptivos */}
              {basicStats && (
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <Sigma className="w-5 h-5" />
                    Estadísticos Descriptivos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {basicStats.n && (
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">n</p>
                        <p className="text-xl font-bold text-emerald-900">{basicStats.n}</p>
                      </div>
                    )}
                    {basicStats.media !== undefined && (
                      <div className="bg-teal-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Media (x̄)</p>
                        <p className="text-xl font-bold text-teal-900">{basicStats.media.toFixed(4)}</p>
                      </div>
                    )}
                    {basicStats.mediana !== undefined && (
                      <div className="bg-cyan-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Mediana</p>
                        <p className="text-xl font-bold text-cyan-900">{basicStats.mediana.toFixed(4)}</p>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Moda</p>
                      <p className="text-lg font-bold text-blue-900">{basicStats.moda}</p>
                    </div>
                    {basicStats.desvEstandarMuestral !== undefined && (
                      <div className="bg-indigo-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Desv. Est. (s)</p>
                        <p className="text-xl font-bold text-indigo-900">{basicStats.desvEstandarMuestral.toFixed(4)}</p>
                      </div>
                    )}
                    {basicStats.varianzaMuestral !== undefined && (
                      <div className="bg-violet-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Varianza (s²)</p>
                        <p className="text-xl font-bold text-violet-900">{basicStats.varianzaMuestral.toFixed(4)}</p>
                      </div>
                    )}
                    {basicStats.coefVariacion !== undefined && (
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">CV</p>
                        <p className="text-xl font-bold text-purple-900">{basicStats.coefVariacion.toFixed(2)}%</p>
                      </div>
                    )}
                    {basicStats.rango !== undefined && (
                      <div className="bg-pink-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Rango</p>
                        <p className="text-xl font-bold text-pink-900">{basicStats.rango.toFixed(4)}</p>
                      </div>
                    )}
                    {basicStats.errorEstandar !== undefined && (
                      <div className="bg-rose-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Error Est.</p>
                        <p className="text-xl font-bold text-rose-900">{basicStats.errorEstandar.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medidas de Posición */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="posicion" 
                  title="Medidas de Posición" 
                  icon={Target} 
                  color="from-blue-500 to-indigo-500"
                />
                {expandedSections.posicion && (
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Label className="text-sm">Percentil:</Label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={percentileValue}
                        onChange={(e) => setPercentileValue(parseInt(e.target.value) || 50)}
                        className="w-20"
                      />
                      <Button onClick={calculatePercentile} className="bg-blue-600 hover:bg-blue-700">
                        Calcular
                      </Button>
                    </div>
                    
                    {(advancedStats.Q1 || advancedStats[`P${percentileValue}`]) && (
                      <>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {advancedStats[`P${percentileValue}`] && (
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500">P{percentileValue}</p>
                              <p className="font-bold text-blue-900">{advancedStats[`P${percentileValue}`].toFixed(4)}</p>
                            </div>
                          )}
                          {advancedStats.Q1 && (
                            <>
                              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Q1</p>
                                <p className="font-bold text-indigo-900">{advancedStats.Q1.toFixed(4)}</p>
                              </div>
                              <div className="bg-violet-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Q2 (Mediana)</p>
                                <p className="font-bold text-violet-900">{advancedStats.Q2.toFixed(4)}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Q3</p>
                                <p className="font-bold text-purple-900">{advancedStats.Q3.toFixed(4)}</p>
                              </div>
                              <div className="bg-pink-50 rounded-lg p-3 text-center col-span-2">
                                <p className="text-xs text-gray-500">IQR (Rango Intercuartil)</p>
                                <p className="font-bold text-pink-900">{advancedStats.IQR.toFixed(4)}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Deciles */}
                        {advancedStats.D1 && (
                          <div className="mt-4">
                            <p className="text-sm font-bold text-gray-700 mb-2">Deciles</p>
                            <div className="grid grid-cols-5 gap-2">
                              {[1,2,3,4,5,6,7,8,9].map(d => (
                                <div key={d} className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-gray-500">D{d}</p>
                                  <p className="text-sm font-bold text-teal-900">{advancedStats[`D${d}`]?.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Regresión Lineal */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="regresion" 
                  title="Regresión Lineal Simple" 
                  icon={TrendingUp} 
                  color="from-orange-500 to-amber-500"
                />
                {expandedSections.regresion && (
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Seleccioná las variables X e Y en los controles superiores
                    </p>
                    <Button onClick={calculateRegression} className="bg-orange-600 hover:bg-orange-700 w-full mb-4">
                      Calcular Regresión
                    </Button>
                    
                    {advancedStats.regresion && (
                      <div className="space-y-3">
                        <div className="bg-orange-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Ecuación de Regresión</p>
                          <p className="font-mono font-bold text-orange-900 text-lg">
                            {advancedStats.regresion.ecuacion}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">R²</p>
                            <p className="font-bold text-amber-900">{advancedStats.regresion.r2.toFixed(4)}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">R</p>
                            <p className="font-bold text-yellow-900">{advancedStats.regresion.r.toFixed(4)}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">β₀ (Intercepto)</p>
                            <p className="font-bold text-orange-900">{advancedStats.regresion.b0.toFixed(4)}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">β₁ (Pendiente)</p>
                            <p className="font-bold text-red-900">{advancedStats.regresion.b1.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Correlación */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="correlacion" 
                  title="Correlación de Pearson" 
                  icon={GitBranch} 
                  color="from-pink-500 to-rose-500"
                />
                {expandedSections.correlacion && (
                  <div className="p-4">
                    <Button onClick={calculateCorrelation} className="bg-pink-600 hover:bg-pink-700 w-full mb-4">
                      Calcular Correlación
                    </Button>
                    
                    {advancedStats.correlacion && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-pink-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">r (Pearson)</p>
                            <p className="font-bold text-pink-900 text-xl">{advancedStats.correlacion.r.toFixed(4)}</p>
                          </div>
                          <div className="bg-rose-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">R²</p>
                            <p className="font-bold text-rose-900 text-xl">{advancedStats.correlacion.r2.toFixed(4)}</p>
                          </div>
                        </div>
                        <div className="bg-pink-100 rounded-xl p-4">
                          <p className="font-bold text-pink-900">{advancedStats.correlacion.interpretacion}</p>
                          <p className="text-sm text-pink-700 mt-1">
                            El {(advancedStats.correlacion.r2 * 100).toFixed(1)}% de la variabilidad es explicada
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Intervalo de Confianza */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="inferencia" 
                  title="Intervalo de Confianza" 
                  icon={Activity} 
                  color="from-cyan-500 to-blue-500"
                />
                {expandedSections.inferencia && (
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Label className="text-sm">Nivel de Confianza:</Label>
                      <Select value={String(confidenceLevel)} onValueChange={(v) => setConfidenceLevel(parseInt(v))}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90">90%</SelectItem>
                          <SelectItem value="95">95%</SelectItem>
                          <SelectItem value="99">99%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={calculateConfidenceInterval} className="bg-cyan-600 hover:bg-cyan-700">
                        Calcular
                      </Button>
                    </div>
                    
                    {advancedStats.intervaloConfianza && (
                      <div className="bg-cyan-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          IC al {advancedStats.intervaloConfianza.nivelConfianza}% para la media:
                        </p>
                        <p className="font-mono font-bold text-cyan-900 text-lg">
                          [{advancedStats.intervaloConfianza.limiteInferior.toFixed(4)} , {advancedStats.intervaloConfianza.limiteSuperior.toFixed(4)}]
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Media: {advancedStats.intervaloConfianza.media.toFixed(4)} ± {advancedStats.intervaloConfianza.margenError.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prueba de Hipótesis */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="hipotesis" 
                  title="Prueba de Hipótesis" 
                  icon={Percent} 
                  color="from-violet-500 to-purple-500"
                />
                {expandedSections.hipotesis && (
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Label className="text-sm">H₀: μ =</Label>
                      <Input
                        type="number"
                        value={hypothesisValue}
                        onChange={(e) => setHypothesisValue(parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      <Button onClick={calculateHypothesisTest} className="bg-violet-600 hover:bg-violet-700">
                        Test
                      </Button>
                    </div>
                    
                    {advancedStats.pruebaHipotesis && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-violet-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Estadístico t</p>
                            <p className="font-bold text-violet-900">{advancedStats.pruebaHipotesis.estadisticoT.toFixed(4)}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">p-valor (aprox)</p>
                            <p className="font-bold text-purple-900">{advancedStats.pruebaHipotesis.pValorAprox.toFixed(4)}</p>
                          </div>
                        </div>
                        <div className={`rounded-xl p-4 ${advancedStats.pruebaHipotesis.rechazaH0 ? 'bg-red-50' : 'bg-green-50'}`}>
                          <p className={`font-bold ${advancedStats.pruebaHipotesis.rechazaH0 ? 'text-red-900' : 'text-green-900'}`}>
                            {advancedStats.pruebaHipotesis.conclusion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Distribución Normal */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <SectionHeader 
                  section="distribucion" 
                  title="Test de Normalidad" 
                  icon={Activity} 
                  color="from-teal-500 to-emerald-500"
                />
                {expandedSections.distribucion && (
                  <div className="p-4">
                    <Button onClick={calculateNormalDistribution} className="bg-teal-600 hover:bg-teal-700 w-full mb-4">
                      Analizar Distribución
                    </Button>
                    
                    {advancedStats.distribucion && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-teal-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Asimetría</p>
                            <p className="font-bold text-teal-900">{advancedStats.distribucion.asimetria.toFixed(4)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Curtosis</p>
                            <p className="font-bold text-emerald-900">{advancedStats.distribucion.curtosis.toFixed(4)}</p>
                          </div>
                        </div>
                        <div className={`rounded-xl p-4 ${advancedStats.distribucion.esNormal ? 'bg-green-50' : 'bg-yellow-50'}`}>
                          <p className={`font-bold ${advancedStats.distribucion.esNormal ? 'text-green-900' : 'text-yellow-900'}`}>
                            {advancedStats.distribucion.interpretacion}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Estadístico Jarque-Bera: {advancedStats.distribucion.estadisticoJB.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    )}
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

export default AnalisisSuperior;
