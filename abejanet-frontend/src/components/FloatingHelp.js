import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaQuestionCircle, FaTimes, FaPaperPlane, FaComments } from 'react-icons/fa';
import './FloatingHelp.css';
import { ThemeContext } from '../ThemeContext';
import { FAQ, getAnswer } from './helpAssistant';

function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: Date.now(), sender: 'bot', text: '¡Hola! Soy el asistente de ayuda. ¿En qué puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textParam, quickQuestionId) => {
    const text = (textParam || input).trim();
    if (!text) return;
    const userMsg = { id: Date.now(), sender: 'user', text };
    const botMsg = { id: Date.now() + 1, sender: 'bot', text: getAnswer(text, quickQuestionId) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const askQuick = (question, id) => handleSend(question, id);

  return (
    <div className={'floating-help ' + (theme === 'dark' ? 'dark' : 'light')}>
      {isOpen && (
        <div className='help-panel'>
          <div className='help-header'>
            <div className='help-title'>
              <FaComments /> Ayuda / Chatbot
            </div>
            <button className='help-close' onClick={() => setIsOpen(false)} aria-label='Cerrar ayuda'>
              <FaTimes />
            </button>
          </div>
          <div className='help-body'>
            <div className='messages'>
              {messages.map(msg => (
                <div key={msg.id} className={'msg ' + msg.sender}>
                  <div className='msg-bubble'>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className='quick-questions'>
              {FAQ.map(f => (
                <button key={f.id} className='quick-btn' onClick={() => askQuick(f.question, f.id)}>
                  {f.question}
                </button>
              ))}
            </div>
          </div>
          <div className='help-input'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Escribe tu duda...'
              aria-label='Escribe tu duda'
              autoFocus
            />
            <button className='send-btn' onClick={() => handleSend()} aria-label='Enviar duda'>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
      <button className='help-toggle' onClick={() => setIsOpen(!isOpen)} title='Ayuda' aria-label={isOpen ? 'Cerrar ayuda' : 'Abrir ayuda'}>
        {isOpen ? <FaTimes /> : <FaQuestionCircle />}
      </button>
    </div>
  );
}

export default FloatingHelp;
