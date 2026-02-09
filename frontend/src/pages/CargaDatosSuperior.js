import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Mic, MicOff, Table2, Save, Plus, X, Edit, 
  FileSpreadsheet, AlertCircle
} from 'lucide-react';
import SidebarSuperior from '../components/SidebarSuperior';
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

const CargaDatosSuperior = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [analysisType, setAnalysisType] = useState('multivariado');
  const [existingDataset, setExistingDataset] = useState(null);
  
  const [multiVariables, setMultiVariables] = useState([
    { name: '', type: 'cuantitativa_continua', values: '' }
  ]);
  
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [variableName, setVariableName] = useState('');
  const [variableType, setVariableType] = useState('cuantitativa_continua');

  useEffect(() => {
    loadProjects();
    initSpeechRecognition();
  }, []);

  const loadProjects = async () => {
    try {
      const superiorProjects = await localStorageService.getProjects('superior');
      setProjects(superiorProjects);
      
      const projectId = localStorage.getItem('currentProjectId');
      if (projectId && superiorProjects.find(p => p.id === projectId)) {
        setCurrentProjectId(projectId);
        loadProjectDetails(projectId);
        loadExistingData(projectId);
      } else if (superiorProjects.length > 0) {
        const firstProject = superiorProjects[0].id;
        setCurrentProjectId(firstProject);
        localStorage.setItem('currentProjectId', firstProject);
        loadProjectDetails(firstProject);
        loadExistingData(firstProject);
      } else {
        toast.error('No hay ningún proyecto. Creá uno primero.');
        navigate('/proyectos-superior');
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setCurrentProjectId(projectId);
    localStorage.setItem('currentProjectId', projectId);
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
        toast.success(`Detectado: "${transcript}"`);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setIsListening(false);
        toast.error('Error en reconocimiento de voz');
      };

      setRecognition(recognitionInstance);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      const project = await localStorageService.getProjectById(projectId);
      setCurrentProject(project);
      setAnalysisType(project.analysisType || 'multivariado');
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
        
        if (dataset.variables && dataset.variables.length > 0) {
          const vars = dataset.variables.map(v => ({
            name: v.name,
            type: v.type,
            values: v.values.join(', ')
          }));
          setMultiVariables(vars);
        }
      }
    } catch (error) {
      console.error('Error cargando datos existentes:', error);
    }
  };

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

  const saveMultiVariableData = async () => {
    const validVars = multiVariables.filter(v => v.name.trim() && v.values.trim());
    
    if (validVars.length === 0) {
      toast.error('Ingresá al menos una variable con datos');
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
      toast.success('Datos guardados exitosamente');
      navigate('/graficos-superior');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

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
      toast.info('Escuchando... Dictá los datos separados por comas');
    }
  };

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
      toast.success('Datos por voz guardados');
      navigate('/graficos-superior');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

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
        if (existingDataset) {
          await localStorageService.deleteDatasetsByProject(currentProjectId);
        }

        const columns = response.data.columns;
        const data = response.data.data;

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
        navigate('/graficos-superior');
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('Error al procesar archivo');
    }

    event.target.value = '';
  };

  const variableTypes = [
    { value: 'cualitativa_nominal', label: 'Cualitativa Nominal' },
    { value: 'cualitativa_ordinal', label: 'Cualitativa Ordinal' },
    { value: 'cuantitativa_discreta', label: 'Cuantitativa Discreta' },
    { value: 'cuantitativa_continua', label: 'Cuantitativa Continua' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <SidebarSuperior />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName={currentProject?.name || 'Cargar Datos'} educationLevel="superior" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <h1 className="text-4xl font-heading font-bold mb-2">
              📥 Cargar Datos
            </h1>
            <p className="text-emerald-100 text-lg">
              Ingresá los datos para tu análisis estadístico avanzado
            </p>
            {currentProject && (
              <div className="mt-4 inline-block bg-white/20 px-4 py-2 rounded-full text-sm">
                Proyecto: <strong>{currentProject.name}</strong> ({currentProject.analysisType})
              </div>
            )}
          </div>

          {/* Selector de Proyecto */}
          <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-emerald-200 shadow-sm">
            <Label className="text-lg font-bold text-emerald-700 mb-3 block">📁 Seleccionar Proyecto:</Label>
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
            <div className="bg-teal-100 border-2 border-teal-400 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <Edit className="w-8 h-8 text-teal-600" />
              <div>
                <p className="font-bold text-teal-900">Ya hay datos cargados</p>
                <p className="text-teal-700 text-sm">Podés modificarlos o cargar nuevos datos (reemplazará los existentes)</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
              <TabsTrigger value="manual" data-testid="manual-tab">
                <Table2 className="w-4 h-4 mr-2" />
                Ingreso Manual
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

            {/* INGRESO MANUAL */}
            <TabsContent value="manual">
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-sm">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6">📊 Ingreso de Variables</h3>
                <p className="text-gray-600 mb-6">
                  Ingresá cada variable con sus valores. Para análisis de regresión o correlación, asegurate de tener la misma cantidad de datos en cada variable.
                </p>

                {multiVariables.map((variable, idx) => (
                  <div key={idx} className="bg-emerald-50 rounded-2xl p-6 mb-4 border border-emerald-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-emerald-900">Variable {idx + 1}</h4>
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
                        <Label className="text-sm font-bold mb-1 block">Nombre de la Variable</Label>
                        <Input
                          placeholder="Ej: salario, edad, temperatura"
                          value={variable.name}
                          onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-bold mb-1 block">Tipo de Variable</Label>
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
                        placeholder="Ej: 45000, 52000, 68000, 95000, 120000"
                        value={variable.values}
                        onChange={(e) => updateVariable(idx, 'values', e.target.value)}
                        className="h-24"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  <Button
                    onClick={addVariable}
                    variant="outline"
                    className="border-emerald-400 text-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Variable
                  </Button>
                  <Button
                    onClick={saveMultiVariableData}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="save-data-btn"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Guardar y Continuar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ENTRADA POR VOZ */}
            <TabsContent value="voice">
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-sm">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6">🎤 Entrada por Voz</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="text-base font-bold mb-2 block">Nombre de la Variable</Label>
                    <Input
                      placeholder="Ej: valores_medidos"
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
                        : 'bg-emerald-600 hover:bg-emerald-700'
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
                      ? '🔴 Escuchando... Dictá los datos'
                      : 'Click para comenzar a dictar'}
                  </p>
                </div>

                {voiceTranscript && (
                  <div className="bg-emerald-50 rounded-2xl p-6 mb-6">
                    <Label className="text-base font-bold mb-2 block">Datos detectados:</Label>
                    <div className="bg-white rounded-xl p-4 min-h-20 border border-emerald-200">
                      <p className="text-lg">{voiceTranscript}</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" onClick={() => setVoiceTranscript('')}>
                        <X className="w-4 h-4 mr-2" />
                        Limpiar
                      </Button>
                      <Button onClick={saveVoiceData} className="bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Datos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CARGA DE ARCHIVO */}
            <TabsContent value="file">
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-sm">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6">📁 Subir Archivo</h3>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-emerald-300 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                  data-testid="file-dropzone"
                >
                  <Upload className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-700 font-medium mb-2">
                    Click para seleccionar archivo
                  </p>
                  <p className="text-gray-500">
                    Formatos soportados: Excel (.xlsx, .xls) y CSV (.csv)
                  </p>
                </div>

                <div className="mt-6 bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cyan-600 mt-0.5" />
                    <div className="text-sm text-cyan-800">
                      <p className="font-bold mb-1">Formato recomendado:</p>
                      <p>La primera fila debe contener los nombres de las variables.</p>
                      <p>Cada columna representa una variable, cada fila un registro.</p>
                      <p>Para análisis multivariado, incluí todas las variables en el mismo archivo.</p>
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

export default CargaDatosSuperior;
