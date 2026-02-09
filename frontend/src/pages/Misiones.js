import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Trophy, Plus, Play, Trash2, Upload } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { trackProjectCreated } from '../utils/achievementTracker';
import localStorageService from '../services/localStorageService';

const Misiones = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await localStorageService.getProjects('primario');
      setProjects(allProjects);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const importMission = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        // Validar estructura - aceptar múltiples formatos
        const hasProject = importedData.project || importedData.name;
        const hasDatasets = importedData.datasets || importedData.variables;
        
        if (!hasProject && !hasDatasets) {
          toast.error('Archivo inválido - debe contener proyecto y datos');
          return;
        }
        
        toast.info('Importando misión...');
        
        // Obtener nombre del proyecto (mantener el original)
        const projectName = importedData.project?.name || importedData.name || 'Misión Importada';
        
        // Crear proyecto localmente (mantener nombre original sin " (Importado)")
        const newProject = await localStorageService.createProject({
          name: projectName,
          description: importedData.project?.description || importedData.description || '',
          educationLevel: 'primario',
          analysisType: importedData.project?.analysisType || importedData.analysisType || 'univariado'
        });
        
        const newProjectId = newProject.id;
        
        // Importar datasets
        if (importedData.datasets && importedData.datasets.length > 0) {
          for (const dataset of importedData.datasets) {
            await localStorageService.createDataset({
              projectId: newProjectId,
              name: dataset.name,
              rawData: dataset.rawData || [],
              variables: dataset.variables || [],
              source: 'imported'
            });
          }
        } else if (importedData.variables) {
          // Formato simplificado
          await localStorageService.createDataset({
            projectId: newProjectId,
            name: 'datos',
            variables: importedData.variables,
            source: 'imported'
          });
        }
        
        toast.success('¡Misión importada exitosamente!');
        trackProjectCreated();
        
        // Recargar proyectos
        await loadProjects();
        
        // Guardar como proyecto actual
        localStorage.setItem('currentProjectId', newProjectId);
        window.dispatchEvent(new CustomEvent('projectChanged', { detail: newProjectId }));
        
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al importar misión - verificá el formato del archivo');
      }
    };
    
    input.click();
  };

  const exampleMissions = [
    {
      id: 'mundial_2026_cualitativo',
      title: '⚽ Mundial 2026: Países Favoritos',
      type: 'Cualitativo',
      description: '¿Cuál es el país favorito para ganar el Mundial? Preguntale a tus compañeros y hacé un gráfico.',
      icon: '⚽',
      color: 'from-blue-400 to-blue-600',
      difficulty: 'Fácil',
      points: 100,
      data: [
        'Argentina', 'Argentina', 'Brasil', 'Argentina', 'Francia',
        'Argentina', 'Brasil', 'Argentina', 'España', 'Argentina',
        'Brasil', 'Argentina', 'Inglaterra', 'Argentina', 'Brasil'
      ]
    },
    {
      id: 'mundial_2026_cuantitativo',
      title: '⚽ Mundial 2026: Cantidad de Goles',
      type: 'Cuantitativo',
      description: '¿Cuántos goles se marcan en cada partido? Analizamos los datos del mundial.',
      icon: '⚽',
      color: 'from-green-400 to-green-600',
      difficulty: 'Medio',
      points: 150,
      data: [2, 3, 1, 4, 2, 3, 2, 5, 1, 2, 3, 2, 4, 1, 3]
    },
    {
      id: 'deporte_favorito',
      title: '🎾 Deporte Favorito de la Clase',
      type: 'Cualitativo',
      description: '¿Qué deporte les gusta más? Encuesta a tus amigos y descubre el favorito.',
      icon: '🎾',
      color: 'from-purple-400 to-purple-600',
      difficulty: 'Fácil',
      points: 100,
      data: ['Fútbol', 'Fútbol', 'Basquet', 'Fútbol', 'Natación', 'Fútbol', 'Voley', 'Fútbol', 'Basquet', 'Fútbol']
    },
    {
      id: 'edad_hermanos',
      title: '👶 Edad de los Hermanos',
      type: 'Cuantitativo',
      description: '¿Qué edad tienen los hermanos de tus compañeros? Recopilá los datos y analizálos.',
      icon: '👶',
      color: 'from-pink-400 to-pink-600',
      difficulty: 'Medio',
      points: 150,
      data: [5, 8, 10, 7, 6, 9, 8, 11, 5, 7, 8, 6, 10, 9, 7]
    }
  ];

  const startMission = async (mission) => {
    try {
      const projectData = {
        name: mission.title,
        educationLevel: 'primario',
        analysisType: 'univariado',
        description: mission.description
      };

      const newProject = await localStorageService.createProject(projectData);
      const projectId = newProject.id;

      const datasetData = {
        projectId: projectId,
        rawData: mission.data.map((val, idx) => ({ index: idx + 1, valor: val })),
        variables: [{
          name: 'valor',
          type: mission.type === 'Cualitativo' ? 'cualitativa_nominal' : 'cuantitativa_discreta',
          values: mission.data
        }],
        source: 'example'
      };

      await localStorageService.createDataset(datasetData);
      
      // Track achievement
      trackProjectCreated(mission.title);
      
      toast.success(`¡Misión "${mission.title}" iniciada!`);
      loadProjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al iniciar la misión');
    }
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('¡Ingresá un nombre para tu misión!');
      return;
    }

    try {
      const newProject = await localStorageService.createProject({
        name: newProjectName,
        educationLevel: 'primario',
        analysisType: 'univariado',
        description: 'Misión creada por el estudiante'
      });

      toast.success('¡Misión creada!');
      setShowCreateDialog(false);
      setNewProjectName('');
      
      // Track achievement
      trackProjectCreated(newProjectName);
      
      // Redirigir a carga de datos con el ID del proyecto
      localStorage.setItem('currentProjectId', newProject.id);
      navigate('/carga-datos-primaria');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la misión');
    }
  };

  const deleteProject = async (projectId, projectName) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${projectName}"?`)) return;

    try {
      await localStorageService.deleteProject(projectId);
      toast.success('Misión eliminada');
      loadProjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la misión');
    }
  };

  const continueProject = (projectId) => {
    localStorage.setItem('currentProjectId', projectId);
    navigate('/carga-datos-primaria');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Mis Misiones" educationLevel="primario" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-heading font-black mb-2 flex items-center gap-3">
                  <Target className="w-12 h-12" />
                  ¡Misiones!
                </h1>
                <p className="text-2xl font-accent">
                  Elegí una misión y convertite en un experto en datos
                </p>
              </div>
              <div className="text-9xl">🎯</div>
            </div>
          </div>

          {/* Create New Mission Button */}
          <div className="mb-8 flex flex-wrap gap-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-8 py-4 text-xl font-bold">
                  <Plus className="w-6 h-6 mr-2" />
                  ¡Crear Mi Propia Misión!
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Crear Nueva Misión</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label className="text-lg mb-2 block">Nombre de tu Misión:</Label>
                  <Input
                    placeholder="Ej: Colores Favoritos de la Clase"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createNewProject} className="bg-pink-600 hover:bg-pink-700">
                    ¡Crear y Cargar Datos!
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={importMission}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full px-8 py-4 text-xl font-bold"
            >
              <Upload className="w-6 h-6 mr-2" />
              ¡Importar Misión!
            </Button>
          </div>

          {/* Example Missions */}
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6 flex items-center gap-3">
            🌟 Misiones Especiales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {exampleMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-white rounded-3xl p-8 border-4 border-blue-200 hover:border-blue-400 transition-all hover:scale-105 shadow-lg"
                data-testid={`mission-${mission.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-6xl">{mission.icon}</div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-4 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${mission.color}`}>
                      {mission.type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                      {mission.difficulty}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-heading font-bold text-gray-800 mb-3">
                  {mission.title}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">{mission.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">{mission.points} puntos</span>
                  </div>
                  <Button
                    onClick={() => startMission(mission)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full px-6 py-3 font-bold"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    ¡Empezar!
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* My Missions */}
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6 flex items-center gap-3">
            💼 Mis Misiones en Progreso
          </h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-4 border-gray-200">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-xl text-gray-600 mb-4">¡Aún no tenés misiones!</p>
              <p className="text-gray-500">Elegí una misión especial de arriba o creá la tuya</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-3xl p-6 border-4 border-green-200 hover:border-green-400 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-5xl">🏆</div>
                    <button
                      onClick={() => deleteProject(project.id, project.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-gray-800 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  <Button 
                    onClick={() => continueProject(project.id)}
                    variant="outline" 
                    className="w-full border-2 border-green-500 text-green-700 hover:bg-green-50 font-bold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Misiones;
