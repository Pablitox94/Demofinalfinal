import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Sparkles, MessageCircle, Trash2 } from 'lucide-react';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { trackQuestionAsked } from '../utils/achievementTracker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfeMarcePrimaria = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola amiguito! 👋 Soy Profe Marce, tu ayudante de estadística. ¿Qué querés saber hoy? ¡Preguntame lo que quieras! 😊',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`primario_${Date.now()}`);

  const suggestedQuestions = [
    '¿Qué es un promedio?',
    '¿Qué significa la moda?',
    '¿Para qué sirven los gráficos?',
    '¿Cómo se hace un gráfico de barras?',
    '¿Qué es la mediana?'
  ];

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: messageText,
        sessionId: sessionId,
        educationLevel: 'primario'
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Track for achievements
      trackQuestionAsked();
    } catch (error) {
      console.error('Error:', error);
      toast.error('¡Ups! Algo salió mal. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '¡Hola de nuevo! 👋 ¿En qué te puedo ayudar? 😊',
        timestamp: new Date()
      }
    ]);
    toast.success('Chat limpiado');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <SidebarPrimary />
      
      <div className="flex-1 lg:ml-64 w-full">
        <Navbar projectName="Profe Marce" educationLevel="primario" />
        
        <div className="p-4 sm:p-6 h-[calc(100vh-64px)] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                <img 
                  src="/profemarce.png" 
                  alt="Profe Marce" 
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover bg-white p-1 shadow-lg"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black">¡Hola! Soy Profe Marce</h1>
                  <p className="text-base sm:text-lg lg:text-xl font-accent">Tu ayudante de estadística - ¡Preguntame lo que quieras!</p>
                </div>
              </div>
              <Button
                onClick={clearChat}
                variant="outline"
                className="border-white text-white hover:bg-white/20 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Chat
              </Button>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-bold text-gray-600 mb-2">💡 Preguntas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-orange-200 rounded-full text-xs sm:text-sm font-medium text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-white rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-orange-200 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl p-3 sm:p-4 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-orange-300 to-amber-300 text-white rounded-br-none'
                        : 'bg-amber-50 border-2 border-amber-200 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src="/profemarce.png" 
                          alt="Profe Marce" 
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                        />
                        <span className="font-bold text-orange-900 text-sm sm:text-base">Profe Marce</span>
                      </div>
                    )}
                                        <div className={`prose prose-sm sm:prose-lg max-w-none break-words overflow-wrap-anywhere ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm sm:text-base lg:text-lg">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl sm:rounded-3xl rounded-bl-none p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/profemarce.png" 
                        alt="Profe Marce" 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                      <span className="font-bold text-orange-900 text-sm sm:text-base">Profe Marce está escribiendo</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t-2 sm:border-t-4 border-orange-100 bg-orange-50">
              <div className="flex gap-2 sm:gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Escribí tu pregunta acá..."
                  className="flex-1 text-sm sm:text-base lg:text-lg rounded-full border-2 border-orange-300 focus:border-orange-400 py-4 sm:py-5 lg:py-6"
                  disabled={loading}
                  data-testid="chat-input"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full px-4 sm:px-6 lg:px-8 shadow-lg disabled:opacity-50"
                  data-testid="send-button"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfeMarcePrimaria;
