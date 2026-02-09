import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Mic, MicOff, Table2, Save, Plus, X, Edit, 
  FileSpreadsheet, Check, AlertCircle
} from 'lucide-react';
import SidebarSecundario from '../components/SidebarSecundario';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

const CargaDatosSecundario = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [analysisType, setAnalysisType] = useState('univariado');
  const [existingDataset, setExistingDataset] = useState(null);
  
  // Estados para datos manuales
  const [manualData, setManualData] = useState('');
  const [variableName, setVariableName] = useState('');
  const [variableType, setVariableType] = useState('cualitativa_nominal');
  
  // Estados para datos multivariados
  const [multiVariables, setMultiVariables] = useState([
    { name: '', type: 'cuantitativa_continua', values: '' }
  ]);
  
  // Estados para tabla de frecuencia
  const [freqTableType, setFreqTableType] = useState('simple'); // simple o agrupada
  const [frequencyData, setFrequencyData] = useState([{ value: '', frequency: '' }]);
  const [groupedIntervals, setGroupedIntervals] = useState([
    { minValue: '', maxValue: '', frequency: '' }
  ]);
  const [numIntervals, setNumIntervals] = useState(5);
  const [useSturgess, setUseSturgess] = useState(false);
  
  // Estados para reconocimiento de voz
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    loadProjects();
    initSpeechRecognition();
  }, []);

  const loadProjects = async () => {
    try {
      const secundarioProjects = await localStorageService.getProjects('secundario');
      setProjects(secundarioProjects);
      
      const projectId = localStorage.getItem('currentProjectId');
      if (projectId && secundarioProjects.find(p => p.id === projectId)) {
        setCurrentProjectId(projectId);
        loadProjectDetails(projectId);
        loadExistingData(projectId);
      } else if (secundarioProjects.length > 0) {
        const firstProject = secundarioProjects[0].id;
        setCurrentProjectId(firstProject);
        localStorage.setItem('currentProjectId', firstProject);
        loadProjectDetails(firstProject);
        loadExistingData(firstProject);
      } else {
        toast.error('No hay ningún proyecto. Creá uno primero.');
        navigate('/proyectos-secundario');
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setCurrentProjectId(projectId);
    localStorage.setItem('currentProjectId', projectId);
    setManualData('');
    setVariableName('');
    setExistingDataset(null);
    setVoiceTranscript('');
    setMultiVariables([{ name: '', type: 'cuantitativa_continua', values: '' }]);
    loadProjectDetails(projectId);
    loadExistingData(projectId);
  };

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'es-AR';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        setVoiceTranscript(prev => prev ? `${prev}, ${transcript}` : transcript);
        toast.success(`Escuchado: "${transcript}"`);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setIsListening(false);
        toast.error('Error al escuchar. Intentá de nuevo.');
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      const project = await localStorageService.getProjectById(projectId);
      setCurrentProject(project);
      setAnalysisType(project.analysisType || 'univariado');
    } catch (error) {
      console.error('Error cargando proyecto:', error);
    }
  };

  const loadExistingData = async (projectId) => {
    try {
      const datasets = await localStorageService.getDatasets(projectId);
      if (datasets.length > 0) {
        const dataset = datasets[0];
        setExistingDataset(dataset);
        
        // Pre-llenar datos para edición
        if (dataset.variables && dataset.variables.length > 0) {
          if (dataset.variables.length === 1) {
            const variable = dataset.variables[0];
            setVariableName(variable.name);
            setVariableType(variable.type);
            setManualData(variable.values.join(', '));
          } else {
            // Multivariado
            const vars = dataset.variables.map(v => ({
              name: v.name,
              type: v.type,
              values: v.values.join(', ')
            }));
            setMultiVariables(vars);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos existentes:', error);
    }
  };

  // Funciones para tabla de frecuencia simple
  const addFrequencyRow = () => {
    setFrequencyData([...frequencyData, { value: '', frequency: '' }]);
  };

  const removeFrequencyRow = (index) => {
    if (frequencyData.length > 1) {
      setFrequencyData(frequencyData.filter((_, i) => i !== index));
    }
  };

  const updateFrequencyRow = (index, field, value) => {
    const updated = [...frequencyData];
    updated[index][field] = value;
    setFrequencyData(updated);
  };

  // Funciones para tabla agrupada
  const addGroupedRow = () => {
    setGroupedIntervals([...groupedIntervals, { minValue: '', maxValue: '', frequency: '' }]);
  };

  const removeGroupedRow = (index) => {
    if (groupedIntervals.length > 1) {
      setGroupedIntervals(groupedIntervals.filter((_, i) => i !== index));
    }
  };

  const updateGroupedRow = (index, field, value) => {
    const updated = [...groupedIntervals];
    updated[index][field] = value;
    setGroupedIntervals(updated);
  };

  // Función para generar intervalos con la regla de Sturges
  const generateSturgessIntervals = (dataString) => {
    if (!dataString.trim()) {
      toast.error('Ingresá datos para generar intervalos');
      return;
    }

    const values = dataString
      .split(/[,\s]+/)
      .filter(v => v.trim() !== '')
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (values.length < 2) {
      toast.error('Necesitás al menos 2 valores numéricos');
      return;
    }

    const n = values.length;
    // Regla de Sturges: k = 1 + 3.322 * log10(n)
    const k = Math.ceil(1 + 3.322 * Math.log10(n));
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const amplitude = Math.ceil(range / k);

    const intervals = [];
    for (let i = 0; i < k; i++) {
      const lowerBound = min + (i * amplitude);
      const upperBound = min + ((i + 1) * amplitude);
      
      // Contar frecuencia
      const freq = values.filter(v => {
        if (i === k - 1) {
          return v >= lowerBound && v <= upperBound;
        }
        return v >= lowerBound && v < upperBound;
      }).length;

      intervals.push({
        minValue: lowerBound.toString(),
        maxValue: upperBound.toString(),
        frequency: freq.toString()
      });
    }

    setGroupedIntervals(intervals);
    setNumIntervals(k);
    toast.success(`Se generaron ${k} intervalos con la regla de Sturges`);
  };

  // Funciones para multivariado
  const addVariable = () => {
    setMultiVariables([...multiVariables, { name: '', type: 'cuantitativa_continua', values: '' }]);
  };

  const removeVariable = (index) => {
    if (multiVariables.length > 1) {
      setMultiVariables(multiVariables.filter((_, i) => i !== index));
    }
  };

  const updateVariable = (index, field, value) => {
    const updated = [...multiVariables];
    updated[index][field] = value;
    setMultiVariables(updated);
  };

  // Guardar datos manuales
  const saveManualData = async () => {
    if (!manualData.trim()) {
      toast.error('Ingresá algunos datos');
      return;
    }

    if (!variableName.trim()) {
      toast.error('Ingresá un nombre para la variable');
      return;
    }

    // Procesar valores
    const values = manualData
      .trim()
      .split(/[,\s]+/)
      .filter(v => v.trim() !== '')
      .map(v => {
        const num = parseFloat(v);
        return isNaN(num) ? v.trim() : num;
      });

    if (values.length === 0) {
      toast.error('Ingresá al menos un dato');
      return;
    }

    try {
      // Eliminar datasets existentes si estamos editando
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, [variableName]: val })),
        variables: [{
          name: variableName,
          type: variableType,
          values: values
        }],
        source: 'manual'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos guardados exitosamente!');
      navigate('/graficos-secundario');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

  // Guardar datos multivariados
  const saveMultiVariableData = async () => {
    const validVars = multiVariables.filter(v => v.name.trim() && v.values.trim());
    
    if (validVars.length < 2) {
      toast.error('Para análisis multivariado necesitás al menos 2 variables');
      return;
    }

    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const variables = validVars.map(v => {
        const values = v.values
          .split(/[,\s]+/)
          .filter(val => val.trim() !== '')
          .map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? val.trim() : num;
          });
        return {
          name: v.name,
          type: v.type,
          values: values
        };
      });

      // Crear rawData combinando todas las variables
      const maxLength = Math.max(...variables.map(v => v.values.length));
      const rawData = [];
      for (let i = 0; i < maxLength; i++) {
        const row = { index: i + 1 };
        variables.forEach(v => {
          row[v.name] = v.values[i] !== undefined ? v.values[i] : null;
        });
        rawData.push(row);
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: rawData,
        variables: variables,
        source: 'manual'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos multivariados guardados!');
      navigate('/graficos-secundario');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

  // Guardar tabla de frecuencia
  const saveFrequencyTable = async () => {
    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      let values = [];
      
      if (freqTableType === 'simple') {
        const validData = frequencyData.filter(row => row.value && row.frequency);
        if (validData.length === 0) {
          toast.error('Completá la tabla de frecuencia');
          return;
        }
        
        validData.forEach(row => {
          const freq = parseInt(row.frequency);
          for (let i = 0; i < freq; i++) {
            const val = parseFloat(row.value);
            values.push(isNaN(val) ? row.value : val);
          }
        });
      } else {
        // Datos agrupados - usar marca de clase
        const validData = groupedIntervals.filter(row => row.minValue && row.maxValue && row.frequency);
        if (validData.length === 0) {
          toast.error('Completá los intervalos');
          return;
        }
        
        validData.forEach(row => {
          const min = parseFloat(row.minValue);
          const max = parseFloat(row.maxValue);
          const freq = parseInt(row.frequency);
          const marcaClase = (min + max) / 2;
          for (let i = 0; i < freq; i++) {
            values.push(marcaClase);
          }
        });
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, [variableName || 'valor']: val })),
        variables: [{
          name: variableName || 'valor',
          type: variableType,
          values: values
        }],
        source: 'frequency_table'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Tabla de frecuencia guardada!');
      navigate('/graficos-secundario');
    } catch (error) {
      console.error('Error guardando tabla:', error);
      toast.error('Error al guardar tabla');
    }
  };

  // Guardar datos por voz
  const saveVoiceData = async () => {
    if (!voiceTranscript.trim()) {
      toast.error('Dictá algunos datos primero');
      return;
    }

    const values = voiceTranscript
      .split(/[,\s]+/)
      .filter(v => v.trim() !== '')
      .map(v => {
        const num = parseFloat(v);
        return isNaN(num) ? v.trim() : num;
      });

    if (values.length === 0) {
      toast.error('No se detectaron datos válidos');
      return;
    }

    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, [variableName || 'valor']: val })),
        variables: [{
          name: variableName || 'valor',
          type: variableType,
          values: values
        }],
        source: 'voice'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos por voz guardados!');
      navigate('/graficos-secundario');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

  // Toggle reconocimiento de voz
  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Escuchando... Dictá tus datos separados por comas');
    }
  };

  // Subir archivo - mantiene axios para procesamiento pero guarda localmente
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = file.name.endsWith('.csv') ? 'upload/csv' : 'upload/excel';
      const response = await axios.post(`${API}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        // Guardar los datos del archivo localmente
        if (existingDataset) {
          await localStorageService.deleteDatasetsByProject(currentProjectId);
        }

        const columns = response.data.columns;
        const data = response.data.data;

        // Crear variables a partir de las columnas
        const variables = columns.map(col => {
          const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
          const isNumeric = values.every(v => !isNaN(parseFloat(v)));
          return {
            name: col,
            type: isNumeric ? 'cuantitativa_continua' : 'cualitativa_nominal',
            values: values
          };
        });

        const dataset = {
          projectId: currentProjectId,
          rawData: data,
          variables: variables,
          source: 'file'
        };

        await localStorageService.createDataset(dataset);
        toast.success(`Archivo cargado: ${response.data.rowCount} filas, ${columns.length} columnas`);
        navigate('/graficos-secundario');
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('Error al procesar archivo');
    }

    event.target.value = '';
  };

  const variableTypes = [
    { value: 'cualitativa_nominal', label: 'Cualitativa Nominal (ej: colores, nombres)' },
    { value: 'cualitativa_ordinal', label: 'Cualitativa Ordinal (ej: nivel educativo, satisfacción)' },
    { value: 'cuantitativa_discreta', label: 'Cuantitativa Discreta (ej: cantidad de hijos, goles)' },
    { value: 'cuantitativa_continua', label: 'Cuantitativa Continua (ej: peso, altura, temperatura)' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Cargar Datos'} educationLevel="secundario" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <h1 className="text-4xl font-heading font-bold mb-2">
              📥 Cargar Datos
            </h1>
            <p className="text-purple-100 text-lg">
              {analysisType === 'multivariado' 
                ? 'Análisis multivariable - Ingresá varias variables para analizar sus relaciones'
                : 'Análisis univariable - Ingresá los datos de una variable'}
            </p>
            {currentProject && (
              <div className="mt-4 inline-block bg-white/20 px-4 py-2 rounded-full text-sm">
                Proyecto: <strong>{currentProject.name}</strong>
              </div>
            )}
          </div>

          {/* Selector de Proyecto */}
          <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-purple-200 shadow-sm">
            <Label className="text-lg font-bold text-purple-700 mb-3 block">📁 Seleccionar Proyecto:</Label>
            <Select value={currentProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="text-base h-12">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {existingDataset && (
            <div className="bg-blue-100 border-2 border-blue-400 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <Edit className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-bold text-blue-900">Ya tenés datos cargados</p>
                <p className="text-blue-700 text-sm">Podés modificarlos o cargar nuevos datos (reemplazará los existentes)</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
              <TabsTrigger value="manual" data-testid="manual-tab">
                <Table2 className="w-4 h-4 mr-2" />
                Datos Sueltos
              </TabsTrigger>
              <TabsTrigger value="frequency" data-testid="frequency-tab">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Tabla Frecuencia
              </TabsTrigger>
              <TabsTrigger value="voice" data-testid="voice-tab">
                <Mic className="w-4 h-4 mr-2" />
                Por Voz
              </TabsTrigger>
              <TabsTrigger value="file" data-testid="file-tab">
                <Upload className="w-4 h-4 mr-2" />
                Archivo
              </TabsTrigger>
            </TabsList>

            {/* ===================== DATOS MANUALES ===================== */}
            <TabsContent value="manual">
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-900 mb-6">
                  {analysisType === 'multivariado' ? '📊 Ingreso de Múltiples Variables' : '📝 Ingreso de Datos Sueltos'}
                </h3>

                {analysisType === 'univariado' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label className="text-base font-bold mb-2 block">Nombre de la Variable</Label>
                        <Input
                          placeholder="Ej: Edad, Calificación, País"
                          value={variableName}
                          onChange={(e) => setVariableName(e.target.value)}
                          className="text-base"
                          data-testid="variable-name-input"
                        />
                      </div>
                      <div>
                        <Label className="text-base font-bold mb-2 block">Tipo de Variable</Label>
                        <Select value={variableType} onValueChange={setVariableType}>
                          <SelectTrigger data-testid="variable-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {variableTypes.map(vt => (
                              <SelectItem key={vt.value} value={vt.value}>
                                {vt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label className="text-base font-bold mb-2 block">Datos (separados por comas o espacios)</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Ejemplo numérico: 15, 18, 22, 14, 16, 19, 20 | Ejemplo texto: Argentina, Brasil, Argentina, Francia
                      </p>
                      <Textarea
                        placeholder="Ingresá tus datos aquí..."
                        value={manualData}
                        onChange={(e) => setManualData(e.target.value)}
                        className="text-base h-32"
                        data-testid="manual-data-input"
                      />
                    </div>

                    <Button
                      onClick={saveManualData}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                      data-testid="save-manual-data"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Guardar y Continuar
                    </Button>
                  </>
                ) : (
                  /* MULTIVARIADO */
                  <>
                    <p className="text-gray-600 mb-6">
                      Ingresá cada variable con sus valores. Asegurate de que todas tengan la misma cantidad de datos.
                    </p>

                    {multiVariables.map((variable, idx) => (
                      <div key={idx} className="bg-purple-50 rounded-2xl p-6 mb-4 border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-purple-900">Variable {idx + 1}</h4>
                          {multiVariables.length > 1 && (
                            <button
                              onClick={() => removeVariable(idx)}
                              className="p-2 hover:bg-red-100 rounded-lg"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-bold mb-1 block">Nombre</Label>
                            <Input
                              placeholder="Ej: horas_estudio"
                              value={variable.name}
                              onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-bold mb-1 block">Tipo</Label>
                            <Select 
                              value={variable.type} 
                              onValueChange={(value) => updateVariable(idx, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {variableTypes.map(vt => (
                                  <SelectItem key={vt.value} value={vt.value}>
                                    {vt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-bold mb-1 block">Valores (separados por comas)</Label>
                          <Textarea
                            placeholder="Ej: 2.5, 4.0, 3.5, 5.0, 2.0"
                            value={variable.values}
                            onChange={(e) => updateVariable(idx, 'values', e.target.value)}
                            className="h-20"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-3">
                      <Button
                        onClick={addVariable}
                        variant="outline"
                        className="border-purple-400 text-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Variable
                      </Button>
                      <Button
                        onClick={saveMultiVariableData}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        data-testid="save-multi-data"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Variables
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ===================== TABLA DE FRECUENCIA ===================== */}
            <TabsContent value="frequency">
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-900 mb-6">📊 Tabla de Frecuencia</h3>

                {/* Selector tipo de tabla */}
                <div className="mb-6">
                  <Label className="text-base font-bold mb-3 block">Tipo de Tabla</Label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFreqTableType('simple')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        freqTableType === 'simple'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      Datos Simples
                    </button>
                    <button
                      onClick={() => setFreqTableType('agrupada')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        freqTableType === 'agrupada'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      Datos Agrupados en Intervalos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="text-base font-bold mb-2 block">Nombre de la Variable</Label>
                    <Input
                      placeholder="Ej: Calificaciones, Edades"
                      value={variableName}
                      onChange={(e) => setVariableName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-bold mb-2 block">Tipo de Variable</Label>
                    <Select value={variableType} onValueChange={setVariableType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variableTypes.map(vt => (
                          <SelectItem key={vt.value} value={vt.value}>
                            {vt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {freqTableType === 'simple' ? (
                  /* TABLA SIMPLE */
                  <>
                    <div className="bg-purple-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-12 gap-3 mb-2 font-bold text-purple-900">
                        <div className="col-span-6 text-center">Valor</div>
                        <div className="col-span-4 text-center">Frecuencia Absoluta</div>
                        <div className="col-span-2"></div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                      {frequencyData.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-6">
                            <Input
                              placeholder="Ej: Perro, 15, Bueno"
                              value={row.value}
                              onChange={(e) => updateFrequencyRow(idx, 'value', e.target.value)}
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Cantidad"
                              value={row.frequency}
                              onChange={(e) => updateFrequencyRow(idx, 'frequency', e.target.value)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            {frequencyData.length > 1 && (
                              <button
                                onClick={() => removeFrequencyRow(idx)}
                                className="w-full h-10 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center"
                              >
                                <X className="w-5 h-5 text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={addFrequencyRow} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Fila
                      </Button>
                      <Button onClick={saveFrequencyTable} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Tabla
                      </Button>
                    </div>
                  </>
                ) : (
                  /* TABLA AGRUPADA */
                  <>
                    <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-indigo-900 mb-3">Generación automática con Regla de Sturges</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        Ingresá tus datos separados por comas y se calcularán los intervalos automáticamente usando k = 1 + 3.322 × log₁₀(n)
                      </p>
                      <div className="flex gap-3">
                        <Textarea
                          id="sturgess-data"
                          placeholder="Ej: 15, 18, 22, 14, 16, 19, 20, 25, 17, 21, 23, 18, 16, 19, 24..."
                          className="flex-1 h-20"
                        />
                        <Button
                          onClick={() => {
                            const textarea = document.getElementById('sturgess-data');
                            generateSturgessIntervals(textarea.value);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                        >
                          Generar Intervalos
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        O ingresá manualmente los intervalos:
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-12 gap-3 mb-2 font-bold text-purple-900">
                        <div className="col-span-3 text-center">Límite Inferior</div>
                        <div className="col-span-3 text-center">Límite Superior</div>
                        <div className="col-span-4 text-center">Frecuencia Absoluta</div>
                        <div className="col-span-2"></div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                      {groupedIntervals.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-3">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={row.minValue}
                              onChange={(e) => updateGroupedRow(idx, 'minValue', e.target.value)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              placeholder="Max"
                              value={row.maxValue}
                              onChange={(e) => updateGroupedRow(idx, 'maxValue', e.target.value)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Frecuencia"
                              value={row.frequency}
                              onChange={(e) => updateGroupedRow(idx, 'frequency', e.target.value)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            {groupedIntervals.length > 1 && (
                              <button
                                onClick={() => removeGroupedRow(idx)}
                                className="w-full h-10 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center"
                              >
                                <X className="w-5 h-5 text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={addGroupedRow} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Intervalo
                      </Button>
                      <Button onClick={saveFrequencyTable} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Tabla Agrupada
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ===================== ENTRADA POR VOZ ===================== */}
            <TabsContent value="voice">
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-900 mb-6">🎤 Entrada por Voz</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="text-base font-bold mb-2 block">Nombre de la Variable</Label>
                    <Input
                      placeholder="Ej: Calificaciones"
                      value={variableName}
                      onChange={(e) => setVariableName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-bold mb-2 block">Tipo de Variable</Label>
                    <Select value={variableType} onValueChange={setVariableType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variableTypes.map(vt => (
                          <SelectItem key={vt.value} value={vt.value}>
                            {vt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-center py-8">
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                      isListening
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    data-testid="voice-button"
                  >
                    {isListening ? (
                      <MicOff className="w-16 h-16 text-white" />
                    ) : (
                      <Mic className="w-16 h-16 text-white" />
                    )}
                  </button>
                  <p className="mt-4 text-lg text-gray-600">
                    {isListening 
                      ? '🔴 Escuchando... Dictá tus datos separados por comas'
                      : 'Hacé click para comenzar a dictar'}
                  </p>
                </div>

                {voiceTranscript && (
                  <div className="bg-purple-50 rounded-2xl p-6 mb-6">
                    <Label className="text-base font-bold mb-2 block">Datos detectados:</Label>
                    <div className="bg-white rounded-xl p-4 min-h-20 border border-purple-200">
                      <p className="text-lg">{voiceTranscript}</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVoiceTranscript('')}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpiar
                      </Button>
                      <Button
                        onClick={saveVoiceData}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="save-voice-data"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Datos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ===================== CARGA DE ARCHIVO ===================== */}
            <TabsContent value="file">
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-900 mb-6">📁 Subir Archivo Excel o CSV</h3>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-purple-300 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  data-testid="file-dropzone"
                >
                  <Upload className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-700 font-medium mb-2">
                    Hacé click o arrastrá un archivo aquí
                  </p>
                  <p className="text-gray-500">
                    Formatos soportados: Excel (.xlsx, .xls) y CSV (.csv)
                  </p>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">Formato recomendado:</p>
                      <p>La primera fila debe contener los nombres de las variables (columnas).</p>
                      <p>Cada fila siguiente representa un registro/observación.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CargaDatosSecundario;
