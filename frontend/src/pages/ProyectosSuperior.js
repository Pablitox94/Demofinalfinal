import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, FolderOpen, Trash2, Edit, Play, Upload, 
  FileSpreadsheet, Zap, TrendingUp, GraduationCap
} from 'lucide-react';
import SidebarSuperior from '../components/SidebarSuperior';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import localStorageService from '../services/localStorageService';

const ProyectosSuperior = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    analysisType: 'univariado',
    description: ''
  });

  // Proyectos de ejemplo complejos para nivel superior
  const exampleProjects = [
    {
      id: 'rendimiento_academico',
      title: '📚 Rendimiento Académico Universitario',
      type: 'multivariado',
      variableType: 'cuantitativa_continua',
      description: 'Análisis de factores que influyen en el rendimiento académico: horas de estudio, asistencia, trabajo, sueño y calificaciones',
      icon: '📚',
      color: 'from-emerald-500 to-teal-500',
      data: {
        horas_estudio: [4.5, 6.2, 3.8, 7.1, 5.5, 8.0, 4.0, 6.8, 5.2, 7.5, 3.5, 6.0, 7.8, 4.2, 5.8, 6.5, 8.2, 3.2, 7.0, 5.0, 6.3, 4.8, 7.2, 5.5, 6.8, 4.5, 7.5, 5.2, 6.0, 8.5, 3.8, 6.2, 7.0, 4.0, 5.8, 6.5, 7.8, 4.2, 6.0, 5.5],
        asistencia: [85, 92, 70, 95, 88, 98, 75, 90, 82, 96, 68, 88, 94, 78, 86, 91, 97, 65, 93, 80, 89, 76, 94, 84, 92, 73, 95, 81, 87, 99, 72, 90, 93, 74, 85, 91, 96, 77, 88, 83],
        horas_trabajo: [0, 4, 8, 0, 6, 0, 10, 4, 8, 0, 12, 6, 0, 10, 4, 2, 0, 15, 0, 8, 4, 10, 0, 6, 2, 12, 0, 8, 4, 0, 10, 4, 0, 12, 6, 2, 0, 8, 4, 6],
        horas_sueno: [7.5, 7.0, 6.0, 8.0, 6.5, 7.5, 5.5, 7.0, 6.5, 8.0, 5.0, 7.0, 7.5, 6.0, 7.0, 7.5, 8.0, 5.5, 7.5, 6.5, 7.0, 6.0, 8.0, 7.0, 7.5, 5.5, 8.0, 6.5, 7.0, 8.5, 6.0, 7.0, 7.5, 5.5, 7.0, 7.5, 8.0, 6.0, 7.0, 6.5],
        promedio: [7.8, 8.5, 6.2, 9.2, 7.5, 9.5, 6.0, 8.2, 7.0, 9.0, 5.5, 7.8, 9.0, 6.5, 7.6, 8.3, 9.4, 5.0, 8.8, 6.8, 8.0, 6.3, 9.1, 7.5, 8.5, 5.8, 9.2, 7.0, 7.8, 9.6, 6.0, 8.2, 8.8, 5.8, 7.5, 8.4, 9.3, 6.2, 7.8, 7.2]
      }
    },
    {
      id: 'salarios_tech',
      title: '💼 Salarios en Tecnología',
      type: 'multivariado',
      variableType: 'cuantitativa_continua',
      description: 'Análisis de salarios en el sector tecnológico según experiencia, educación y especialización',
      icon: '💼',
      color: 'from-blue-500 to-indigo-500',
      data: {
        experiencia_anios: [1, 2, 3, 5, 7, 10, 12, 15, 1, 3, 5, 8, 10, 2, 4, 6, 9, 11, 14, 1, 2, 4, 6, 8, 10, 13, 3, 5, 7, 9, 12, 15, 2, 4, 6, 8, 11, 14, 1, 3],
        educacion: [1, 1, 2, 2, 2, 3, 3, 3, 1, 2, 2, 2, 3, 1, 2, 2, 3, 3, 3, 1, 1, 2, 2, 2, 3, 3, 2, 2, 2, 3, 3, 3, 1, 2, 2, 2, 3, 3, 1, 2],
        salario_mensual: [45000, 52000, 68000, 95000, 120000, 180000, 210000, 280000, 42000, 72000, 98000, 135000, 195000, 48000, 78000, 105000, 155000, 220000, 290000, 40000, 50000, 82000, 108000, 140000, 200000, 250000, 70000, 100000, 125000, 160000, 230000, 300000, 46000, 80000, 110000, 145000, 225000, 285000, 38000, 65000]
      }
    },
    {
      id: 'clima_cosecha',
      title: '🌾 Clima y Rendimiento de Cosecha',
      type: 'multivariado',
      variableType: 'cuantitativa_continua',
      description: 'Estudio de la relación entre variables climáticas y el rendimiento agrícola',
      icon: '🌾',
      color: 'from-amber-500 to-orange-500',
      data: {
        temperatura_media: [18.5, 22.3, 25.1, 19.8, 24.2, 21.5, 23.8, 20.1, 26.3, 17.9, 22.8, 24.5, 19.2, 21.8, 25.8, 18.2, 23.1, 20.5, 24.8, 22.0, 19.5, 25.5, 21.2, 23.5, 18.8, 24.0, 20.8, 22.5, 26.0, 19.0, 21.0, 24.2, 17.5, 23.8, 20.2, 25.2, 22.8, 19.8, 24.5, 21.5],
        precipitacion_mm: [120, 85, 45, 150, 60, 95, 55, 130, 35, 180, 75, 50, 140, 90, 40, 160, 70, 110, 48, 82, 145, 42, 100, 58, 170, 52, 115, 78, 38, 155, 105, 62, 190, 55, 125, 45, 72, 138, 50, 88],
        humedad_relativa: [65, 55, 45, 70, 50, 60, 48, 68, 42, 75, 58, 47, 72, 62, 44, 78, 52, 64, 46, 56, 74, 43, 58, 49, 76, 50, 66, 54, 41, 73, 60, 51, 80, 48, 67, 44, 55, 71, 47, 57],
        rendimiento_ton: [4.2, 3.8, 2.5, 4.8, 3.2, 4.0, 2.8, 4.5, 2.2, 5.2, 3.6, 2.6, 4.6, 3.9, 2.4, 5.0, 3.4, 4.2, 2.7, 3.7, 4.7, 2.3, 3.8, 2.9, 5.1, 2.8, 4.3, 3.5, 2.1, 4.9, 4.1, 3.0, 5.4, 2.7, 4.4, 2.5, 3.5, 4.6, 2.6, 3.6]
      }
    },
    {
      id: 'experimento_medico',
      title: '🏥 Ensayo Clínico - Eficacia de Tratamiento',
      type: 'multivariado',
      variableType: 'cuantitativa_continua',
      description: 'Datos de ensayo clínico comparando tratamiento vs placebo en reducción de presión arterial',
      icon: '🏥',
      color: 'from-red-500 to-pink-500',
      data: {
        grupo: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        edad: [45, 52, 38, 61, 55, 48, 42, 58, 35, 65, 50, 44, 57, 40, 63, 47, 53, 39, 60, 46, 43, 56, 37, 62, 49, 41, 59, 36, 64, 51, 45, 54, 38, 61, 48, 42, 58, 35, 66, 52],
        presion_inicial: [145, 152, 138, 160, 148, 142, 155, 158, 140, 165, 150, 144, 156, 136, 162, 146, 154, 139, 159, 147, 144, 153, 137, 161, 149, 141, 157, 135, 163, 151, 145, 155, 138, 160, 148, 143, 158, 136, 164, 152],
        presion_final: [128, 130, 125, 138, 126, 124, 132, 135, 122, 142, 129, 123, 133, 120, 140, 125, 131, 121, 136, 127, 142, 150, 136, 158, 147, 140, 155, 134, 160, 149, 143, 152, 137, 157, 146, 141, 156, 135, 161, 150]
      }
    }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const superiorProjects = await localStorageService.getProjects('superior');
      setProjects(superiorProjects);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }

    try {
      const createdProject = await localStorageService.createProject({
        ...newProject,
        educationLevel: 'superior'
      });
      
      toast.success('Proyecto creado exitosamente');
      setShowCreateDialog(false);
      setNewProject({ name: '', analysisType: 'univariado', description: '' });
      
      localStorage.setItem('currentProjectId', createdProject.id);
      navigate('/carga-datos-superior');
    } catch (error) {
      console.error('Error creando proyecto:', error);
      toast.error('Error al crear proyecto');
    }
  };

  const loadExampleProject = async (example) => {
    try {
      const newProject = await localStorageService.createProject({
        name: example.title,
        educationLevel: 'superior',
        analysisType: example.type,
        description: example.description
      });
      
      const projectId = newProject.id;

      // Crear variables a partir de los datos del ejemplo
      const variableNames = Object.keys(example.data);
      const firstVarLength = example.data[variableNames[0]].length;
      
      const rawData = [];
      for (let i = 0; i < firstVarLength; i++) {
        const row = { index: i + 1 };
        variableNames.forEach(varName => {
          row[varName] = example.data[varName][i];
        });
        rawData.push(row);
      }

      const variables = variableNames.map(varName => ({
        name: varName,
        type: example.variableType,
        values: example.data[varName]
      }));

      const datasetPayload = {
        projectId: projectId,
        rawData: rawData,
        variables: variables,
        source: 'example'
      };

      await localStorageService.createDataset(datasetPayload);
      
      toast.success(`Proyecto "${example.title}" cargado exitosamente`);
      loadProjects();
    } catch (error) {
      console.error('Error cargando proyecto de ejemplo:', error);
      toast.error('Error al cargar proyecto de ejemplo');
    }
  };

  const deleteProject = async (projectId, projectName) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${projectName}"?`)) return;

    try {
      await localStorageService.deleteProject(projectId);
      toast.success('Proyecto eliminado');
      loadProjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar proyecto');
    }
  };

  const editProject = (project) => {
    setEditingProject(project);
    setShowEditDialog(true);
  };

  const saveEditedProject = async () => {
    if (!editingProject) return;

    try {
      await localStorageService.updateProject(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        analysisType: editingProject.analysisType
      });
      
      toast.success('Proyecto actualizado');
      setShowEditDialog(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar proyecto');
    }
  };

  const continueProject = (projectId) => {
    localStorage.setItem('currentProjectId', projectId);
    navigate('/carga-datos-superior');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const projectData = JSON.parse(text);
      
      const newProject = await localStorageService.createProject({
        name: projectData.name || 'Proyecto Importado',
        educationLevel: 'superior',
        analysisType: projectData.analysisType || 'univariado',
        description: projectData.description || 'Proyecto importado desde archivo'
      });

      if (projectData.datasets && projectData.datasets.length > 0) {
        for (const dataset of projectData.datasets) {
          await localStorageService.createDataset({
            ...dataset,
            projectId: newProject.id
          });
        }
      }

      toast.success('Proyecto importado exitosamente');
      loadProjects();
    } catch (error) {
      console.error('Error importando proyecto:', error);
      toast.error('Error al importar proyecto. Verificá el formato del archivo.');
    }
    
    event.target.value = '';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <SidebarSuperior />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mis Proyectos" educationLevel="superior" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3">
                  <GraduationCap className="w-10 h-10" />
                  Mis Proyectos
                </h1>
                <p className="text-emerald-100 text-lg">
                  Proyectos de análisis estadístico avanzado para nivel universitario
                </p>
              </div>
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  data-testid="import-project-button"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Importar Proyecto
                </Button>
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-emerald-600 hover:bg-emerald-50" data-testid="create-project-button">
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Nuevo Proyecto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Crear Nuevo Proyecto</DialogTitle>
                      <DialogDescription>
                        Completá la información para crear tu proyecto de análisis avanzado
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Proyecto</Label>
                        <Input
                          id="name"
                          data-testid="project-name-input"
                          placeholder="Ej: Análisis de Regresión Múltiple"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="analysisType">Tipo de Análisis</Label>
                        <Select
                          value={newProject.analysisType}
                          onValueChange={(value) => setNewProject({ ...newProject, analysisType: value })}
                        >
                          <SelectTrigger data-testid="analysis-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="univariado">Univariado</SelectItem>
                            <SelectItem value="multivariado">Multivariado</SelectItem>
                            <SelectItem value="regresion">Regresión</SelectItem>
                            <SelectItem value="inferencia">Inferencia Estadística</SelectItem>
                            <SelectItem value="experimental">Diseño Experimental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe brevemente tu proyecto, hipótesis y objetivos"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createProject} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-create-project">
                        Crear y Cargar Datos
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Proyectos de Ejemplo */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Proyectos de Ejemplo (Datasets Complejos)
            </h2>
            <p className="text-gray-600 mb-6">
              Datasets reales con múltiples variables para practicar análisis estadístico avanzado
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exampleProjects.map((example) => (
                <div
                  key={example.id}
                  className="bg-white rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg"
                  data-testid={`example-project-${example.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{example.icon}</div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${example.color}`}>
                        {example.type === 'multivariado' ? 'Multivariable' : 'Univariable'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Object.keys(example.data).length} variables • {example.data[Object.keys(example.data)[0]].length} registros
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">{example.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{example.description}</p>
                  <div className="text-xs text-gray-500 mb-4">
                    <strong>Variables:</strong> {Object.keys(example.data).join(', ')}
                  </div>
                  <Button
                    onClick={() => loadExampleProject(example)}
                    className={`w-full bg-gradient-to-r ${example.color} text-white`}
                    data-testid={`load-example-${example.id}`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Cargar Proyecto
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Mis Proyectos */}
          <div>
            <h2 className="text-2xl font-heading font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-emerald-600" />
              Mis Proyectos
            </h2>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Cargando proyectos...
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-emerald-100" data-testid="no-projects-message">
                <GraduationCap className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-2xl font-heading font-bold text-emerald-900 mb-3">
                  No tenés proyectos aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Creá tu primer proyecto o cargá uno de los ejemplos de arriba
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Crear Primer Proyecto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    data-testid={`project-card-${project.id}`}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => editProject(project)}
                          className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center"
                          data-testid={`edit-project-${project.id}`}
                        >
                          <Edit className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id, project.name)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                          data-testid={`delete-project-${project.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-emerald-900 text-xl mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description || 'Sin descripción'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold">
                        {project.analysisType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    <Button
                      onClick={() => continueProject(project.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      data-testid={`continue-project-${project.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continuar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Editar Proyecto</DialogTitle>
                <DialogDescription>
                  Modificá la información de tu proyecto
                </DialogDescription>
              </DialogHeader>
              {editingProject && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Nombre del Proyecto</Label>
                    <Input
                      id="edit-name"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-analysis">Tipo de Análisis</Label>
                    <Select
                      value={editingProject.analysisType}
                      onValueChange={(value) => setEditingProject({ ...editingProject, analysisType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="univariado">Univariado</SelectItem>
                        <SelectItem value="multivariado">Multivariado</SelectItem>
                        <SelectItem value="regresion">Regresión</SelectItem>
                        <SelectItem value="inferencia">Inferencia Estadística</SelectItem>
                        <SelectItem value="experimental">Diseño Experimental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Descripción</Label>
                    <Textarea
                      id="edit-description"
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveEditedProject} className="bg-emerald-600 hover:bg-emerald-700">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProyectosSuperior;
