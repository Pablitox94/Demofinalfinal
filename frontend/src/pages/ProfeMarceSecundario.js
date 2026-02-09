import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Loader2, Trash2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SidebarSecundario from '../components/SidebarSecundario';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfeMarceSecundario = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `secundario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mensaje de bienvenida
    setMessages([
      {
        role: 'assistant',
        content: `¡Hola! Soy la **Profe Marce**, tu asistente de estadística para nivel secundario. 📊

Estoy acá para ayudarte a entender conceptos estadísticos, resolver dudas sobre:
- Tablas de frecuencia (simples y agrupadas)
- Medidas de tendencia central (media, mediana, moda)
- Medidas de dispersión (varianza, desviación estándar)
- Gráficos estadísticos
- Interpretación de resultados

¿En qué puedo ayudarte hoy?`
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: inputMessage,
        sessionId: sessionId,
        educationLevel: 'secundario'
      });

      if (response.data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.response
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar mensaje');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema al procesar tu mensaje. ¿Podés intentar de nuevo?'
      }]);
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

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '¡Chat reiniciado! ¿En qué puedo ayudarte?'
    }]);
  };

  const suggestedQuestions = [
    '¿Qué es la media y cómo se calcula?',
    '¿Cuándo uso datos agrupados?',
    '¿Qué gráfico elijo para mis datos?',
    '¿Qué es la desviación estándar?',
    'Explicame la regla de Sturges'
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <SidebarSecundario />
      
      <div className="flex-1 lg:ml-64 flex flex-col h-screen">
        <Navbar projectName="Profe Marce" educationLevel="secundario" />
        
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-4 mb-4 text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/profemarce.png" 
                alt="Profe Marce" 
                className="w-14 h-14 rounded-full object-cover bg-white p-1"
              />
              <div>
                <h1 className="text-2xl font-heading font-bold">Profe Marce</h1>
                <p className="text-purple-200 text-sm">Tu asistente de estadística con IA</p>
              </div>
            </div>
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Chat
            </Button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-purple-600' 
                      : 'bg-white'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <img 
                        src="/profemarce.png" 
                        alt="Profe Marce" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                  
                                   <div className={`max-w-[75%] rounded-2xl px-4 py-3 break-words overflow-wrap-anywhere ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-gray-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 break-words overflow-wrap-anywhere">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-purple-900" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? (
                                <code className="bg-purple-200 text-purple-900 px-1 rounded text-sm" {...props} />
                              ) : (
                                <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm" {...props} />
                              )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <img 
                      src="/profemarce.png" 
                      alt="Profe Marce" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="bg-purple-50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-gray-600">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-3 border-t border-purple-100 bg-purple-50/50">
                <p className="text-xs text-gray-500 mb-2">Preguntas sugeridas:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage(q);
                      }}
                      className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-purple-100 bg-white">
              <div className="flex gap-3">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribí tu pregunta sobre estadística..."
                  className="flex-1 resize-none min-h-[50px] max-h-[150px]"
                  disabled={loading}
                  data-testid="chat-input"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 px-6"
                  data-testid="send-message-btn"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Presioná Enter para enviar • Shift + Enter para nueva línea
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfeMarceSecundario;
