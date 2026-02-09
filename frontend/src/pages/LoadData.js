import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileSpreadsheet,
  Table2,
  Mic,
  Check,
  X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoadData = () => {
  const [educationLevel, setEducationLevel] = useState('secundario');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [uploadedData, setUploadedData] = useState(null);
  const [manualData, setManualData] = useState([{ index: 0, value: '' }]);
  const [variableName, setVariableName] = useState('');
  const [variableType, setVariableType] = useState('cualitativa_nominal');

  useEffect(() => {
    const level = localStorage.getItem('educationLevel') || 'secundario';
    setEducationLevel(level);
    loadProjects();
    loadExampleDatasets();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const [exampleDatasets, setExampleDatasets] = useState([]);

  const loadExampleDatasets = async () => {
    try {
      const response = await axios.get(`${API}/examples/datasets`);
      setExampleDatasets(response.data);
    } catch (error) {
      console.error('Error cargando ejemplos:', error);
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = file.name.endsWith('.csv') ? 'upload/csv' : 'upload/excel';
      const response = await axios.post(`${API}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedData(response.data);
      toast.success(`Archivo cargado: ${response.data.rowCount} filas`);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('Error al cargar archivo');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const addManualRow = () => {
    setManualData([...manualData, { index: manualData.length, value: '' }]);
  };

  const updateManualRow = (index, value) => {
    const updated = [...manualData];
    updated[index].value = value;
    setManualData(updated);
  };

  const removeManualRow = (index) => {
    setManualData(manualData.filter((_, i) => i !== index));
  };

  const saveManualData = async () => {
    if (!selectedProject) {
      toast.error('Seleccioná un proyecto primero');
      return;
    }

    if (!variableName.trim()) {
      toast.error('Ingresá un nombre para la variable');
      return;
    }

    const values = manualData.map(d => d.value).filter(v => v);
    if (values.length === 0) {
      toast.error('Ingresá al menos un dato');
      return;
    }

    try {
      const dataset = {
        projectId: selectedProject,
        rawData: values.map((val, idx) => ({ index: idx + 1, [variableName]: val })),
        variables: [{
          name: variableName,
          type: variableType,
          values: values
        }],
        source: 'manual'
      };

      await axios.post(`${API}/datasets`, dataset);
      toast.success('Datos guardados exitosamente');
      
      setManualData([{ index: 0, value: '' }]);
      setVariableName('');
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast.error('Error al guardar datos');
    }
  };

  const loadExampleDataset = async (example) => {
    if (!selectedProject) {
      toast.error('Seleccioná un proyecto primero');
      return;
    }

    try {
      const dataset = {
        projectId: selectedProject,
        rawData: example.rawData,
        variables: example.variables,
        source: 'example'
      };

      await axios.post(`${API}/datasets`, dataset);
      toast.success(`Dataset de ejemplo "${example.name}" cargado`);
    } catch (error) {
      console.error('Error cargando ejemplo:', error);
      toast.error('Error al cargar ejemplo');
    }
  };

  return (
    <div className="flex min-h-screen bg-pink-50">
      <Sidebar educationLevel={educationLevel} />
      
      <div className="flex-1 ml-64">
        <Navbar projectName="Cargar Datos" educationLevel={educationLevel} />
        
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-pink-900 mb-2">
              Cargar Datos
            </h1>
            <p className="text-gray-600">
              Ingresá datos manualmente, subí un archivo o usá ejemplos
            </p>
          </div>

          {/* Project Selector */}
          <div className="bg-white rounded-3xl p-6 mb-6 border border-pink-100">
            <Label className="text-pink-900 font-bold mb-2 block">Proyecto Destino</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger data-testid="project-select" className="w-full max-w-md">
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

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
              <TabsTrigger value="manual" data-testid="manual-tab">
                <Table2 className="w-4 h-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="file" data-testid="file-tab">
                <Upload className="w-4 h-4 mr-2" />
                Archivo
              </TabsTrigger>
              <TabsTrigger value="examples" data-testid="examples-tab">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Ejemplos
              </TabsTrigger>
              <TabsTrigger value="voice" data-testid="voice-tab" disabled>
                <Mic className="w-4 h-4 mr-2" />
                Voz
              </TabsTrigger>
            </TabsList>

            {/* Manual Input */}
            <TabsContent value="manual" className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-pink-100">
                <h3 className="text-2xl font-heading font-bold text-pink-900 mb-6">
                  Entrada Manual de Datos
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label>Nombre de la Variable</Label>
                    <Input
                      data-testid="variable-name-input"
                      placeholder="Ej: Animal favorito"
                      value={variableName}
                      onChange={(e) => setVariableName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tipo de Variable</Label>
                    <Select value={variableType} onValueChange={setVariableType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cualitativa_nominal">Cualitativa Nominal</SelectItem>
                        <SelectItem value="cualitativa_ordinal">Cualitativa Ordinal</SelectItem>
                        <SelectItem value="cuantitativa_discreta">Cuantitativa Discreta</SelectItem>
                        <SelectItem value="cuantitativa_continua">Cuantitativa Continua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {manualData.map((row, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="text-sm text-gray-500 w-8">{idx + 1}</span>
                      <Input
                        data-testid={`manual-data-input-${idx}`}
                        placeholder={`Dato ${idx + 1}`}
                        value={row.value}
                        onChange={(e) => updateManualRow(idx, e.target.value)}
                        className="flex-1"
                      />
                      {manualData.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeManualRow(idx)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={addManualRow} variant="outline" data-testid="add-row-button">
                    Agregar Fila
                  </Button>
                  <Button onClick={saveManualData} className="btn-primary" data-testid="save-manual-data">
                    <Check className="w-4 h-4 mr-2" />
                    Guardar Datos
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* File Upload */}
            <TabsContent value="file">
              <div className="bg-white rounded-3xl p-8 border border-pink-100">
                <h3 className="text-2xl font-heading font-bold text-pink-900 mb-6">
                  Subir Archivo Excel o CSV
                </h3>

                <div
                  {...getRootProps()}
                  data-testid="file-dropzone"
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-pink-200 hover:border-pink-400 hover:bg-pink-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-lg text-pink-700 font-medium">Soltá el archivo aquí...</p>
                  ) : (
                    <>
                      <p className="text-lg text-gray-700 font-medium mb-2">
                        Arrastrá y soltá un archivo, o hacé click para seleccionar
                      </p>
                      <p className="text-sm text-gray-500">
                        Archivos soportados: Excel (.xlsx, .xls) y CSV (.csv)
                      </p>
                    </>
                  )}
                </div>

                {uploadedData && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Check className="w-6 h-6 text-green-600" />
                      <span className="font-bold text-green-900">Archivo cargado exitosamente</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Filas:</span>
                        <span className="ml-2 font-bold">{uploadedData.rowCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Columnas:</span>
                        <span className="ml-2 font-bold">{uploadedData.columns?.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Examples */}
            <TabsContent value="examples">
              <div className="bg-white rounded-3xl p-8 border border-pink-100">
                <h3 className="text-2xl font-heading font-bold text-pink-900 mb-6">
                  Datasets de Ejemplo
                </h3>
                <p className="text-gray-600 mb-6">
                  Cargá estos datasets para practicar análisis estadístico
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exampleDatasets.map((example) => (
                    <div
                      key={example.id}
                      className="bg-pink-50 rounded-2xl p-6 border border-pink-100 hover:border-pink-300 transition-colors"
                    >
                      <h4 className="font-heading font-bold text-pink-900 mb-2">
                        {example.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {example.description}
                      </p>
                      <Button
                        onClick={() => loadExampleDataset(example)}
                        variant="outline"
                        className="w-full"
                        data-testid={`load-example-${example.id}`}
                      >
                        Cargar Ejemplo
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice">
              <div className="bg-white rounded-3xl p-8 border border-pink-100">
                <div className="text-center py-12">
                  <Mic className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    Entrada por Voz
                  </h3>
                  <p className="text-gray-600">
                    Esta funcionalidad estará disponible próximamente
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoadData;
