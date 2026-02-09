import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, FolderOpen, Trash2, Edit } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [educationLevel, setEducationLevel] = useState('secundario');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    educationLevel: 'secundario',
    analysisType: 'univariado',
    description: ''
  });

  useEffect(() => {
    const level = localStorage.getItem('educationLevel') || 'secundario';
    setEducationLevel(level);
    setNewProject(prev => ({ ...prev, educationLevel: level }));
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
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
      await axios.post(`${API}/projects`, newProject);
      toast.success('Proyecto creado exitosamente');
      setShowCreateDialog(false);
      setNewProject({
        name: '',
        educationLevel: educationLevel,
        analysisType: 'univariado',
        description: ''
      });
      loadProjects();
    } catch (error) {
      console.error('Error creando proyecto:', error);
      toast.error('Error al crear proyecto');
    }
  };

  return (
    <div className="flex min-h-screen bg-pink-50">
      <Sidebar educationLevel={educationLevel} />
      
      <div className="flex-1 ml-64">
        <Navbar projectName="Mis Proyectos" educationLevel={educationLevel} />
        
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-heading font-bold text-pink-900 mb-2">Mis Proyectos</h1>
              <p className="text-gray-600">Administrá tus proyectos de análisis estadístico</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="create-project-button">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                  <DialogDescription>
                    Completá la información para crear tu proyecto de análisis
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Proyecto</Label>
                    <Input
                      id="name"
                      data-testid="project-name-input"
                      placeholder="Ej: Animales Favoritos de la Clase"
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Describe brevemente tu proyecto"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createProject} data-testid="confirm-create-project">
                    Crear Proyecto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-pink-100" data-testid="no-projects-message">
              <FolderOpen className="w-20 h-20 text-pink-300 mx-auto mb-4" />
              <h3 className="text-2xl font-heading font-bold text-pink-900 mb-3">
                No tenés proyectos aún
              </h3>
              <p className="text-gray-600 mb-6">
                Creá tu primer proyecto para comenzar a analizar datos
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="btn-primary">
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
                  className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 border border-pink-100 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-pink-50 hover:bg-pink-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4 text-pink-600" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <h3 className="font-heading font-bold text-pink-900 text-xl mb-2 hover:text-pink-700 transition-colors">
                      {project.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 mb-4">
                    {project.description || 'Sin descripción'}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
                      {project.analysisType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;