import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Mic, Table2, Save, Plus, X, Edit } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const CargaDatosPrimaria = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [manualData, setManualData] = useState('');
  const [frequencyData, setFrequencyData] = useState([{ value: '', frequency: '' }]);
  const [variableName, setVariableName] = useState('');
  const [existingDataset, setExistingDataset] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    loadProjects();
    initSpeechRecognition();
  }, []);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'es-AR';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(prev => prev ? `${prev} ${transcript}` : transcript);
        toast.success('¡Escuché: ' + transcript + '!');
      };

      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setIsListening(false);
        toast.error('Error al escuchar. Intentá de nuevo.');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  };

  const loadProjects = async () => {
    try {
      const primaryProjects = await localStorageService.getProjects('primario');
      setProjects(primaryProjects);
      
      const projectId = localStorage.getItem('currentProjectId');
      if (projectId && primaryProjects.find(p => p.id === projectId)) {
        setCurrentProjectId(projectId);
        loadExistingData(projectId);
      } else if (primaryProjects.length > 0) {
        const firstProject = primaryProjects[0].id;
        setCurrentProjectId(firstProject);
        localStorage.setItem('currentProjectId', firstProject);
        loadExistingData(firstProject);
      } else {
        toast.error('No hay ninguna misión. Creá una primero.');
        navigate('/misiones');
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setCurrentProjectId(projectId);
    localStorage.setItem('currentProjectId', projectId);
    setManualData('');
    setFrequencyData([{ value: '', frequency: '' }]);
    setVariableName('');
    setExistingDataset(null);
    setVoiceTranscript('');
    loadExistingData(projectId);
  };

  const loadExistingData = async (projectId) => {
    try {
      const datasets = await localStorageService.getDatasets(projectId);
      if (datasets.length > 0) {
        const dataset = datasets[0];
        setExistingDataset(dataset);
        
        if (dataset.variables && dataset.variables.length > 0) {
          const variable = dataset.variables[0];
          setVariableName(variable.name);
          
          if (dataset.source === 'frequency_table') {
            const valueCounts = {};
            variable.values.forEach(val => {
              valueCounts[val] = (valueCounts[val] || 0) + 1;
            });
            const freqArray = Object.entries(valueCounts).map(([value, frequency]) => ({
              value,
              frequency: frequency.toString()
            }));
            setFrequencyData(freqArray);
          } else {
            setManualData(variable.values.join(' '));
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  const saveManualData = async () => {
    if (!currentProjectId) {
      toast.error('Seleccioná una misión primero');
      return;
    }
    if (!manualData.trim()) {
      toast.error('¡Ingresá algunos datos!');
      return;
    }

    const values = manualData.trim().split(/[\s,]+/).filter(v => v.trim() !== '');

    if (values.length === 0) {
      toast.error('¡Ingresá al menos un dato!');
      return;
    }

    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, valor: val })),
        variables: [{
          name: variableName || 'valor',
          type: 'cualitativa_nominal',
          values: values
        }],
        source: 'manual'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos guardados! 🎉');
      navigate('/graficos-primaria');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar datos');
    }
  };

  const saveFrequencyTable = async () => {
    if (!currentProjectId) {
      toast.error('Seleccioná una misión primero');
      return;
    }
    const validData = frequencyData.filter(row => row.value && row.frequency);
    
    if (validData.length === 0) {
      toast.error('¡Completá la tabla!');
      return;
    }

    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const values = [];
      validData.forEach(row => {
        const freq = parseInt(row.frequency);
        for (let i = 0; i < freq; i++) {
          values.push(row.value);
        }
      });

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, valor: val })),
        variables: [{
          name: variableName || 'valor',
          type: 'cualitativa_nominal',
          values: values
        }],
        source: 'frequency_table'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos guardados! 🎉');
      navigate('/graficos-primaria');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar datos');
    }
  };

  const saveVoiceData = async () => {
    if (!currentProjectId) {
      toast.error('Seleccioná una misión primero');
      return;
    }
    if (!voiceTranscript.trim()) {
      toast.error('¡Decí algunos datos primero!');
      return;
    }

    const values = voiceTranscript.trim().split(/[\s,]+/).filter(v => v.trim() !== '');

    if (values.length === 0) {
      toast.error('¡No escuché ningún dato!');
      return;
    }

    try {
      if (existingDataset) {
        await localStorageService.deleteDatasetsByProject(currentProjectId);
      }

      const dataset = {
        projectId: currentProjectId,
        rawData: values.map((val, idx) => ({ index: idx + 1, valor: val })),
        variables: [{
          name: variableName || 'valor',
          type: 'cualitativa_nominal',
          values: values
        }],
        source: 'voice'
      };

      await localStorageService.createDataset(dataset);
      toast.success('¡Datos guardados! 🎉');
      navigate('/graficos-primaria');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar datos');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Cargar Datos" educationLevel="primario" />
        
        <div className="p-8">
          <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <h1 className="text-5xl font-heading font-black mb-2">
              {existingDataset ? '✏️ ¡Editá tus Datos!' : '¡Cargá tus Datos!'}
            </h1>
            <p className="text-2xl font-accent">
              {existingDataset ? 'Modificá la información si te equivocaste' : 'Elegí cómo querés ingresar la información'}
            </p>
          </div>

          {/* Selector de Proyecto */}
          <div className="bg-white rounded-3xl p-6 mb-6 border-4 border-blue-200">
            <Label className="text-xl font-bold text-blue-700 mb-3 block">📁 Elegí tu Misión:</Label>
            <Select value={currentProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="text-lg h-14">
                <SelectValue placeholder="Seleccionar misión" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {existingDataset && (
            <div className="bg-blue-100 border-4 border-blue-400 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3">
                <Edit className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-blue-900">Ya tenés datos cargados</p>
                  <p className="text-blue-700">Podés modificarlos abajo o cargar nuevos datos</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
              <TabsTrigger value="manual">
                <Upload className="w-4 h-4 mr-2" />
                Datos Sueltos
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table2 className="w-4 h-4 mr-2" />
                Tabla de Frecuencia
              </TabsTrigger>
              <TabsTrigger value="voice">
                <Mic className="w-4 h-4 mr-2" />
                Por Voz
              </TabsTrigger>
            </TabsList>

            {/* Manual Input */}
            <TabsContent value="manual">
              <div className="bg-white rounded-3xl p-8 border-4 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📝 Ingresá Datos Sueltos</h3>
                
                <div className="mb-6">
                  <Label className="text-lg mb-2 block">Nombre de lo que estás midiendo:</Label>
                  <Input
                    placeholder="Ej: Animal favorito, Color, Deporte"
                    value={variableName}
                    onChange={(e) => setVariableName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="mb-6">
                  <Label className="text-lg mb-2 block">Escribí tus datos (separados por espacios o comas):</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Ejemplo: Perro Gato Perro Conejo <strong>o</strong> Perro, Gato, Perro, Conejo
                  </p>
                  <Textarea
                    placeholder="Perro Gato Perro Conejo Perro Gato"
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                    className="text-lg h-32"
                  />
                </div>

                <Button
                  onClick={saveManualData}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full px-8 py-4 text-xl font-bold"
                >
                  <Save className="w-6 h-6 mr-2" />
                  {existingDataset ? '¡Actualizar y Ver Gráfico!' : '¡Guardar y Hacer Gráfico!'}
                </Button>
              </div>
            </TabsContent>

            {/* Frequency Table */}
            <TabsContent value="table">
              <div className="bg-white rounded-3xl p-8 border-4 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Tabla de Frecuencia</h3>
                
                <div className="mb-6">
                  <Label className="text-lg mb-2 block">Nombre de lo que estás midiendo:</Label>
                  <Input
                    placeholder="Ej: Animal favorito"
                    value={variableName}
                    onChange={(e) => setVariableName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-12 gap-3 mb-2">
                    <div className="col-span-6 font-bold text-lg text-center bg-purple-100 p-3 rounded-lg border-2 border-purple-300">
                      Valor
                    </div>
                    <div className="col-span-4 font-bold text-lg text-center bg-purple-100 p-3 rounded-lg border-2 border-purple-300">
                      Frecuencia
                    </div>
                    <div className="col-span-2"></div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {frequencyData.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6">
                        <Input
                          placeholder="Ej: Perro"
                          value={row.value}
                          onChange={(e) => updateFrequencyRow(idx, 'value', e.target.value)}
                          className="text-lg h-14 border-2 border-purple-200"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          placeholder="5"
                          min="1"
                          value={row.frequency}
                          onChange={(e) => updateFrequencyRow(idx, 'frequency', e.target.value)}
                          className="text-lg h-14 border-2 border-purple-200 text-center"
                        />
                      </div>
                      <div className="col-span-2 flex gap-2">
                        {frequencyData.length > 1 && (
                          <button
                            onClick={() => removeFrequencyRow(idx)}
                            className="w-full h-14 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center border-2 border-red-300 transition-colors"
                          >
                            <X className="w-6 h-6 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={addFrequencyRow}
                    variant="outline" 
                    className="border-2 border-purple-400 text-purple-700 hover:bg-purple-50 px-6 py-3 text-lg font-bold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar Fila
                  </Button>
                  <Button
                    onClick={saveFrequencyTable}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-4 text-xl font-bold"
                  >
                    <Save className="w-6 h-6 mr-2" />
                    {existingDataset ? '¡Actualizar y Ver Gráfico!' : '¡Guardar y Hacer Gráfico!'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Voice Input */}
            <TabsContent value="voice">
              <div className="bg-white rounded-3xl p-8 border-4 border-pink-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">🎤 ¡Hablá tus Datos!</h3>
                
                <div className="mb-6">
                  <Label className="text-lg mb-2 block">Nombre de lo que estás midiendo:</Label>
                  <Input
                    placeholder="Ej: Animal favorito, Color, Deporte"
                    value={variableName}
                    onChange={(e) => setVariableName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {!recognition ? (
                  <div className="bg-yellow-100 border-4 border-yellow-300 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-3">😢</div>
                    <p className="text-lg text-yellow-800 font-bold">
                      Tu navegador no tiene micrófono activado
                    </p>
                    <p className="text-yellow-700">Probá con Chrome o Edge</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          if (isListening) {
                            recognition.stop();
                            setIsListening(false);
                          } else {
                            setIsListening(true);
                            recognition.start();
                            toast.info('¡Hablá ahora! Di tus datos separados por pausas');
                          }
                        }}
                        className={`w-32 h-32 rounded-full transition-all ${
                          isListening 
                            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-300' 
                            : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-110'
                        }`}
                      >
                        <Mic className={`w-16 h-16 mx-auto text-white ${isListening ? 'animate-bounce' : ''}`} />
                      </button>
                      <p className="text-lg font-bold mt-4 text-gray-700">
                        {isListening ? '🎙️ ¡Te estoy escuchando!' : 'Tocá para hablar'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 mb-6">
                      <Label className="text-lg mb-2 block text-left">Datos escuchados:</Label>
                      <div className="min-h-24 p-4 bg-white rounded-xl border-2 border-pink-200 text-left">
                        {voiceTranscript ? (
                          <p className="text-xl text-gray-800">{voiceTranscript}</p>
                        ) : (
                          <p className="text-gray-400 italic">Los datos que digas aparecerán acá...</p>
                        )}
                      </div>
                      {voiceTranscript && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={() => setVoiceTranscript('')}
                            variant="outline"
                            className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Borrar
                          </Button>
                          <Button
                            onClick={() => {
                              if (isListening) {
                                recognition.stop();
                                setIsListening(false);
                              }
                              recognition.start();
                              setIsListening(true);
                            }}
                            variant="outline"
                            className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Agregar más
                          </Button>
                        </div>
                      )}
                    </div>

                    {voiceTranscript && (
                      <Button
                        onClick={saveVoiceData}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-8 py-4 text-xl font-bold"
                      >
                        <Save className="w-6 h-6 mr-2" />
                        ¡Guardar y Hacer Gráfico!
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-8 bg-pink-50 rounded-2xl p-6 border-2 border-pink-200">
                  <h4 className="font-bold text-pink-800 mb-2">💡 Tips para hablar:</h4>
                  <ul className="text-pink-700 space-y-1">
                    <li>• Hablá claro y despacio</li>
                    <li>• Decí un dato a la vez: "Perro... Gato... Perro..."</li>
                    <li>• Podés tocar el botón varias veces para agregar más datos</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CargaDatosPrimaria;
