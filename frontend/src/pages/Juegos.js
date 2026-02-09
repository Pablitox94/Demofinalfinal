import React, { useState, useEffect } from 'react';
import { Gamepad2, Star, Trophy, Play, RotateCcw, CheckCircle } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const Juegos = () => {
  const memoryCardTypes = ['📊', '📈', '📉', '🥧', '📋', '🎯'];
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  
  // Memory Game State
  const [memoryCards, setMemoryCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  
  // Sort Game State
  const [numbersList, setNumbersList] = useState([]);
  const [sortedNumbers, setSortedNumbers] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // Guess Chart Game State
  const [guessData, setGuessData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const games = [
    {
      id: 'quiz_estadistica',
      title: '🧠 Quiz de Estadística',
      description: 'Respondé preguntas sobre media, mediana y moda',
      icon: '🧠',
      color: 'from-purple-400 to-purple-600',
      difficulty: 'Fácil'
    },
    {
      id: 'memory_graficos',
      title: '🎴 Memoria de Gráficos',
      description: 'Encuentra las parejas de gráficos iguales',
      icon: '🎴',
      color: 'from-blue-400 to-blue-600',
      difficulty: 'Medio'
    },
    {
      id: 'ordena_datos',
      title: '🔢 Ordená los Datos',
      description: 'Arrastrá los números de menor a mayor',
      icon: '🔢',
      color: 'from-green-400 to-green-600',
      difficulty: 'Fácil'
    },
    {
      id: 'adivina_grafico',
      title: '🔍 Adivina el Gráfico',
      description: 'Mirá los datos y elegí el gráfico correcto',
      icon: '🔍',
      color: 'from-pink-400 to-pink-600',
      difficulty: 'Medio'
    }
  ];

  const quizQuestions = [
    {
      question: '¿Qué es la media?',
      options: ['El valor que más se repite', 'El promedio de todos los valores', 'El valor del medio', 'El valor más grande'],
      correct: 1
    },
    {
      question: '¿Qué es la mediana?',
      options: ['El promedio', 'El valor del medio cuando están ordenados', 'El valor que más se repite', 'La suma de todos'],
      correct: 1
    },
    {
      question: '¿Qué es la moda?',
      options: ['El promedio', 'El valor del medio', 'El valor que más se repite', 'El valor más pequeño'],
      correct: 2
    }
  ];

  const startGame = (gameId) => {
    setCurrentGame(gameId);
    setScore(0);
    setQuestionIndex(0);
    
    if (gameId === 'memory_graficos') {
      initMemoryGame();
    } else if (gameId === 'ordena_datos') {
      initSortGame();
    } else if (gameId === 'adivina_grafico') {
      initGuessGame();
    }
    
    toast.success('¡Juego iniciado! 🎮');
  };

  // QUIZ GAME
  const answerQuestion = (optionIndex) => {
    if (optionIndex === quizQuestions[questionIndex].correct) {
      setScore(score + 10);
      toast.success('¡Correcto! +10 puntos 🎉');
    } else {
      toast.error('¡Ups! Intenta de nuevo 😅');
    }

    if (questionIndex < quizQuestions.length - 1) {
      setTimeout(() => setQuestionIndex(questionIndex + 1), 1000);
    } else {
      setTimeout(() => {
        toast.success(`¡Juego terminado! Puntaje: ${score + (optionIndex === quizQuestions[questionIndex].correct ? 10 : 0)} 🏆`);
        setCurrentGame(null);
      }, 1000);
    }
  };

  // MEMORY GAME
  const initMemoryGame = () => {
  const cards = [...memoryCardTypes, ...memoryCardTypes].sort(() => Math.random() - 0.5);
    setMemoryCards(cards.map((type, idx) => ({ id: idx, type, flipped: false })));
    setFlipped([]);
    setMatched([]);
  };

  const flipCard = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(memoryCards[index].type)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first].type === memoryCards[second].type) {
        setMatched([...matched, memoryCards[first].type]);
        setScore(score + 10);
        toast.success('¡Par encontrado! +10 puntos 🎉');
        setFlipped([]);
        
        if (matched.length + 1 === memoryCardTypes.length) {
          setTimeout(() => {
            toast.success('¡Juego completado! 🏆');
            setCurrentGame(null);
          }, 1000);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  // SORT GAME
  const initSortGame = () => {
    const numbers = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
    setNumbersList(numbers.sort(() => Math.random() - 0.5));
    setSortedNumbers([]);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newList = [...numbersList];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);
    
    setNumbersList(newList);
    setDraggedIndex(null);
  };

  const checkSortOrder = () => {
    const isCorrect = numbersList.every((num, idx) => idx === 0 || num >= numbersList[idx - 1]);
    if (isCorrect) {
      setScore(score + 20);
      toast.success('¡Correcto! Los números están ordenados 🎉');
      setTimeout(() => setCurrentGame(null), 2000);
    } else {
      toast.error('Aún no están ordenados. ¡Seguí intentando! 💪');
    }
  };

  // GUESS CHART GAME
  const initGuessGame = () => {
    const datasets = [
      {
        data: { Perros: 15, Gatos: 10, Conejos: 5 },
        correctChart: 'barras',
        question: '¿Qué gráfico es mejor para comparar animales favoritos?'
      },
      {
        data: { Lunes: 5, Martes: 8, Miércoles: 6, Jueves: 10, Viernes: 7 },
        correctChart: 'lineas',
        question: '¿Qué gráfico muestra mejor cómo cambia algo con el tiempo?'
      }
    ];
    
    setGuessData(datasets[Math.floor(Math.random() * datasets.length)]);
    setSelectedAnswer(null);
  };

  const checkGuessAnswer = (answer) => {
    setSelectedAnswer(answer);
    if (answer === guessData.correctChart) {
      setScore(score + 15);
      toast.success('¡Correcto! +15 puntos 🎉');
      setTimeout(() => setCurrentGame(null), 2000);
    } else {
      toast.error('¡Ups! Esa no es la mejor opción 😅');
    }
  };

  const renderCurrentGame = () => {
    if (currentGame === 'quiz_estadistica') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 border-4 border-purple-300 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-black text-purple-600">{score} puntos</span>
              </div>
              <span className="text-lg font-bold text-gray-600">
                Pregunta {questionIndex + 1} de {quizQuestions.length}
              </span>
            </div>

            <h2 className="text-4xl font-heading font-bold text-gray-800 mb-8 text-center">
              {quizQuestions[questionIndex].question}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {quizQuestions[questionIndex].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => answerQuestion(idx)}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-4 border-purple-300 rounded-2xl p-6 text-xl font-bold text-gray-800 transition-all hover:scale-105"
                  data-testid={`quiz-option-${idx}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentGame === 'memory_graficos') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border-4 border-blue-300 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-black text-blue-600">{score} puntos</span>
              </div>
              <span className="text-lg font-bold text-gray-600">
                Parejas: {matched.length} / 6
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {memoryCards.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => flipCard(idx)}
                  className={`aspect-square rounded-2xl text-6xl flex items-center justify-center transition-all duration-300 ${
                    flipped.includes(idx) || matched.includes(card.type)
                      ? 'bg-blue-100 border-4 border-blue-500'
                      : 'bg-gray-200 border-4 border-gray-400 hover:scale-105'
                  }`}
                >
                  {flipped.includes(idx) || matched.includes(card.type) ? card.type : '❓'}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentGame === 'ordena_datos') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 border-4 border-green-300 shadow-2xl">
            <h2 className="text-3xl font-heading font-bold text-gray-800 mb-4 text-center">
              Arrastrá los números para ordenarlos de menor a mayor
            </h2>
            <p className="text-lg text-gray-600 text-center mb-8">¡Usá el mouse para mover las tarjetas!</p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {numbersList.map((num, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl p-8 text-4xl font-black text-center cursor-move hover:scale-105 transition-transform border-4 border-green-700 shadow-lg"
                >
                  {num}
                </div>
              ))}
            </div>

            <Button
              onClick={checkSortOrder}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-full py-6 text-xl font-bold"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              ¡Verificar Orden!
            </Button>
          </div>
        </div>
      );
    }

    if (currentGame === 'adivina_grafico' && guessData) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 border-4 border-pink-300 shadow-2xl">
            <h2 className="text-3xl font-heading font-bold text-gray-800 mb-4 text-center">
              {guessData.question}
            </h2>

            <div className="bg-pink-50 rounded-2xl p-6 mb-8 border-2 border-pink-200">
              <h3 className="text-xl font-bold mb-4 text-center">Datos:</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(guessData.data).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-3xl font-black text-pink-600">{value}</div>
                    <div className="text-sm text-gray-700">{key}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['barras', 'lineas', 'circular'].map((type) => (
                <button
                  key={type}
                  onClick={() => checkGuessAnswer(type)}
                  disabled={selectedAnswer !== null}
                  className={`p-6 rounded-2xl border-4 transition-all ${
                    selectedAnswer === type
                      ? type === guessData.correctChart
                        ? 'bg-green-100 border-green-500'
                        : 'bg-red-100 border-red-500'
                      : 'bg-white border-pink-300 hover:scale-105'
                  }`}
                >
                  <div className="text-5xl mb-2">
                    {type === 'barras' ? '📊' : type === 'lineas' ? '📈' : '🥧'}
                  </div>
                  <div className="font-bold text-lg capitalize">{type}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Juegos Educativos" educationLevel="primario" />
        
        <div className="p-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-heading font-black mb-2 flex items-center gap-3">
                  <Gamepad2 className="w-12 h-12" />
                  ¡Juegos!
                </h1>
                <p className="text-2xl font-accent">
                  Aprendé estadística jugando y divirtiéndote
                </p>
              </div>
              <div className="text-9xl">🎮</div>
            </div>
          </div>

          {!currentGame ? (
            <>
              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-3xl p-8 border-4 border-purple-200 hover:border-purple-400 transition-all hover:scale-105 shadow-lg"
                    data-testid={`game-${game.id}`}
                  >
                    <div className="text-6xl mb-4">{game.icon}</div>
                    <h3 className="text-2xl font-heading font-bold text-gray-800 mb-3">
                      {game.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-lg">{game.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="px-4 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                        {game.difficulty}
                      </span>
                      <Button
                        onClick={() => startGame(game.id)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 py-3 font-bold"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        ¡Jugar!
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <Button
                  onClick={() => setCurrentGame(null)}
                  variant="outline"
                  className="border-2 border-purple-400"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Volver a Juegos
                </Button>
              </div>
              {renderCurrentGame()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Juegos;
