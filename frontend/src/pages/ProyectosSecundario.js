import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, FolderOpen, Trash2, Edit, Play, Upload, 
  FileSpreadsheet, Trophy, Zap, TrendingUp, Download
} from 'lucide-react';
import SidebarSecundario from '../components/SidebarSecundario';
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

const ProyectosSecundario = () => {
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

  const exampleProjects = [
    {
      id: 'mundial_cualitativo',
      title: '⚽ Mundial 2026: Países Favoritos',
      type: 'univariado',
      variableType: 'cualitativa_nominal',
      description: 'Encuesta sobre selecciones favoritas para ganar el Mundial 2026',
      icon: '⚽',
      color: 'from-blue-500 to-cyan-500',
      data: ['Argentina', 'Argentina', 'Brasil', 'Argentina', 'Francia', 'Argentina', 'Brasil', 'Argentina', 'España', 'Argentina', 'Brasil', 'Argentina', 'Alemania', 'Argentina', 'Francia', 'Argentina', 'Brasil', 'Argentina', 'España', 'Argentina', 'Brasil', 'Argentina', 'Argentina', 'Francia', 'Argentina']
    },
    {
      id: 'edades_cuantitativo',
      title: '📊 Edades de Estudiantes',
      type: 'univariado',
      variableType: 'cuantitativa_discreta',
      description: 'Análisis de edades de estudiantes de secundaria (13-17 años)',
      icon: '📊',
      color: 'from-purple-500 to-indigo-500',
      data: [13, 14, 13, 15, 14, 16, 13, 14, 15, 14, 13, 16, 14, 15, 13, 14, 17, 14, 15, 14, 13, 15, 14, 16, 15]
    },
    {
      id: 'estudio_calificaciones',
      title: '📚 Horas de Estudio vs Calificaciones',
      type: 'multivariado',
      variableType: 'cuantitativa_continua',
      description: 'Relación entre horas de estudio semanal y promedio de calificaciones',
      icon: '📚',
      color: 'from-emerald-500 to-teal-500',
      data: {
        horas_estudio: [2.5, 4.0, 3.5, 5.0, 2.0, 6.0, 3.0, 4.5, 5.5, 3.5, 4.0, 6.5, 2.5, 5.0, 4.5, 3.0, 5.5, 4.0, 6.0, 3.5],
        promedio: [6.5, 7.8, 7.2, 8.5, 6.0, 9.0, 7.0, 8.0, 8.8, 7.5, 7.8, 9.2, 6.8, 8.5, 8.2, 7.3, 8.7, 7.9, 9.1, 7.6]
      }
    }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await localStorageService.getProjects('secundario');
      setProjects(allProjects);
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
        educationLevel: 'secundario'
      });
      
      toast.success('Proyecto creado exitosamente');
      setShowCreateDialog(false);
      setNewProject({ name: '', analysisType: 'univariado', description: '' });
      
      localStorage.setItem('currentProjectId', createdProject.id);
      navigate('/carga-datos-secundario');
    } catch (error) {
      console.error('Error creando proyecto:', error);
      toast.error('Error al crear proyecto');
    }
  };

  const loadExampleProject = async (example) => {
    try {
      const newProject = await localStorageService.createProject({
        name: example.title,
        educationLevel: 'secundario',
        analysisType: example.type,
        description: example.description
      });
      
      const projectId = newProject.id;
      let datasetPayload;
      
      if (example.type === 'multivariado') {
        const rawData = example.data.horas_estudio.map((h, idx) => ({
          index: idx + 1,
          horas_estudio: h,
          promedio: example.data.promedio[idx]
        }));
        
        datasetPayload = {
          projectId: projectId,
          rawData: rawData,
          variables: [
            { name: 'horas_estudio', type: 'cuantitativa_continua', values: example.data.horas_estudio },
            { name: 'promedio', type: 'cuantitativa_continua', values: example.data.promedio }
          ],
          source: 'example'
        };
      } else {
        datasetPayload = {
          projectId: projectId,
          rawData: example.data.map((val, idx) => ({ index: idx + 1, valor: val })),
          variables: [{ name: 'valor', type: example.variableType, values: example.data }],
          source: 'example'
        };
      }

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
    navigate('/carga-datos-secundario');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const projectData = JSON.parse(text);
      
      const newProject = await localStorageService.createProject({
        name: projectData.name || 'Proyecto Importado',
        educationLevel: 'secundario',
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
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mis Proyectos" educationLevel="secundario" />
        
        <div className="p-8">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">📁 Mis Proyectos</h1>
                <p className="text-purple-100 text-lg">Creá, editá y gestioná tus proyectos de análisis estadístico</p>
              </div>
              <div className="flex gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" data-testid="import-project-button">
                  <Upload className="w-5 h-5 mr-2" />Importar Proyecto
                </Button>
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-purple-600 hover:bg-purple-50" data-testid="create-project-button">
                      <PlusCircle className="w-5 h-5 mr-2" />Nuevo Proyecto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Crear Nuevo Proyecto</DialogTitle>
                      <DialogDescription>Completá la información para crear tu proyecto de análisis</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Proyecto</Label>
                        <Input id="name" data-testid="project-name-input" placeholder="Ej: Encuesta de Opiniones" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="analysisType">¿El análisis será de una variable o multivariable?</Label>
                        <Select value={newProject.analysisType} onValueChange={(value) => setNewProject({ ...newProject, analysisType: value })}>
                          <SelectTrigger data-testid="analysis-type-select"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="univariado">Univariado (una variable)</SelectItem>
                            <SelectItem value="multivariado">Multivariado (varias variables)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Textarea id="description" placeholder="Describe brevemente tu proyecto" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                      <Button onClick={createProject} className="bg-purple-600 hover:bg-purple-700" data-testid="confirm-create-project">Crear y Cargar Datos</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />Proyectos de Ejemplo
            </h2>
            <p className="text-gray-600 mb-6">Cargá estos proyectos para practicar análisis estadístico con datos reales</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exampleProjects.map((example) => (
                <div key={example.id} className="bg-white rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg" data-testid={`example-project-${example.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{example.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${example.color}`}>
                      {example.type === 'multivariado' ? 'Multivariable' : 'Univariable'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-purple-900 mb-2">{example.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{example.description}</p>
                  <Button onClick={() => loadExampleProject(example)} className={`w-full bg-gradient-to-r ${example.color} text-white`} data-testid={`load-example-${example.id}`}>
                    <Play className="w-4 h-4 mr-2" />Cargar Proyecto
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-heading font-bold text-purple-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-purple-600" />Mis Proyectos
            </h2>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-purple-100" data-testid="no-projects-message">
                <FolderOpen className="w-20 h-20 text-purple-300 mx-auto mb-4" />
                <h3 className="text-2xl font-heading font-bold text-purple-900 mb-3">No tenés proyectos aún</h3>
                <p className="text-gray-600 mb-6">Creá tu primer proyecto o cargá uno de los ejemplos de arriba</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="w-5 h-5 mr-2" />Crear Primer Proyecto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} data-testid={`project-card-${project.id}`} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editProject(project)} className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center" data-testid={`edit-project-${project.id}`}>
                          <Edit className="w-4 h-4 text-purple-600" />
                        </button>
                        <button onClick={() => deleteProject(project.id, project.name)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center" data-testid={`delete-project-${project.id}`}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-purple-900 text-xl mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description || 'Sin descripción'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{project.analysisType}</span>
                      <span className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <Button onClick={() => continueProject(project.id)} className="w-full bg-purple-600 hover:bg-purple-700" data-testid={`continue-project-${project.id}`}>
                      <Play className="w-4 h-4 mr-2" />Continuar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Editar Proyecto</DialogTitle>
                <DialogDescription>Modificá la información de tu proyecto</DialogDescription>
              </DialogHeader>
              {editingProject && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Nombre del Proyecto</Label>
                    <Input id="edit-name" value={editingProject.name} onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-analysis">Tipo de Análisis</Label>
                    <Select value={editingProject.analysisType} onValueChange={(value) => setEditingProject({ ...editingProject, analysisType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="univariado">Univariado</SelectItem>
                        <SelectItem value="multivariado">Multivariado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Descripción</Label>
                    <Textarea id="edit-description" value={editingProject.description || ''} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
                <Button onClick={saveEditedProject} className="bg-purple-600 hover:bg-purple-700">Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProyectosSecundario;
