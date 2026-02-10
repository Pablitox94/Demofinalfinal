import React, { useState } from 'react';
import { 
  Gamepad2, Play, RefreshCw, CheckCircle, XCircle, TrendingUp,
  Target, Dice6, Calculator, BarChart3, Percent, Construction 
} from 'lucide-react';
import SidebarSecundario from '../components/SidebarSecundario';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const ActividadesSecundario = () => {

  // ==========================================
  // VISTA ACTUAL: EN DESARROLLO
  // ==========================================
  // Mostramos solo el cartel. El código de las actividades está comentado más abajo para preservarlo.

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Actividades Interactivas" educationLevel="secundario" />
        
        <div className="p-8 flex items-center justify-center min-h-[calc(100vh-100px)]">
           
           {/* CARTEL EN DESARROLLO */}
           <div className="bg-purple-100 border-l-8 border-purple-500 rounded-2xl p-12 shadow-xl flex flex-col items-center justify-center text-center max-w-2xl animate-pulse">
             <div className="bg-purple-500 p-6 rounded-full text-white mb-6 shadow-lg">
               <Construction className="w-20 h-20" />
             </div>
             <h3 className="text-5xl font-heading font-black text-purple-800 mb-6">En desarrollo 🚀</h3>
             <p className="text-purple-700 font-medium text-2xl leading-relaxed">
               Estamos preparando nuevas simulaciones y ejercicios interactivos para el nivel secundario. <br/>
               <span className="font-bold text-purple-900">¡Pronto estarán disponibles!</span>
             </p>
          </div>

        </div>
      </div>
    </div>
  );

  /*
  // ==========================================
  // CÓDIGO ORIGINAL (GUARDADO / COMENTADO)
  // ==========================================
  // Descomentar este bloque para restaurar la funcionalidad completa de las actividades.

  const [activeActivity, setActiveActivity] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Estados para cada actividad
  const [simulationData, setSimulationData] = useState({ n: 30, runs: 100, results: [] });
  const [hypothesisGame, setHypothesisGame] = useState({ currentQ: 0, answers: [], questions: [] });
  const [regressionGame, setRegressionGame] = useState({ points: [], userSlope: '', userIntercept: '', correct: null });
  const [correlationGame, setCorrelationGame] = useState({ scatter: [], userGuess: '', correct: null });
  const [intervalGame, setIntervalGame] = useState({ mean: 0, se: 0, userLower: '', userUpper: '', correct: null });

  const activities = [
    {
      id: 'clt_simulation',
      title: 'Simulación del Teorema Central del Límite',
      description: 'Visualizá cómo la distribución de medias muestrales tiende a la normalidad',
      icon: BarChart3,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'hypothesis_test',
      title: 'Pruebas de Hipótesis',
      description: 'Practicá la interpretación de pruebas de hipótesis',
      icon: Target,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'regression_game',
      title: 'Estimación de Regresión',
      description: 'Estimá la línea de regresión a partir de un gráfico de dispersión',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'correlation_game',
      title: 'Adivinar la Correlación',
      description: 'Estimá el coeficiente de correlación a partir de un gráfico',
      icon: Percent,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'confidence_interval',
      title: 'Intervalos de Confianza',
      description: 'Calculá intervalos de confianza para la media',
      icon: Calculator,
      color: 'from-violet-500 to-purple-500'
    }
  ];

  // Simulación del Teorema Central del Límite
  const runCLTSimulation = () => {
    const results = [];
    for (let i = 0; i < simulationData.runs; i++) {
      // Generar muestra de distribución uniforme (0,1) y calcular media
      let sum = 0;
      for (let j = 0; j < simulationData.n; j++) {
        sum += Math.random();
      }
      const mean = sum / simulationData.n;
      results.push(mean);
    }
    
    // Crear histograma de frecuencias
    const bins = 20;
    const minVal = Math.min(...results);
    const maxVal = Math.max(...results);
    const binWidth = (maxVal - minVal) / bins;
    const histogram = Array(bins).fill(0);
    
    results.forEach(val => {
      const binIndex = Math.min(Math.floor((val - minVal) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    setSimulationData(prev => ({ ...prev, results, histogram, minVal, maxVal, binWidth }));
    toast.success('Simulación completada');
  };

  // Pruebas de Hipótesis - Generar pregunta
  const generateHypothesisQuestion = () => {
    const scenarios = [
      { pValue: 0.03, alpha: 0.05, reject: true, context: 'Un estudio farmacéutico obtuvo p-valor = 0.03 con α = 0.05' },
      { pValue: 0.08, alpha: 0.05, reject: false, context: 'Un análisis de calidad obtuvo p-valor = 0.08 con α = 0.05' },
      { pValue: 0.001, alpha: 0.01, reject: true, context: 'Un experimento obtuvo p-valor = 0.001 con α = 0.01' },
      { pValue: 0.04, alpha: 0.01, reject: false, context: 'Un test estadístico dio p-valor = 0.04 con α = 0.01' },
      { pValue: 0.02, alpha: 0.10, reject: true, context: 'Una investigación reportó p-valor = 0.02 con α = 0.10' }
    ];
    
    const question = scenarios[Math.floor(Math.random() * scenarios.length)];
    setHypothesisGame(prev => ({
      ...prev,
      questions: [...prev.questions, question],
      currentQ: prev.questions.length
    }));
  };

  const answerHypothesis = (userReject) => {
    const currentQuestion = hypothesisGame.questions[hypothesisGame.currentQ];
    const isCorrect = userReject === currentQuestion.reject;
    
    setHypothesisGame(prev => ({
      ...prev,
      answers: [...prev.answers, { ...currentQuestion, userAnswer: userReject, correct: isCorrect }]
    }));
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast.success('¡Correcto!');
    } else {
      toast.error(`Incorrecto. Con p-valor = ${currentQuestion.pValue} y α = ${currentQuestion.alpha}, ${currentQuestion.reject ? 'se rechaza' : 'no se rechaza'} H₀`);
    }
    setTotalQuestions(prev => prev + 1);
  };

  // Regresión - Generar puntos
  const generateRegressionPoints = () => {
    const n = 15;
    const trueSlope = (Math.random() * 4 - 2).toFixed(2); // -2 a 2
    const trueIntercept = (Math.random() * 10).toFixed(2);
    const points = [];
    
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 10;
      const noise = (Math.random() - 0.5) * 4;
      const y = parseFloat(trueSlope) * x + parseFloat(trueIntercept) + noise;
      points.push({ x: x.toFixed(2), y: y.toFixed(2) });
    }
    
    setRegressionGame({ points, trueSlope, trueIntercept, userSlope: '', userIntercept: '', correct: null });
  };

  const checkRegression = () => {
    const userS = parseFloat(regressionGame.userSlope);
    const userI = parseFloat(regressionGame.userIntercept);
    const trueS = parseFloat(regressionGame.trueSlope);
    const trueI = parseFloat(regressionGame.trueIntercept);
    
    const slopeTolerance = Math.abs(trueS) * 0.3 + 0.3;
    const interceptTolerance = Math.abs(trueI) * 0.3 + 1;
    
    const slopeOk = Math.abs(userS - trueS) < slopeTolerance;
    const interceptOk = Math.abs(userI - trueI) < interceptTolerance;
    
    const correct = slopeOk && interceptOk;
    setRegressionGame(prev => ({ ...prev, correct }));
    
    if (correct) {
      setScore(prev => prev + 1);
      toast.success('¡Excelente estimación!');
    } else {
      toast.error(`La línea real es: y = ${trueI} + ${trueS}x`);
    }
    setTotalQuestions(prev => prev + 1);
  };

  // Correlación - Generar scatter
  const generateCorrelationScatter = () => {
    const n = 20;
    const trueR = (Math.random() * 1.8 - 0.9).toFixed(2); // -0.9 a 0.9
    const points = [];
    
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 10;
      let y;
      if (parseFloat(trueR) >= 0) {
        y = x * parseFloat(trueR) + (Math.random() - 0.5) * 5 * (1 - Math.abs(parseFloat(trueR)));
      } else {
        y = 10 - x * Math.abs(parseFloat(trueR)) + (Math.random() - 0.5) * 5 * (1 - Math.abs(parseFloat(trueR)));
      }
      points.push({ x: x.toFixed(2), y: y.toFixed(2) });
    }
    
    setCorrelationGame({ scatter: points, trueR, userGuess: '', correct: null });
  };

  const checkCorrelation = () => {
    const userR = parseFloat(correlationGame.userGuess);
    const trueR = parseFloat(correlationGame.trueR);
    
    const correct = Math.abs(userR - trueR) < 0.25;
    setCorrelationGame(prev => ({ ...prev, correct }));
    
    if (correct) {
      setScore(prev => prev + 1);
      toast.success('¡Buena estimación!');
    } else {
      toast.error(`El coeficiente real era r = ${trueR}`);
    }
    setTotalQuestions(prev => prev + 1);
  };

  // Intervalo de Confianza
  const generateIntervalProblem = () => {
    const mean = (Math.random() * 100 + 50).toFixed(2);
    const se = (Math.random() * 5 + 1).toFixed(2);
    const z = 1.96; // 95% confianza
    
    const trueLower = (parseFloat(mean) - z * parseFloat(se)).toFixed(2);
    const trueUpper = (parseFloat(mean) + z * parseFloat(se)).toFixed(2);
    
    setIntervalGame({ mean, se, z, trueLower, trueUpper, userLower: '', userUpper: '', correct: null });
  };

  const checkInterval = () => {
    const userL = parseFloat(intervalGame.userLower);
    const userU = parseFloat(intervalGame.userUpper);
    const trueL = parseFloat(intervalGame.trueLower);
    const trueU = parseFloat(intervalGame.trueUpper);
    
    const correct = Math.abs(userL - trueL) < 0.5 && Math.abs(userU - trueU) < 0.5;
    setIntervalGame(prev => ({ ...prev, correct }));
    
    if (correct) {
      setScore(prev => prev + 1);
      toast.success('¡Correcto!');
    } else {
      toast.error(`El IC correcto es [${trueL}, ${trueU}]`);
    }
    setTotalQuestions(prev => prev + 1);
  };

  const renderActivity = () => {
    switch (activeActivity) {
      case 'clt_simulation':
        return (
          <div className="bg-white rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Simulación del Teorema Central del Límite</h3>
            <p className="text-gray-600 mb-6">
              Generamos muestras de una distribución uniforme y calculamos sus medias. 
              Observá cómo la distribución de medias se aproxima a una normal.
            </p>
            
            <div className="flex gap-4 mb-6">
              <div>
                <Label>Tamaño de muestra (n)</Label>
                <Input
                  type="number"
                  value={simulationData.n}
                  onChange={(e) => setSimulationData(prev => ({ ...prev, n: parseInt(e.target.value) || 30 }))}
                  className="w-24"
                />
              </div>
              <div>
                <Label>Número de simulaciones</Label>
                <Input
                  type="number"
                  value={simulationData.runs}
                  onChange={(e) => setSimulationData(prev => ({ ...prev, runs: parseInt(e.target.value) || 100 }))}
                  className="w-24"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={runCLTSimulation} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" />
                  Ejecutar
                </Button>
              </div>
            </div>

            {simulationData.histogram && (
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-bold text-purple-900 mb-4">Distribución de Medias Muestrales</h4>
                <div className="flex items-end gap-1 h-40">
                  {simulationData.histogram.map((count, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-500 rounded-t flex-1"
                      style={{ height: `${(count / Math.max(...simulationData.histogram)) * 100}%` }}
                      title={`Frecuencia: ${count}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{simulationData.minVal?.toFixed(3)}</span>
                  <span>Media de medias: {(simulationData.results.reduce((a,b)=>a+b,0)/simulationData.results.length).toFixed(4)}</span>
                  <span>{simulationData.maxVal?.toFixed(3)}</span>
                </div>
                <p className="text-sm text-purple-800 mt-4">
                  Teoría: Para U(0,1), la media poblacional = 0.5. Con n={simulationData.n} muestras, 
                  la distribución de medias debería aproximarse a N(0.5, σ/√n)
                </p>
              </div>
            )}
          </div>
        );

      case 'hypothesis_test':
        return (
          <div className="bg-white rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Pruebas de Hipótesis</h3>
            <p className="text-gray-600 mb-6">
              Dado un p-valor y nivel de significancia, decidí si rechazás o no la hipótesis nula.
            </p>
            
            <Button onClick={generateHypothesisQuestion} className="bg-blue-600 hover:bg-blue-700 mb-6">
              <Dice6 className="w-4 h-4 mr-2" />
              Nueva Pregunta
            </Button>

            {hypothesisGame.questions.length > 0 && hypothesisGame.currentQ < hypothesisGame.questions.length && (
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-lg text-blue-900 mb-4">
                  {hypothesisGame.questions[hypothesisGame.currentQ].context}
                </p>
                <p className="font-bold text-blue-900 mb-4">¿Rechazás H₀?</p>
                <div className="flex gap-4">
                  <Button onClick={() => answerHypothesis(true)} className="bg-red-500 hover:bg-red-600">
                    Sí, Rechazo H₀
                  </Button>
                  <Button onClick={() => answerHypothesis(false)} className="bg-green-500 hover:bg-green-600">
                    No Rechazo H₀
                  </Button>
                </div>
              </div>
            )}

            {hypothesisGame.answers.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-gray-900 mb-2">Historial:</h4>
                <div className="space-y-2">
                  {hypothesisGame.answers.slice(-5).map((a, idx) => (
                    <div key={idx} className={`p-3 rounded-lg flex items-center gap-2 ${a.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                      {a.correct ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                      <span className="text-sm">p={a.pValue}, α={a.alpha} → {a.reject ? 'Rechazar' : 'No rechazar'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'regression_game':
        return (
          <div className="bg-white rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Estimación de Regresión</h3>
            <p className="text-gray-600 mb-6">
              Observá los puntos y estimá la pendiente (β₁) y ordenada al origen (β₀) de la recta de regresión.
            </p>
            
            <Button onClick={generateRegressionPoints} className="bg-orange-600 hover:bg-orange-700 mb-6">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Puntos
            </Button>

            {regressionGame.points.length > 0 && (
              <>
                <div className="bg-orange-50 rounded-xl p-4 mb-4">
                  <div className="relative h-64 border border-orange-200 rounded bg-white">
                    {regressionGame.points.map((p, idx) => (
                      <div
                        key={idx}
                        className="absolute w-3 h-3 bg-orange-500 rounded-full"
                        style={{
                          left: `${(parseFloat(p.x) / 10) * 90 + 5}%`,
                          bottom: `${(parseFloat(p.y) / 15) * 90 + 5}%`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 items-end mb-4">
                  <div>
                    <Label>β₀ (Intercepto)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={regressionGame.userIntercept}
                      onChange={(e) => setRegressionGame(prev => ({ ...prev, userIntercept: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                  <div>
                    <Label>β₁ (Pendiente)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={regressionGame.userSlope}
                      onChange={(e) => setRegressionGame(prev => ({ ...prev, userSlope: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                  <Button onClick={checkRegression} className="bg-orange-600 hover:bg-orange-700">
                    Verificar
                  </Button>
                </div>

                {regressionGame.correct !== null && (
                  <div className={`p-4 rounded-xl ${regressionGame.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                    {regressionGame.correct ? (
                      <p className="text-green-900 font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> ¡Excelente estimación!
                      </p>
                    ) : (
                      <p className="text-red-900">Línea real: y = {regressionGame.trueIntercept} + {regressionGame.trueSlope}x</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'correlation_game':
        return (
          <div className="bg-white rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Adivinar la Correlación</h3>
            <p className="text-gray-600 mb-6">
              Estimá el coeficiente de correlación (r) observando el gráfico de dispersión. Rango: -1 a 1.
            </p>
            
            <Button onClick={generateCorrelationScatter} className="bg-pink-600 hover:bg-pink-700 mb-6">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nuevo Gráfico
            </Button>

            {correlationGame.scatter.length > 0 && (
              <>
                <div className="bg-pink-50 rounded-xl p-4 mb-4">
                  <div className="relative h-64 border border-pink-200 rounded bg-white">
                    {correlationGame.scatter.map((p, idx) => (
                      <div
                        key={idx}
                        className="absolute w-3 h-3 bg-pink-500 rounded-full"
                        style={{
                          left: `${(parseFloat(p.x) / 10) * 90 + 5}%`,
                          bottom: `${(parseFloat(p.y) / 10) * 90 + 5}%`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 items-end mb-4">
                  <div>
                    <Label>Tu estimación de r (-1 a 1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="-1"
                      max="1"
                      value={correlationGame.userGuess}
                      onChange={(e) => setCorrelationGame(prev => ({ ...prev, userGuess: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                  <Button onClick={checkCorrelation} className="bg-pink-600 hover:bg-pink-700">
                    Verificar
                  </Button>
                </div>

                {correlationGame.correct !== null && (
                  <div className={`p-4 rounded-xl ${correlationGame.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                    {correlationGame.correct ? (
                      <p className="text-green-900 font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> ¡Buena estimación!
                      </p>
                    ) : (
                      <p className="text-red-900">El coeficiente real era r = {correlationGame.trueR}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'confidence_interval':
        return (
          <div className="bg-white rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Intervalos de Confianza</h3>
            <p className="text-gray-600 mb-6">
              Calculá el intervalo de confianza al 95% para la media. Fórmula: x̄ ± z·SE donde z = 1.96
            </p>
            
            <Button onClick={generateIntervalProblem} className="bg-violet-600 hover:bg-violet-700 mb-6">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nuevo Problema
            </Button>

            {intervalGame.mean && (
              <div className="bg-violet-50 rounded-xl p-6 mb-4">
                <p className="text-lg text-violet-900 mb-4">
                  <strong>Media muestral (x̄):</strong> {intervalGame.mean}<br />
                  <strong>Error estándar (SE):</strong> {intervalGame.se}<br />
                  <strong>Nivel de confianza:</strong> 95% (z = 1.96)
                </p>
                
                <div className="flex gap-4 items-end mb-4">
                  <div>
                    <Label>Límite inferior</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={intervalGame.userLower}
                      onChange={(e) => setIntervalGame(prev => ({ ...prev, userLower: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                  <div>
                    <Label>Límite superior</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={intervalGame.userUpper}
                      onChange={(e) => setIntervalGame(prev => ({ ...prev, userUpper: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                  <Button onClick={checkInterval} className="bg-violet-600 hover:bg-violet-700">
                    Verificar
                  </Button>
                </div>

                {intervalGame.correct !== null && (
                  <div className={`p-4 rounded-xl ${intervalGame.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                    {intervalGame.correct ? (
                      <p className="text-green-900 font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> ¡Correcto!
                      </p>
                    ) : (
                      <p className="text-red-900">IC correcto: [{intervalGame.trueLower}, {intervalGame.trueUpper}]</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Actividades Interactivas" educationLevel="secundario" />
        
        <div className="p-6">
          <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                  <Gamepad2 className="w-8 h-8" />
                  Actividades Interactivas
                </h1>
                <p className="text-purple-100">
                  Simulaciones y ejercicios prácticos para reforzar conceptos estadísticos
                </p>
              </div>
              <div className="text-right">
                <p className="text-purple-200 text-sm">Puntuación</p>
                <p className="text-3xl font-bold">{score}/{totalQuestions}</p>
              </div>
            </div>
          </div>

          {!activeActivity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    onClick={() => setActiveActivity(activity.id)}
                    className="bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${activity.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className=\"w-7 h-7 text-white\" />
                    </div>
                    <h3 className=\"text-xl font-bold text-purple-900 mb-2\">{activity.title}</h3>
                    <p className=\"text-gray-600 text-sm\">{activity.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <Button
                onClick={() => setActiveActivity(null)}
                variant=\"outline\"
                className=\"mb-6 border-purple-300 text-purple-700\"
              >
                ← Volver a actividades
              </Button>
              {renderActivity()}
            </>
          )}
        </div>
      </div>
    </div>
  );
  */
};

export default ActividadesSecundario;