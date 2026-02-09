import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SidebarPrimary from '../components/SidebarPrimary';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { trackQuestionAsked } from '../utils/achievementTracker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfeMarce = () => {
  const [educationLevel, setEducationLevel] = useState('secundario');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  useEffect(() => {
    const level = localStorage.getItem('educationLevel') || 'secundario';
    setEducationLevel(level);
    
    let welcomeMessage = '';
    if (level === 'primario') {
      welcomeMessage = `¡Hola! Soy Profe Marce, tu amiga que te va a ayudar con la estadística. ¿En qué puedo ayudarte hoy? 😊`;
    } else {
      welcomeMessage = `¡Hola! Soy Profe Marce, tu asistente de estadística. ¿En qué puedo ayudarte hoy?`;
    }
    
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: inputMessage,
        sessionId: sessionId,
        educationLevel: educationLevel
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Track question for achievements (only primario)
      if (educationLevel === 'primario') {
        trackQuestionAsked();
      }
    } catch (error) {
      console.error('Error en chat:', error);
      toast.error('Error al enviar mensaje');
      
      const errorMessage = {
        role: 'assistant',
        content: 'Disculpá, tuve un problema. ¿Podés intentar de nuevo?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    '¿Qué es la media?',
    '¿Cómo calculo la mediana?',
    'Explicame las variables cualitativas',
    '¿Qué gráfico usar para datos categóricos?'
  ];

  return (
    <div className="flex min-h-screen bg-pink-50">
      {educationLevel === 'primario' ? <SidebarPrimary /> : <Sidebar educationLevel={educationLevel} />}
      
      <div className="flex-1 ml-64">
        <Navbar projectName="Profe Marce - Asistente AI" educationLevel={educationLevel} />
        
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold" data-testid="profe-marce-title">Profe Marce</h1>
                <p className="text-pink-100">Tu asistente educativo de estadística</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`chat-message-${idx}`}
              >
                <div
                  className={`max-w-2xl rounded-3xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-800 border border-pink-100 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-bold text-pink-600">Profe Marce</span>
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-2 block">
                    {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-3xl p-4 border border-pink-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 mb-3 font-medium">Preguntas sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMessage(q)}
                    className="bg-white border border-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm hover:bg-pink-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-pink-100 bg-white p-6">
            <div className="max-w-4xl mx-auto flex gap-3">
              <Input
                data-testid="chat-input"
                placeholder="Escribí tu pregunta sobre estadística..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1 rounded-full border-2 border-pink-200 focus:border-pink-500 px-6 py-3"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                data-testid="send-message-button"
                className="btn-primary rounded-full px-8"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfeMarce;